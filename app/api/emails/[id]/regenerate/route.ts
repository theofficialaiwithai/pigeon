import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { callClaude } from "@/lib/anthropic-fetch";
import { extractJSON } from "@/lib/extract-json";
import { db } from "@/lib/db";
import {
  cohorts,
  emails,
  emailSequences,
  emailVariants,
  teachers,
  voiceProfiles,
} from "@/lib/schema";

export const runtime = "nodejs";
export const maxDuration = 60;

function asDateStr(v: unknown): string {
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  return String(v);
}

const TYPE_DESCRIPTIONS: Record<string, string> = {
  pre_launch_warmup:
    "Pre-Launch Warmup (2 weeks before cart opens) — warms the list, builds anticipation without pitching",
  list_primer:
    "List Primer (1 week before cart opens) — primes readers for what is coming, sets up the launch",
  cart_open: "Cart Open announcement — enrollment just opened, drive clicks now",
  curriculum_deep_dive:
    "Curriculum Deep Dive (2 days after cart opens) — details what students learn and why each part matters",
  student_story:
    "Student Story (4 days after cart opens) — one specific student success story with concrete, believable results",
  objection_handling:
    "Objection Handling (6 days after cart opens) — addresses the top 1-2 reasons people hesitate or self-exclude",
  close_48h: "48-Hour Closing — urgency nudge with 48 hours left to enroll",
  close_24h: "24-Hour Closing — urgency nudge with 24 hours left to enroll",
  final_call:
    "Final Call (cart closes today) — last chance to enroll, highest urgency",
};

type ParsedEmail = {
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

export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // ── load email ────────────────────────────────────────────────────────────
    const [email] = await db
      .select()
      .from(emails)
      .where(eq(emails.id, params.id))
      .limit(1);
    if (!email)
      return NextResponse.json({ error: "Email not found" }, { status: 404 });

    // ── walk up: sequence → cohort → teacher (auth check) → voice profile ────
    const [sequence] = await db
      .select()
      .from(emailSequences)
      .where(eq(emailSequences.id, email.sequenceId))
      .limit(1);

    const [cohort] = await db
      .select()
      .from(cohorts)
      .where(eq(cohorts.id, sequence.cohortId))
      .limit(1);

    const [teacher] = await db
      .select()
      .from(teachers)
      .where(eq(teachers.clerkUserId, userId))
      .limit(1);

    if (!teacher || teacher.id !== cohort.teacherId)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const [vp] = await db
      .select()
      .from(voiceProfiles)
      .where(eq(voiceProfiles.teacherId, teacher.id))
      .limit(1);
    if (!vp?.fullProfileJson)
      return NextResponse.json(
        { error: "Voice profile not found" },
        { status: 400 }
      );

    // ── sibling email subjects for context ────────────────────────────────────
    const siblings = await db
      .select({ emailType: emails.emailType, subjectLine: emails.subjectLine })
      .from(emails)
      .where(eq(emails.sequenceId, sequence.id));

    const siblingContext = siblings
      .filter((s) => s.emailType !== email.emailType)
      .map((s) => `  ${s.emailType}: "${s.subjectLine}"`)
      .join("\n");

    const isFinalCall = email.emailType === "final_call";

    // ── prompt ────────────────────────────────────────────────────────────────
    const systemPrompt = `You are rewriting a single email in an existing 9-email launch sequence for a course creator.
Write ONLY in their voice — not yours.

Voice Profile: ${JSON.stringify(vp.fullProfileJson, null, 2)}

Follow every rule in the profile. Match sentence length, opening style, closing style, vocabulary, and CTA style exactly.
Do NOT add marketing language outside their voice profile.

AVOID generic AI writing patterns unless the Voice Profile examples show the teacher actually writes that way: no em dash used as a crutch, no 'it's not X — it's Y' contrast framing, no stock vocabulary (delve, boast, foster, leverage, navigate, robust, comprehensive, multifaceted, tapestry, testament, elevate, unlock, seamless, game-changer). Vary sentence and paragraph length to match the teacher's real rhythm instead of defaulting to smooth, uniform pacing.

Respond with raw JSON only. Do not wrap the response in markdown code fences or backticks. Do not include any text before or after the JSON object.`;

    const schemaBlock = isFinalCall
      ? `Schema:
{ "subject_line": string, "preview_text": string, "body_html": string,
  "variants": [
    { "variant_type": "urgency_led", "subject_line": string, "preview_text": string, "body_html": string },
    { "variant_type": "results_led", "subject_line": string, "preview_text": string, "body_html": string },
    { "variant_type": "personal_note", "subject_line": string, "preview_text": string, "body_html": string }
  ]
}
For final_call: write 3 variants (urgency_led, results_led, personal_note).`
      : `Schema: { "subject_line": string, "preview_text": string, "body_html": string }`;

    const userMessage = `Program: ${cohort.programName}
Curriculum: ${cohort.curriculumSummary}${cohort.seatCount ? `\nSeats Available: ${cohort.seatCount}` : ""}${cohort.priceUsd ? `\nPrice: $${cohort.priceUsd}` : ""}
Cart Opens: ${asDateStr(cohort.cartOpenDate)}
Cart Closes: ${asDateStr(cohort.cartCloseDate)}
Cohort Starts: ${asDateStr(cohort.cohortStartDate)}

OTHER EMAILS IN THIS SEQUENCE (already written — do not repeat their themes, angles, or arguments):
${siblingContext}

Rewrite ONLY this email: ${TYPE_DESCRIPTIONS[email.emailType] ?? email.emailType}

${schemaBlock}
body_html: use clean <p> tags only. No CSS, no inline styles.`;

    // ── call Claude ───────────────────────────────────────────────────────────
    const { text: rawText, stopReason } = await callClaude({
      model: "claude-sonnet-4-6",
      max_tokens: isFinalCall ? 8000 : 2000,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    });

    let parsed: ParsedEmail;
    try {
      parsed = JSON.parse(extractJSON(rawText)) as ParsedEmail;
    } catch (parseErr) {
      console.error("[emails/regenerate] JSON parse error:", parseErr);
      console.error("[emails/regenerate] stop_reason:", stopReason);
      console.error("[emails/regenerate] Raw response:", rawText);
      return NextResponse.json(
        { error: "Failed to parse Claude response" },
        { status: 500 }
      );
    }

    // ── persist ───────────────────────────────────────────────────────────────
    await db
      .update(emails)
      .set({
        subjectLine: parsed.subject_line,
        previewText: parsed.preview_text ?? null,
        bodyHtml: parsed.body_html,
        approvalStatus: "draft",
        updatedAt: new Date(),
      })
      .where(eq(emails.id, params.id));

    if (isFinalCall && parsed.variants?.length) {
      for (const v of parsed.variants) {
        await db
          .update(emailVariants)
          .set({
            subjectLine: v.subject_line,
            previewText: v.preview_text ?? null,
            bodyHtml: v.body_html,
          })
          .where(
            and(
              eq(emailVariants.emailId, params.id),
              eq(emailVariants.variantType, v.variant_type)
            )
          );
      }
    }

    // ── respond ───────────────────────────────────────────────────────────────
    return NextResponse.json({
      subjectLine: parsed.subject_line,
      previewText: parsed.preview_text ?? "",
      bodyHtml: parsed.body_html,
      ...(parsed.variants && {
        variants: parsed.variants.map((v) => ({
          variantType: v.variant_type,
          subjectLine: v.subject_line,
          previewText: v.preview_text ?? "",
          bodyHtml: v.body_html,
        })),
      }),
    });
  } catch (err) {
    console.error("[emails/regenerate] Unhandled error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
