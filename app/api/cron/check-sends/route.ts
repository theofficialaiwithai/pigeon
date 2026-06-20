import { and, eq, isNull, lte } from "drizzle-orm";
import { db } from "@/lib/db";
import { cohorts, emailSequences, emails, teachers } from "@/lib/schema";
import { sendNotification } from "@/lib/notifications";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Find approved emails whose scheduled time has passed but haven't been
  // exported to Kit yet. These are overdue and the teacher may not know.
  const now = new Date();

  const overdueEmails = await db
    .select({
      emailId: emails.id,
      subjectLine: emails.subjectLine,
      scheduledSendAt: emails.scheduledSendAt,
      cohortId: cohorts.id,
      programName: cohorts.programName,
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

  if (overdueEmails.length === 0) {
    return Response.json({ ok: true, notified: 0 });
  }

  // Group by teacher so each teacher gets one digest, not one email per row
  const byTeacher = new Map<
    string,
    {
      teacherEmail: string;
      teacherName: string | null;
      items: { programName: string; subjectLine: string; scheduledSendAt: Date | null }[];
    }
  >();

  for (const row of overdueEmails) {
    const existing = byTeacher.get(row.teacherId);
    const item = {
      programName: row.programName,
      subjectLine: row.subjectLine,
      scheduledSendAt: row.scheduledSendAt,
    };
    if (existing) {
      existing.items.push(item);
    } else {
      byTeacher.set(row.teacherId, {
        teacherEmail: row.teacherEmail,
        teacherName: row.teacherName,
        items: [item],
      });
    }
  }

  let notified = 0;
  for (const { teacherEmail, teacherName, items } of Array.from(byTeacher.values())) {
    const lines = items.map((e) => {
      const when = e.scheduledSendAt
        ? new Date(e.scheduledSendAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })
        : "scheduled date passed";
      return `  • "${e.subjectLine}" (${e.programName}, was due ${when})`;
    });

    const body = [
      `Hi ${teacherName ?? "there"},`,
      "",
      `You have ${items.length} email${items.length === 1 ? "" : "s"} that ${
        items.length === 1 ? "was" : "were"
      } scheduled to send but haven't been exported to Kit yet:`,
      "",
      ...lines,
      "",
      "Head to Pigeon → Export to Kit to publish them.",
      "",
      "— The Pigeon Team",
    ].join("\n");

    await sendNotification({
      to: teacherEmail,
      subject: `${items.length} overdue email${items.length === 1 ? "" : "s"} in Pigeon`,
      body,
    });
    notified++;
  }

  return Response.json({ ok: true, notified, overdueCount: overdueEmails.length });
}
