import { auth } from "@clerk/nextjs/server";
import { and, eq, inArray } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import {
  cohorts,
  emailSequences,
  emails,
  emailVariants,
  teachers,
} from "@/lib/schema";
import { SequenceEditorClient } from "./SequenceEditorClient";

export default async function SequencePage({
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

  const emailIds = emailRows.map((e) => e.id);
  const variantRows =
    emailIds.length > 0
      ? await db
          .select()
          .from(emailVariants)
          .where(inArray(emailVariants.emailId, emailIds))
      : [];

  const serializedEmails = emailRows.map((e) => ({
    id: e.id,
    position: e.position,
    emailType: e.emailType,
    subjectLine: e.subjectLine,
    previewText: e.previewText ?? "",
    bodyHtml: e.bodyHtml,
    scheduledSendAt: e.scheduledSendAt
      ? e.scheduledSendAt instanceof Date
        ? e.scheduledSendAt.toISOString()
        : String(e.scheduledSendAt)
      : null,
    approvalStatus: e.approvalStatus ?? "draft",
    variants: variantRows
      .filter((v) => v.emailId === e.id)
      .map((v) => ({
        id: v.id,
        variantType: v.variantType,
        subjectLine: v.subjectLine,
        previewText: v.previewText ?? "",
        bodyHtml: v.bodyHtml,
        isSelected: v.isSelected ?? false,
      })),
  }));

  return (
    <SequenceEditorClient
      cohortId={params.id}
      programName={cohort.programName}
      initialEmails={serializedEmails}
    />
  );
}
