import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  cohorts,
  emailSequences,
  emails,
  platformConnections,
  teachers,
} from "@/lib/schema";

export const runtime = "nodejs";
export const maxDuration = 120;

interface BroadcastResult {
  emailId: string;
  success: boolean;
  broadcastId?: string;
  error?: string;
}

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

  // Verify cohort belongs to teacher
  const [cohort] = await db
    .select()
    .from(cohorts)
    .where(and(eq(cohorts.id, cohortId), eq(cohorts.teacherId, teacher.id)))
    .limit(1);
  if (!cohort) return NextResponse.json({ error: "Cohort not found" }, { status: 404 });

  // Fetch Kit API key
  const [conn] = await db
    .select({ accessToken: platformConnections.accessToken })
    .from(platformConnections)
    .where(
      and(
        eq(platformConnections.teacherId, teacher.id),
        eq(platformConnections.platform, "convertkit")
      )
    )
    .limit(1);
  if (!conn) {
    return NextResponse.json({ error: "Kit not connected. Connect in Settings first." }, { status: 400 });
  }

  // Fetch sequence
  const [sequence] = await db
    .select()
    .from(emailSequences)
    .where(eq(emailSequences.cohortId, cohort.id))
    .limit(1);
  if (!sequence) {
    return NextResponse.json({ error: "No sequence found for this cohort." }, { status: 404 });
  }

  const emailRows = await db
    .select()
    .from(emails)
    .where(eq(emails.sequenceId, sequence.id))
    .orderBy(emails.position);

  if (emailRows.length === 0) {
    return NextResponse.json({ error: "Sequence has no emails." }, { status: 404 });
  }

  const apiKey = conn.accessToken;
  const now = new Date().toISOString();
  const results: BroadcastResult[] = [];

  // Process sequentially so a failure leaves prior successes in a known state
  for (const email of emailRows) {
    const sendAt = email.scheduledSendAt
      ? email.scheduledSendAt instanceof Date
        ? email.scheduledSendAt.toISOString()
        : new Date(email.scheduledSendAt).toISOString()
      : now;

    const broadcastBody = {
      subject: email.subjectLine,
      content: email.bodyHtml,
      description: `${cohort.programName} — ${email.emailType} (position ${email.position})`,
      preview_text: email.previewText ?? "",
      public: false,
      published_at: now,
      send_at: sendAt,
      subscriber_filter: [],
    };

    try {
      const kitRes = await fetch("https://api.kit.com/v4/broadcasts", {
        method: "POST",
        headers: {
          "X-Kit-Api-Key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(broadcastBody),
      });

      if (kitRes.status === 201) {
        const kitData = await kitRes.json() as { broadcast?: { id?: number } };
        const broadcastId = String(kitData.broadcast?.id ?? "");

        await db
          .update(emails)
          .set({ convertkitBroadcastId: broadcastId, updatedAt: new Date() })
          .where(eq(emails.id, email.id));

        results.push({ emailId: email.id, success: true, broadcastId });
      } else {
        let errMsg = `Kit API returned ${kitRes.status}`;
        try {
          const errData = await kitRes.json() as { errors?: string[] };
          if (errData.errors?.[0]) errMsg = errData.errors[0];
        } catch { /* swallow */ }
        results.push({ emailId: email.id, success: false, error: errMsg });
      }
    } catch (err) {
      results.push({
        emailId: email.id,
        success: false,
        error: err instanceof Error ? err.message : "Network error",
      });
    }
  }

  const allSucceeded = results.every((r) => r.success);
  return NextResponse.json({ results, allSucceeded });
}
