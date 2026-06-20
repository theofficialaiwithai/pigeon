import { eq } from "drizzle-orm";
import { callClaudeTool } from "@/lib/anthropic-fetch";
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
import { sendNotification } from "@/lib/notifications";

// ─── Types ────────────────────────────────────────────────────────────────────

type EmailVariantFromClaude = {
  variant_type: string;
  subject_line: string;
  preview_text: string;
  body_html: string;
};

type EmailFromClaude = {
  email_type: string;
  subject_line: string;
  preview_text: string;
  body_html: string;
  variants?: EmailVariantFromClaude[];
};

type SequenceOutput = { emails: EmailFromClaude[] };

function asDateStr(value: unknown): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value);
}

// ─── Shared voice preamble ────────────────────────────────────────────────────

function voicePreamble(vpJson: unknown) {
  return `Write ONLY in their voice — not yours.

Voice Profile: ${JSON.stringify(vpJson, null, 2)}

Follow every rule in the profile. Match sentence length, opening style, closing style, vocabulary, and CTA style exactly.
Do NOT add marketing language outside their voice profile.
AVOID generic AI writing patterns: no em dashes as a crutch, no 'it's not X — it's Y' framing, no stock vocabulary (delve, boast, foster, leverage, navigate, robust, seamless, game-changer, tapestry, testament, elevate, unlock). Vary sentence and paragraph length to match the teacher's real rhythm. Take a clear point of view instead of hedging.
body_html: use clean <p> tags only. No CSS, no inline styles, no complex HTML.
Keep each email body to 150–200 words maximum.`;
}

// ─── LAUNCH SEQUENCE ─────────────────────────────────────────────────────────

