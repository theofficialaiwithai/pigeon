import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  cohorts,
  emailSequences,
  emails,
  emailVariants,
  teachers,
} from "@/lib/schema";
import { callClaude } from "@/lib/anthropic-fetch";
import { sendNotification } from "@/lib/notifications";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Pull every email in every sequence, joined with its cohort + teacher.
  // We filter pending conditions in JS so we can apply the "fully-approved
  // but unexported" rule across a whole sequence without a complex subquery.
  const allRows = await db
    .select({
      teacherId: teachers.id,
      teacherEmail: teachers.email,
      teacherName: teachers.name,
      cohortId: cohorts.id,
      cohortName: cohorts.programName,
      sequenceId: emailSequences.id,
      emailId: emails.id,
      emailType: emails.emailType,
      subjectLine: emails.subjectLine,
      approvalStatus: emails.approvalStatus,
      convertkitBroadcastId: emails.convertkitBroadcastId,
    })
    .from(emails)
    .innerJoin(emailSequences, eq(emails.sequenceId, emailSequences.id))
    .innerJoin(cohorts, eq(emailSequences.cohortId, cohorts.id))
    .innerJoin(teachers, eq(cohorts.teacherId, teachers.id));

  if (allRows.length === 0) {
    return Response.json({ ok: true, teachersNotified: 0 });
  }

  // Which final_call emails already have a selected variant?
  const selectedVariantRows = await db
    .select({ emailId: emailVariants.emailId })
    .from(emailVariants)
    .where(eq(emailVariants.isSelected, true));

  const selectedEmailIds = new Set(selectedVariantRows.map((v) => v.emailId));

  // ── Group rows by teacher → cohort → sequence ──────────────────────────────

  type Row = (typeof allRows)[number];

  interface SequenceBucket {
    emails: Row[];
  }
  interface CohortBucket {
    cohortName: string;
    sequences: Map<string, SequenceBucket>;
  }
  interface TeacherBucket {
    teacherEmail: string;
    teacherName: string | null;
    cohorts: Map<string, CohortBucket>;
  }

  const teacherMap = new Map<string, TeacherBucket>();

  for (const row of allRows) {
    if (!teacherMap.has(row.teacherId)) {
      teacherMap.set(row.teacherId, {
        teacherEmail: row.teacherEmail,
        teacherName: row.teacherName,
        cohorts: new Map(),
      });
    }
    const teacher = teacherMap.get(row.teacherId)!;

    if (!teacher.cohorts.has(row.cohortId)) {
      teacher.cohorts.set(row.cohortId, {
        cohortName: row.cohortName,
        sequences: new Map(),
      });
    }
    const cohort = teacher.cohorts.get(row.cohortId)!;

    if (!cohort.sequences.has(row.sequenceId)) {
      cohort.sequences.set(row.sequenceId, { emails: [] });
    }
    cohort.sequences.get(row.sequenceId)!.emails.push(row);
  }

  // ── Evaluate pending conditions per teacher ────────────────────────────────

  let teachersNotified = 0;

  for (const teacherData of Array.from(teacherMap.values())) {
    const cohortSummaries: string[] = [];

    for (const cohortData of Array.from(teacherData.cohorts.values())) {
      const items: string[] = [];

      for (const seq of Array.from(cohortData.sequences.values())) {
        const seqEmails = seq.emails;

        // Condition 1 — unapproved emails
        const unapproved = seqEmails.filter((e) => e.approvalStatus !== "approved");
        if (unapproved.length > 0) {
          const subjects = unapproved.map((e) => `"${e.subjectLine}"`).join(", ");
          items.push(
            `${unapproved.length} email(s) awaiting approval: ${subjects}`
          );
        }

        // Condition 2 — fully approved but not yet exported to Kit
        const allApproved = seqEmails.every((e) => e.approvalStatus === "approved");
        if (allApproved) {
          const unexported = seqEmails.filter((e) => !e.convertkitBroadcastId);
          if (unexported.length > 0) {
            items.push(
              `${unexported.length} approved email(s) not yet exported to Kit`
            );
          }
        }

        // Condition 3 — final_call with no variant selected
        const finalCallEmails = seqEmails.filter((e) => e.emailType === "final_call");
        for (const fc of finalCallEmails) {
          if (!selectedEmailIds.has(fc.emailId)) {
            items.push(
              `Final Call email needs a variant selected (Urgency, Results, or Personal Note)`
            );
          }
        }
      }

      if (items.length > 0) {
        cohortSummaries.push(
          `Cohort: ${cohortData.cohortName}\n${items.map((i) => `  - ${i}`).join("\n")}`
        );
      }
    }

    // Nothing pending for this teacher — skip entirely
    if (cohortSummaries.length === 0) continue;

    // Ask Claude to turn the raw list into a friendly digest body
    const rawSummary = cohortSummaries.join("\n\n");
    const { text: emailBody } = await callClaude({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 600,
      system: `You are writing a short, friendly daily digest email for a course creator using Pigeon, an AI tool that writes launch email sequences.
Write in second person ("you", "your"). Be warm and encouraging — not alarming.
Group action items clearly by cohort. Use plain text only: no markdown, no bullet symbols, no asterisks, no em dashes used as decoration.
Do not include a subject line, greeting, or sign-off — start directly with the first cohort's action items.
End with one short encouraging sentence.`,
      messages: [
        {
          role: "user",
          content: `Here are the pending items for this teacher. Turn them into a friendly digest email body:\n\n${rawSummary}`,
        },
      ],
    });

    await sendNotification({
      to: teacherData.teacherEmail,
      subject: `Your Pigeon digest — ${today}`,
      body: emailBody,
    });

    teachersNotified++;
    console.log(`[cron/daily-digest] Sent digest to ${teacherData.teacherEmail}`);
  }

  console.log(`[cron/daily-digest] Done. Teachers notified: ${teachersNotified}`);
  return Response.json({ ok: true, teachersNotified });
}
