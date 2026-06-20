import { eq } from "drizzle-orm";
import { callClaude } from "@/lib/anthropic-fetch";
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
import { sendNotification } from "@/lib/notifications";

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

function asDateStr(value: unknown): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value);
}

/**
 * Core generation logic. Fetches cohort + teacher + voice profile, calls
 * Claude, persists the sequence, and fires the success notification.
 * Throws on any failure — callers are responsible for catching.
 * Returns the new sequenceId.
 */
export async function generateSequenceForCohort(cohortId: string): Promise<string> {
  const [cohort] = await db
    .select()
    .from(cohorts)
    .where(eq(cohorts.id, cohortId))
    .limit(1);
  if (!cohort) throw new Error(`Cohort not found: ${cohortId}`);

  const [teacher] = await db
    .select()
    .from(teachers)
    .where(eq(teachers.id, cohort.teacherId))
    .limit(1);
  if (!teacher) throw new Error("Teacher not found");

  const [vp] = await db
    .select()
    .from(voiceProfiles)
    .where(eq(voiceProfiles.teacherId, teacher.id))
    .limit(1);
  if (!vp?.fullProfileJson) throw new Error("Voice profile not set up");

  const tz = teacher.timezone ?? "America/New_York";
  const cartOpenStr = asDateStr(cohort.cartOpenDate);
  const cartCloseStr = asDateStr(cohort.cartCloseDate);

  const sendDates = new Map<string, Date>();
  for (const entry of EMAIL_SCHEDULE) {
    const base = entry.base === "cartOpen" ? cartOpenStr : cartCloseStr;
    sendDates.set(entry.type, toSendAt(base, entry.offset, tz));
  }

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
Keep each email body to 150–200 words maximum. Be concise — launch emails perform better short.
Respond with raw JSON only. Do not wrap the response in markdown code fences or backticks. Do not include any text before or after the JSON object.

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

  const { text: rawText, stopReason } = await callClaude({
    model: "claude-sonnet-4-6",
    max_tokens: 16000,
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }],
  });

  if (stopReason === "max_tokens") {
    console.error("[generate-sequence] Response truncated (stop_reason=max_tokens). Raw length:", rawText.length);
    console.error("[generate-sequence] Truncated tail:", rawText.slice(-300));
    throw new Error(
      "The sequence was too long to generate in one pass. Try shortening your curriculum summary and try again."
    );
  }

  let parsed: { emails: EmailFromClaude[] };
  try {
    parsed = JSON.parse(extractJSON(rawText)) as { emails: EmailFromClaude[] };
  } catch (parseErr) {
    console.error("[generate-sequence] JSON parse error:", parseErr);
    console.error("[generate-sequence] stop_reason:", stopReason);
    console.error("[generate-sequence] Raw response (first 1000 chars):", rawText.slice(0, 1000));
    console.error("[generate-sequence] Raw response (last 500 chars):", rawText.slice(-500));
    throw new Error(
      `Failed to parse Claude response (stop_reason=${stopReason}). Check server logs for the raw response.`
    );
  }

  const [sequence] = await db
    .insert(emailSequences)
    .values({ cohortId: cohort.id, teacherId: teacher.id, status: "draft" })
    .returning();

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
        emailData.variants.map((v) => ({
          emailId: savedEmail.id,
          variantType: v.variant_type,
          subjectLine: v.subject_line,
          previewText: v.preview_text ?? null,
          bodyHtml: v.body_html,
          isSelected: false,
        }))
      );
    }
  }

  await db
    .update(cohorts)
    .set({ status: "ready", updatedAt: new Date() })
    .where(eq(cohorts.id, cohort.id));

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://pigeon.app";
  void sendNotification({
    to: teacher.email,
    subject: "Your Pigeon sequence is ready",
    body: `Your 9-email launch sequence for "${cohort.programName}" has been generated and is ready to review.\n\nOpen the sequence editor: ${appUrl}/cohorts/${cohort.id}/sequence`,
  });

  return sequence.id;
}
