import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  cohorts,
  emailSequences,
  emails,
  emailVariants,
  platformConnections,
  teachers,
} from "@/lib/schema";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const { cohortId } = (body ?? {}) as { cohortId?: string };
  if (!cohortId) return NextResponse.json({ error: "cohortId is required" }, { status: 400 });

  const [teacher] = await db
    .select()
    .from(teachers)
    .where(eq(teachers.clerkUserId, userId))
    .limit(1);
  if (!teacher) return NextResponse.json({ error: "Teacher not found" }, { status: 404 });

  // Check webhook is configured
  const [webhookConn] = await db
    .select({ accessToken: platformConnections.accessToken })
    .from(platformConnections)
    .where(
      and(
        eq(platformConnections.teacherId, teacher.id),
        eq(platformConnections.platform, "webhook")
      )
    )
    .limit(1);

  if (!webhookConn) {
    return NextResponse.json(
      {
        error:
          "No webhook URL configured. Go to Settings → Export via Zapier or Make to add one.",
      },
      { status: 400 }
    );
  }

  // Verify cohort belongs to this teacher
  const [cohort] = await db
    .select()
    .from(cohorts)
    .where(and(eq(cohorts.id, cohortId), eq(cohorts.teacherId, teacher.id)))
    .limit(1);
  if (!cohort) return NextResponse.json({ error: "Cohort not found" }, { status: 404 });

  // Fetch sequence
  const [sequence] = await db
    .select({ id: emailSequences.id })
    .from(emailSequences)
    .where(eq(emailSequences.cohortId, cohort.id))
    .limit(1);
  if (!sequence) {
    return NextResponse.json({ error: "No sequence found for this cohort" }, { status: 404 });
  }

  // Fetch all emails ordered by position
  const emailRows = await db
    .select()
    .from(emails)
    .where(eq(emails.sequenceId, sequence.id))
    .orderBy(emails.position);

  // For each final_call email, fetch the selected variant (if any)
  const finalCallEmails = emailRows.filter((e) => e.emailType === "final_call");
  const selectedVariantMap = new Map<string, { subjectLine: string; bodyHtml: string }>();

  for (const fc of finalCallEmails) {
    const [selected] = await db
      .select({ subjectLine: emailVariants.subjectLine, bodyHtml: emailVariants.bodyHtml })
      .from(emailVariants)
      .where(
        and(
          eq(emailVariants.emailId, fc.id),
          eq(emailVariants.isSelected, true)
        )
      )
      .limit(1);
    if (selected) {
      selectedVariantMap.set(fc.id, selected);
    }
  }

  // Build the payload — for final_call emails, use selected variant if available
  const emailsPayload = emailRows.map((email) => {
    const variant = selectedVariantMap.get(email.id);
    return {
      position: email.position,
      subject: variant?.subjectLine ?? email.subjectLine,
      body: variant?.bodyHtml ?? email.bodyHtml,
      scheduled_send_at: email.scheduledSendAt
        ? email.scheduledSendAt instanceof Date
          ? email.scheduledSendAt.toISOString()
          : String(email.scheduledSendAt)
        : null,
    };
  });

  const payload = {
    event: "sequence.approved" as const,
    cohort: {
      id: cohort.id,
      program_name: cohort.programName,
      cart_open_date: cohort.cartOpenDate,
      cart_close_date: cohort.cartCloseDate,
    },
    teacher: {
      name: teacher.name ?? "",
      email: teacher.email,
    },
    emails: emailsPayload,
  };

  // Dispatch to the teacher's webhook
  let httpStatus: number;
  try {
    const res = await fetch(webhookConn.accessToken, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    httpStatus = res.status;
  } catch (err) {
    return NextResponse.json(
      {
        error: `Could not reach your webhook URL: ${
          err instanceof Error ? err.message : "Network error"
        }`,
      },
      { status: 502 }
    );
  }

  if (httpStatus >= 200 && httpStatus < 300) {
    return NextResponse.json({ ok: true, emailCount: emailsPayload.length });
  }

  return NextResponse.json(
    { error: `Your webhook returned HTTP ${httpStatus}. Check the URL and try again.` },
    { status: 502 }
  );
}
