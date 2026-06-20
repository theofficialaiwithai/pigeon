import { and, eq, isNull, lte } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  cohorts,
  emailSequences,
  emails,
  platformConnections,
  sendLog,
  teachers,
} from "@/lib/schema";
import { sendNotification } from "@/lib/notifications";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const now = new Date();

  // Find all approved emails past their scheduled time that haven't been exported.
  const dueRows = await db
    .select({
      emailId: emails.id,
      emailPosition: emails.position,
      subjectLine: emails.subjectLine,
      bodyHtml: emails.bodyHtml,
      scheduledSendAt: emails.scheduledSendAt,
      previewText: emails.previewText,
      cohortId: cohorts.id,
      programName: cohorts.programName,
      sendStatus: cohorts.sendStatus,
      teacherId: teachers.id,
      teacherEmail: teachers.email,
      teacherName: teachers.name,
    })
    .from(emails)
    .innerJoin(emailSequences, eq(emails.sequenceId, emailSequences.id))
    .innerJoin(cohorts, eq(emailSequences.cohortId, cohorts.id))
    .innerJoin(teachers, eq(cohorts.teacherId, teachers.id))
    .where(
      and(
        eq(emails.approvalStatus, "approved"),
        isNull(emails.convertkitBroadcastId),
        lte(emails.scheduledSendAt, now)
      )
    );

  if (dueRows.length === 0) {
    return Response.json({ ok: true, processed: 0, skipped: 0 });
  }

  // Fetch Kit API keys for all teachers at once to avoid N+1
  const teacherIds = Array.from(new Set(dueRows.map((r) => r.teacherId)));
  const kitConnections = await db
    .select({
      teacherId: platformConnections.teacherId,
      accessToken: platformConnections.accessToken,
    })
    .from(platformConnections)
    .where(eq(platformConnections.platform, "convertkit"));

  const kitKeyByTeacher = new Map(kitConnections.map((c) => [c.teacherId, c.accessToken]));

  let processed = 0;
  let skipped = 0;
  const failedByTeacher = new Map<
    string,
    { teacherEmail: string; teacherName: string | null; subjects: string[] }
  >();

  for (const row of dueRows) {
    // ── Kill switch: skip if cohort is paused or cancelled ────────────────────
    if (row.sendStatus === "paused" || row.sendStatus === "cancelled") {
      await db.insert(sendLog).values({
        cohortId: row.cohortId,
        emailId: row.emailId,
        sequencePosition: row.emailPosition,
        esp: "convertkit",
        status: "skipped",
        errorMessage: `Cohort send_status is '${row.sendStatus}'`,
      });
      skipped++;
      continue;
    }

    const kitKey = kitKeyByTeacher.get(row.teacherId);
    if (!kitKey) {
      // No Kit connection — log as skipped (teacher hasn't connected Kit yet)
      await db.insert(sendLog).values({
        cohortId: row.cohortId,
        emailId: row.emailId,
        sequencePosition: row.emailPosition,
        esp: "convertkit",
        status: "skipped",
        errorMessage: "No ConvertKit connection found for this teacher",
      });
      skipped++;
      continue;
    }

    // ── Attempt Kit broadcast creation ────────────────────────────────────────
    try {
      const kitRes = await fetch("https://api.kit.com/v4/broadcasts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Kit-Api-Key": kitKey,
        },
        body: JSON.stringify({
          subject: row.subjectLine,
          content: row.bodyHtml,
          description: `${row.programName} — Email ${row.emailPosition}`,
          subscriber_filter: [{ all: true }],
          published_at: row.scheduledSendAt?.toISOString() ?? now.toISOString(),
          send_at: row.scheduledSendAt?.toISOString() ?? now.toISOString(),
        }),
      });

      if (!kitRes.ok) {
        const errBody = await kitRes.text();
        throw new Error(`Kit API ${kitRes.status}: ${errBody.slice(0, 200)}`);
      }

      const kitData = (await kitRes.json()) as { broadcast?: { id?: number } };
      const broadcastId = String(kitData.broadcast?.id ?? "");

      // Save broadcast ID so this email isn't picked up on the next cron run
      await db
        .update(emails)
        .set({ convertkitBroadcastId: broadcastId, updatedAt: new Date() })
        .where(eq(emails.id, row.emailId));

      await db.insert(sendLog).values({
        cohortId: row.cohortId,
        emailId: row.emailId,
        sequencePosition: row.emailPosition,
        esp: "convertkit",
        status: "success",
      });

      processed++;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);

      await db.insert(sendLog).values({
        cohortId: row.cohortId,
        emailId: row.emailId,
        sequencePosition: row.emailPosition,
        esp: "convertkit",
        status: "failed",
        errorMessage,
      });

      // Aggregate failures per teacher for the notification email
      const existing = failedByTeacher.get(row.teacherId);
      if (existing) {
        existing.subjects.push(row.subjectLine);
      } else {
        failedByTeacher.set(row.teacherId, {
          teacherEmail: row.teacherEmail,
          teacherName: row.teacherName,
          subjects: [row.subjectLine],
        });
      }
    }
  }

  // Notify teachers about failures
  for (const { teacherEmail, teacherName, subjects } of Array.from(
    failedByTeacher.values()
  )) {
    const lines = subjects.map((s) => `  • "${s}"`);
    const body = [
      `Hi ${teacherName ?? "there"},`,
      "",
      `${subjects.length} email${subjects.length === 1 ? "" : "s"} failed to send via ConvertKit:`,
      "",
      ...lines,
      "",
      "Log in to Pigeon and check the Send Log on your Launch Calendar to see the error details.",
      "",
      "— The Pigeon Team",
    ].join("\n");

    await sendNotification({
      to: teacherEmail,
      subject: `${subjects.length} email${subjects.length === 1 ? "" : "s"} failed to send — Pigeon`,
      body,
    });
  }

  return Response.json({
    ok: true,
    processed,
    skipped,
    failed: failedByTeacher.size,
    teacherIds: teacherIds.length,
  });
}
