import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { db } from "@/lib/db";
import {
  cohorts,
  emailSequences,
  emails,
  emailVariants,
  teachers,
  voiceProfiles,
} from "@/lib/schema";
import { toSendAt, formatSendDate } from "@/lib/dates";
import { extractJSON } from "@/lib/extract-json";

// Edge runtime: CPU-time limit (not wall-clock), so waiting on Claude's HTTP
// response doesn't count — avoids the 10s serverless cap on Hobby plan.
export const runtime = "edge";

const EMAIL_SCHEDULE = [
  { type: "pre_launch_warmup", base: "cartOpen", offset: -14 },
  { type: "list_primer", base: "cartOpen", offset: -7 },
  { type: "cart_open", base: "cartOpen", offset: 0 },
  { type: "curriculum_deep_dive", base: "cartOpen", offset: 2 },
  { type: "student_story", base: "cartOpen", offset: 4 },
  { type: "objection_handling", base: "cartOpen", offset: 6 },
  { type: "close_48h", base: "cartClose", offset: -2 },
  { type: "close_24h", base: "cartClose", offset: -1 },
  { type: "final_call", base: "cartClose", offset: 0 },
] as const;

type EmailFromClaude = {
  email_type: string;
  subject_line: string;
  preview_text: string;
  body_html: string;
  variants?: Array<{
    variant_type: string;
    subject_line: string;
    preview_text: string;
    body_html: string;
  }>;
};

