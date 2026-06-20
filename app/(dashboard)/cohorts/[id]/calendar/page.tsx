import { auth } from "@clerk/nextjs/server";
import { and, desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { cohorts, emailSequences, emails, sendLog, teachers } from "@/lib/schema";
import { CalendarClient } from "./CalendarClient";

function asDateStr(v: unknown): string {
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  return String(v);
}

export default async function CalendarPage({
  params,
}: {
  params: { id: string };
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const [teacher] = await db
    .select()
    .from(teachers)
    .where(eq(teachers.clerkUserId, userId))
    .limit(1);
  if (!teacher) redirect("/dashboard");

  const [cohort] = await db
    .select()
    .from(cohorts)
    .where(and(eq(cohorts.id, params.id), eq(cohorts.teacherId, teacher.id)))
    .limit(1);
  if (!cohort) redirect("/dashboard");

  const [sequence] = await db
    .select()
    .from(emailSequences)
    .where(eq(emailSequences.cohortId, cohort.id))
    .limit(1);
  if (!sequence) redirect(`/voice-profile?from=${params.id}`);

  // Fetch emails and send log in parallel
  const [emailRows, logRows] = await Promise.all([
    db
      .select()
      .from(emails)
      .where(eq(emails.sequenceId, sequence.id))
      .orderBy(emails.position),
    db
      .select({
        id: sendLog.id,
        emailId: sendLog.emailId,
        sequencePosition: sendLog.sequencePosition,
        esp: sendLog.esp,
        status: sendLog.status,
        errorMessage: sendLog.errorMessage,
        sentAt: sendLog.sentAt,
      })
      .from(sendLog)
      .where(eq(sendLog.cohortId, cohort.id))
      .orderBy(desc(sendLog.sentAt))
      .limit(50),
  ]);

  const serializedEmails = emailRows.map((e) => ({
    id: e.id,
    position: e.position,
    emailType: e.emailType,
    subjectLine: e.subjectLine,
    scheduledSendAt: e.scheduledSendAt
      ? e.scheduledSendAt instanceof Date
        ? e.scheduledSendAt.toISOString()
        : String(e.scheduledSendAt)
      : null,
    approvalStatus: e.approvalStatus ?? "draft",
  }));

  const serializedLogs = logRows.map((r) => ({
    id: r.id,
    emailId: r.emailId ?? null,
    sequencePosition: r.sequencePosition ?? null,
    esp: r.esp,
    status: r.status,
    errorMessage: r.errorMessage ?? null,
    sentAt:
      r.sentAt instanceof Date ? r.sentAt.toISOString() : String(r.sentAt),
  }));

  return (
    <CalendarClient
      cohortId={params.id}
      programName={cohort.programName}
      cartOpenDate={cohort.cartOpenDate ? asDateStr(cohort.cartOpenDate) : null}
      cartCloseDate={cohort.cartCloseDate ? asDateStr(cohort.cartCloseDate) : null}
      cohortStartDate={cohort.cohortStartDate ? asDateStr(cohort.cohortStartDate) : null}
      initialEmails={serializedEmails}
      initialSendStatus={cohort.sendStatus ?? "active"}
      sendLogs={serializedLogs}
    />
  );
}
