import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import {
  cohorts,
  emailSequences,
  emails,
  platformConnections,
  teachers,
} from "@/lib/schema";
import { ExportClient } from "./ExportClient";

export default async function ExportPage({
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

  // Fetch Kit and webhook connections in parallel
  const [kitConn, webhookConn] = await Promise.all([
    db
      .select({ accountName: platformConnections.accountName })
      .from(platformConnections)
      .where(
        and(
          eq(platformConnections.teacherId, teacher.id),
          eq(platformConnections.platform, "convertkit")
        )
      )
      .limit(1)
      .then((rows) => rows[0] ?? null),
    db
      .select({ accessToken: platformConnections.accessToken })
      .from(platformConnections)
      .where(
        and(
          eq(platformConnections.teacherId, teacher.id),
          eq(platformConnections.platform, "webhook")
        )
      )
      .limit(1)
      .then((rows) => rows[0] ?? null),
  ]);

  // Neither connected — prompt to set up at least one
  if (!kitConn && !webhookConn) {
    return (
      <div className="max-w-lg">
        <div className="bg-white rounded-xl border border-pigeon-warm-rule p-8 text-center space-y-4">
          <div className="text-3xl">📬</div>
          <h2 className="font-heading text-lg font-semibold text-pigeon-ink">
            Connect an email platform to export
          </h2>
          <p className="text-sm text-pigeon-ink-muted">
            Connect Kit (ConvertKit) to export directly as scheduled broadcasts, or
            add a Zapier / Make webhook to send your sequence to any other platform.
          </p>
          <Link
            href="/settings"
            className="inline-flex items-center rounded-lg bg-pigeon-ink px-5 py-2 text-sm font-semibold text-white hover:bg-pigeon-ink/90 transition-colors"
          >
            Go to Settings →
          </Link>
        </div>
      </div>
    );
  }

  // Fetch sequence
  const [sequence] = await db
    .select()
    .from(emailSequences)
    .where(eq(emailSequences.cohortId, cohort.id))
    .limit(1);

  if (!sequence) {
    return (
      <div className="max-w-lg">
        <div className="bg-white rounded-xl border border-pigeon-warm-rule p-8 text-center space-y-4">
          <div className="text-3xl">✉️</div>
          <h2 className="font-heading text-lg font-semibold text-pigeon-ink">
            No sequence yet
          </h2>
          <p className="text-sm text-pigeon-ink-muted">
            Generate your email sequence first before exporting.
          </p>
          <Link
            href={`/voice-profile?from=${params.id}`}
            className="inline-flex items-center rounded-lg bg-pigeon-ink px-5 py-2 text-sm font-semibold text-white hover:bg-pigeon-ink/90 transition-colors"
          >
            Go to Sequence →
          </Link>
        </div>
      </div>
    );
  }

  const emailRows = await db
    .select({
      id: emails.id,
      position: emails.position,
      emailType: emails.emailType,
      subjectLine: emails.subjectLine,
      scheduledSendAt: emails.scheduledSendAt,
      convertkitBroadcastId: emails.convertkitBroadcastId,
    })
    .from(emails)
    .where(eq(emails.sequenceId, sequence.id))
    .orderBy(emails.position);

  const exported = emailRows.every((e) => !!e.convertkitBroadcastId);
  const partiallyExported = !exported && emailRows.some((e) => !!e.convertkitBroadcastId);

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
    convertkitBroadcastId: e.convertkitBroadcastId ?? null,
  }));

  return (
    <ExportClient
      cohortId={params.id}
      programName={cohort.programName}
      kitAccountName={kitConn?.accountName ?? null}
      webhookConnected={!!webhookConn}
      emails={serializedEmails}
      initialExported={exported}
      initialPartial={partiallyExported}
    />
  );
}