/** Normalise a Drizzle `date` column value to "YYYY-MM-DD" string. */
function asDateStr(value: unknown): string {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }
  return String(value);
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    const { cohortId } = (body ?? {}) as { cohortId?: string };

    if (!cohortId) {
      return NextResponse.json(
        { error: "cohortId is required" },
        { status: 400 }
      );
    }

    const [teacher] = await db
      .select()
      .from(teachers)
      .where(eq(teachers.clerkUserId, userId))
      .limit(1);

    if (!teacher) {
      return NextResponse.json(
        { error: "Teacher not found" },
        { status: 404 }
      );
    }

    const [cohort] = await db
      .select()
      .from(cohorts)
      .where(and(eq(cohorts.id, cohortId), eq(cohorts.teacherId, teacher.id)))
      .limit(1);

    if (!cohort) {
      return NextResponse.json(
        { error: "Cohort not found" },
        { status: 404 }
      );
    }

    const [vp] = await db
      .select()
      .from(voiceProfiles)
      .where(eq(voiceProfiles.teacherId, teacher.id))
      .limit(1);

    if (!vp?.fullProfileJson) {
      return NextResponse.json(
        { error: "Set up your voice profile first" },
        { status: 400 }
      );
    }

    const tz = teacher.timezone ?? "America/New_York";
    const cartOpenStr = asDateStr(cohort.cartOpenDate);
    const cartCloseStr = asDateStr(cohort.cartCloseDate);

    // Build send-date map
    const sendDates = new Map<string, Date>();
    for (const entry of EMAIL_SCHEDULE) {
      const base = entry.base === "cartOpen" ? cartOpenStr : cartCloseStr;
      sendDates.set(entry.type, toSendAt(base, entry.offset, tz));
    }

    // Format schedule for user message
    const scheduleLines = EMAIL_SCHEDULE.map(({ type }) => {
      const date = sendDates.get(type)!;
      return `  ${type}: ${formatSendDate(date, tz)}`;
    }).join("\n");

    const systemPrompt = `You are writing a launch email sequence for a course creator.
Write ONLY in their voice — not yours.

Voice Profile: ${JSON.stringify(vp.fullProfileJson, null, 2)}

Follow every rule in the profile. Match sentence length, opening style, closing style, vocabulary, and CTA style exactly.
Do NOT add marketing language outside their voice profile.

AVOID generic AI writing patterns unless the Voice Profile examples show the teacher actually writes that way: no em dash used as a crutch, no 'it's not X — it's Y' contrast framing, no stock vocabulary (delve, boast, foster, leverage, navigate, robust, comprehensive, multifaceted, tapestry, testament, elevate, unlock, seamless, game-changer). Vary sentence and paragraph length to match the teacher's real rhythm instead of defaulting to smooth, uniform pacing. Take a clear point of view instead of hedging. Use the curriculum summary's actual specifics, not generic paraphrase.

Write 9 emails for the program below.
For final_call: write 3 variants (urgency_led, results_led, personal_note).
Return ONLY valid JSON — no markdown, no code fences, no explanation.

Schema:
{ "emails": [
  { "email_type": string, "subject_line": string, "preview_text": string, "body_html": string },
  { "email_type": "final_call", "subject_line": string, "preview_text": string, "body_html": string,
    "variants": [
      { "variant_type": "urgency_led", "subject_line": string, "preview_text": string, "body_html": string },
      { "variant_type": "results_led", "subject_line": string, "preview_text": string, "body_html": string },
      { "variant_type": "personal_note", "subject_line": string, "preview_text": string, "body_html": string }
    ]
  }
] }

body_html: use clean <p> tags. No CSS, no inline styles, no complex HTML.`;

    const userMessage = `Program: ${cohort.programName}
Curriculum: ${cohort.curriculumSummary}
Cart Opens: ${formatSendDate(sendDates.get("cart_open")!, tz)}
Cart Closes: ${formatSendDate(sendDates.get("final_call")!, tz)}
Cohort Starts: ${asDateStr(cohort.cohortStartDate)}${cohort.seatCount ? `\nSeats Available: ${cohort.seatCount}` : ""}${cohort.priceUsd ? `\nPrice: $${cohort.priceUsd}` : ""}

Send schedule:
${scheduleLines}`;

    // Instantiate inside handler so ANTHROPIC_API_KEY is read at runtime
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4000,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    });

    const rawText =
      message.content[0].type === "text" ? message.content[0].text.trim() : "";

    let parsed: { emails: EmailFromClaude[] };
    try {
      parsed = JSON.parse(extractJSON(rawText));
    } catch (parseErr) {
      console.error("[sequence/generate] JSON parse error:", parseErr);
      console.error("[sequence/generate] Raw Claude response:", rawText);
      return NextResponse.json(
        { error: "Failed to parse Claude response", raw: rawText.slice(0, 500) },
        { status: 500 }
      );
    }

    // Create email_sequence record
    const [sequence] = await db
      .insert(emailSequences)
      .values({
        cohortId: cohort.id,
        teacherId: teacher.id,
        status: "draft",
      })
      .returning();

    // Insert emails + variants
    for (let index = 0; index < parsed.emails.length; index++) {
      const emailData = parsed.emails[index];
      const scheduledSendAt = sendDates.get(emailData.email_type) ?? null;

      const [savedEmail] = await db
        .insert(emails)
        .values({
          sequenceId: sequence.id,
          position: index + 1,
          emailType: emailData.email_type,
          subjectLine: emailData.subject_line,
          previewText: emailData.preview_text ?? null,
          bodyHtml: emailData.body_html,
          scheduledSendAt,
          approvalStatus: "draft",
        })
        .returning();

      if (emailData.variants?.length) {
        await db.insert(emailVariants).values(
          emailData.variants.map(
            (v: {
              variant_type: string;
              subject_line: string;
              preview_text: string;
              body_html: string;
            }) => ({
              emailId: savedEmail.id,
              variantType: v.variant_type,
              subjectLine: v.subject_line,
              previewText: v.preview_text ?? null,
              bodyHtml: v.body_html,
              isSelected: false,
            })
          )
        );
      }
    }

    // Mark cohort as ready
    await db
      .update(cohorts)
      .set({ status: "ready", updatedAt: new Date() })
      .where(eq(cohorts.id, cohort.id));

    return NextResponse.json({ sequenceId: sequence.id });
  } catch (err) {
    console.error("[sequence/generate] Unhandled error:", err);
    const message = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : undefined;
    return NextResponse.json(
      { error: message, stack },
      { status: 500 }
    );
  }
}
