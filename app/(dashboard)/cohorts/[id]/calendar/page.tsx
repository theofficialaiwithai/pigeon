import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { cohorts, emailSequences, emails, teachers } from "@/lib/schema";
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
  if (!sequence) redirect(`/cohorts/${params.id}/voice`);

  const emailRows = await db
    .select()
    .from(emails)
    .where(eq(emails.sequenceId, sequence.id))
    .orderBy(emails.position);

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

  return (
    <CalendarClient
      cohortId={params.id}
      programName={cohort.programName}
      cartOpenDate={cohort.cartOpenDate ? asDateStr(cohort.cartOpenDate) : null}
      cartCloseDate={cohort.cartCloseDate ? asDateStr(cohort.cartCloseDate) : null}
      cohortStartDate={cohort.cohortStartDate ? asDateStr(cohort.cohortStartDate) : null}
      initialEmails={serializedEmails}
    />
  );
}