const LAUNCH_SCHEDULE = [
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

const LAUNCH_SCHEMA = {
  type: "object",
  required: ["emails"],
  properties: {
    emails: {
      type: "array",
      items: {
        type: "object",
        required: ["email_type", "subject_line", "preview_text", "body_html"],
        properties: {
          email_type: {
            type: "string",
            enum: ["pre_launch_warmup","list_primer","cart_open","curriculum_deep_dive","student_story","objection_handling","close_48h","close_24h","final_call"],
          },
          subject_line: { type: "string" },
          preview_text: { type: "string" },
          body_html: { type: "string" },
          variants: {
            type: "array",
            items: {
              type: "object",
              required: ["variant_type","subject_line","preview_text","body_html"],
              properties: {
                variant_type: { type: "string", enum: ["urgency_led","results_led","personal_note"] },
                subject_line: { type: "string" },
                preview_text: { type: "string" },
                body_html: { type: "string" },
              },
            },
          },
        },
      },
    },
  },
};

async function generateLaunch(cohort: typeof cohorts.$inferSelect, vpJson: unknown, tz: string): Promise<SequenceOutput> {
  const cartOpenStr = asDateStr(cohort.cartOpenDate);
  const cartCloseStr = asDateStr(cohort.cartCloseDate);

  const sendDates = new Map<string, Date>();
  for (const entry of LAUNCH_SCHEDULE) {
    const base = entry.base === "cartOpen" ? cartOpenStr : cartCloseStr;
    sendDates.set(entry.type, toSendAt(base, entry.offset, tz));
  }

  const scheduleLines = LAUNCH_SCHEDULE.map(({ type }) =>
    `  ${type}: ${formatSendDate(sendDates.get(type)!, tz)}`
  ).join("\n");

  return callClaudeTool<SequenceOutput>({
    model: "claude-sonnet-4-6",
    max_tokens: 16000,
    system: `You are writing a launch email sequence for a course creator.\n${voicePreamble(vpJson)}\n\nWrite 9 emails for the program below. For final_call: include a variants array with 3 entries (urgency_led, results_led, personal_note).`,
    messages: [{
      role: "user",
      content: `Program: ${cohort.programName}
Curriculum: ${cohort.curriculumSummary}
Cart Opens: ${formatSendDate(sendDates.get("cart_open")!, tz)}
Cart Closes: ${formatSendDate(sendDates.get("final_call")!, tz)}
Cohort Starts: ${asDateStr(cohort.cohortStartDate)}${cohort.seatCount ? `\nSeats Available: ${cohort.seatCount}` : ""}${cohort.priceUsd ? `\nPrice: $${cohort.priceUsd}` : ""}

Send schedule:
${scheduleLines}`,
    }],
    toolName: "generate_email_sequence",
    toolDescription: "Output the complete 9-email launch sequence.",
    inputSchema: LAUNCH_SCHEMA,
  });
}

// ─── RE-ENGAGEMENT SEQUENCE ───────────────────────────────────────────────────

const REENGAGEMENT_EMAIL_TYPES = [
  "reengagement_opening",
  "reengagement_value",
  "reengagement_story",
  "reengagement_offer",
  "reengagement_final",
] as const;

const REENGAGEMENT_SCHEMA = {
  type: "object",
  required: ["emails"],
  properties: {
    emails: {
      type: "array",
      items: {
        type: "object",
        required: ["email_type", "subject_line", "preview_text", "body_html"],
        properties: {
          email_type: { type: "string", enum: [...REENGAGEMENT_EMAIL_TYPES] },
          subject_line: { type: "string" },
          preview_text: { type: "string" },
          body_html: { type: "string" },
        },
      },
    },
  },
};

async function generateReengagement(cohort: typeof cohorts.$inferSelect, vpJson: unknown): Promise<SequenceOutput> {
  return callClaudeTool<SequenceOutput>({
    model: "claude-sonnet-4-6",
    max_tokens: 8000,
    system: `You are writing a re-engagement email sequence for a course creator who wants to win back cold subscribers.\n${voicePreamble(vpJson)}\n\nWrite exactly 5 emails using these types in order: ${REENGAGEMENT_EMAIL_TYPES.join(", ")}.\n- reengagement_opening: acknowledge the silence honestly, no guilt-tripping\n- reengagement_value: give a genuinely useful tip or insight, no ask\n- reengagement_story: share a relatable story or student result\n- reengagement_offer: present a low-friction next step (free resource, call, content)\n- reengagement_final: soft break-up — make it easy to stay or go`,
    messages: [{
      role: "user",
      content: `List/Program: ${cohort.programName}
Context: ${cohort.curriculumSummary}`,
    }],
    toolName: "generate_email_sequence",
    toolDescription: "Output the 5-email re-engagement sequence.",
    inputSchema: REENGAGEMENT_SCHEMA,
  });
}

// ─── WEEKLY NEWSLETTER ────────────────────────────────────────────────────────

const NEWSLETTER_EMAIL_TYPES = [
  "newsletter_1",
  "newsletter_2",
  "newsletter_3",
  "newsletter_4",
] as const;

const NEWSLETTER_SCHEMA = {
  type: "object",
  required: ["emails"],
  properties: {
    emails: {
      type: "array",
      items: {
        type: "object",
        required: ["email_type", "subject_line", "preview_text", "body_html"],
        properties: {
          email_type: { type: "string", enum: [...NEWSLETTER_EMAIL_TYPES] },
          subject_line: { type: "string" },
          preview_text: { type: "string" },
          body_html: { type: "string" },
        },
      },
    },
  },
};

async function generateNewsletter(cohort: typeof cohorts.$inferSelect, vpJson: unknown): Promise<SequenceOutput> {
  return callClaudeTool<SequenceOutput>({
    model: "claude-sonnet-4-6",
    max_tokens: 8000,
    system: `You are writing a weekly newsletter series for a course creator.\n${voicePreamble(vpJson)}\n\nWrite exactly 4 newsletter issues (newsletter_1 through newsletter_4). Each issue should:\n- Open with a hook that earns the next sentence\n- Deliver one clear, actionable insight drawn from the topics provided\n- End with a simple, low-friction CTA (reply, share, try something)\n- Feel like a real person wrote it on a Tuesday morning, not a content calendar`,
    messages: [{
      role: "user",
      content: `Newsletter: ${cohort.programName}
Topics and themes: ${cohort.curriculumSummary}`,
    }],
    toolName: "generate_email_sequence",
    toolDescription: "Output the 4-issue weekly newsletter series.",
    inputSchema: NEWSLETTER_SCHEMA,
  });
}

// ─── Persist helpers ──────────────────────────────────────────────────────────

async function persistSequence(
  cohort: typeof cohorts.$inferSelect,
  teacher: typeof teachers.$inferSelect,
  result: SequenceOutput,
  sendDates?: Map<string, Date>
): Promise<string> {
  const [sequence] = await db
    .insert(emailSequences)
    .values({ cohortId: cohort.id, teacherId: teacher.id, status: "draft" })
    .returning();

  for (let index = 0; index < result.emails.length; index++) {
    const emailData = result.emails[index];
    const scheduledSendAt = sendDates?.get(emailData.email_type) ?? null;

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

  await db.update(cohorts).set({ status: "ready", updatedAt: new Date() }).where(eq(cohorts.id, cohort.id));

  return sequence.id;
}

// ─── Public entry point ───────────────────────────────────────────────────────

/**
 * Fetches cohort + teacher + voice profile, calls Claude via tool_use
 * (guaranteed valid JSON), persists the sequence, and fires the success
 * notification. Routes to the correct generator based on sequenceType.
 * Throws on any failure — callers are responsible for catching/retrying.
 */
export async function generateSequenceForCohort(cohortId: string): Promise<string> {
  const [cohort] = await db.select().from(cohorts).where(eq(cohorts.id, cohortId)).limit(1);
  if (!cohort) throw new Error(`Cohort not found: ${cohortId}`);

  const [teacher] = await db.select().from(teachers).where(eq(teachers.id, cohort.teacherId)).limit(1);
  if (!teacher) throw new Error("Teacher not found");

  const [vp] = await db.select().from(voiceProfiles).where(eq(voiceProfiles.teacherId, teacher.id)).limit(1);
  if (!vp?.fullProfileJson) throw new Error("Voice profile not set up");

  const tz = teacher.timezone ?? "America/New_York";
  const sequenceType = cohort.sequenceType ?? "launch";

  let result: SequenceOutput;
  let sendDates: Map<string, Date> | undefined;

  if (sequenceType === "reengagement") {
    result = await generateReengagement(cohort, vp.fullProfileJson);
  } else if (sequenceType === "newsletter") {
    result = await generateNewsletter(cohort, vp.fullProfileJson);
  } else {
    // launch (default)
    const cartOpenStr = asDateStr(cohort.cartOpenDate);
    const cartCloseStr = asDateStr(cohort.cartCloseDate);
    sendDates = new Map<string, Date>();
    for (const entry of LAUNCH_SCHEDULE) {
      const base = entry.base === "cartOpen" ? cartOpenStr : cartCloseStr;
      sendDates.set(entry.type, toSendAt(base, entry.offset, tz));
    }
    result = await generateLaunch(cohort, vp.fullProfileJson, tz);
  }

  const sequenceId = await persistSequence(cohort, teacher, result, sendDates);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://pigeon.app";
  const typeLabel = sequenceType === "reengagement" ? "re-engagement" : sequenceType === "newsletter" ? "newsletter" : "launch";
  void sendNotification({
    to: teacher.email,
    subject: "Your Pigeon sequence is ready",
    body: `Your ${typeLabel} sequence for "${cohort.programName}" has been generated and is ready to review.\n\nOpen the sequence editor: ${appUrl}/cohorts/${cohort.id}/sequence`,
  });

  return sequenceId;
}
