import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cohorts, teachers } from "@/lib/schema";
import { sendNotification } from "@/lib/notifications";
import { generateSequenceForCohort } from "@/lib/generate-sequence";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(req: Request) {
  let teacherEmail: string | undefined;
  let cohortName: string | undefined;

  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    const { cohortId } = (body ?? {}) as { cohortId?: string };

    if (!cohortId) {
      return NextResponse.json({ error: "cohortId is required" }, { status: 400 });
    }

    const [teacher] = await db
      .select()
      .from(teachers)
      .where(eq(teachers.clerkUserId, userId))
      .limit(1);

    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    }
    teacherEmail = teacher.email;

    const [cohort] = await db
      .select()
      .from(cohorts)
      .where(and(eq(cohorts.id, cohortId), eq(cohorts.teacherId, teacher.id)))
      .limit(1);

    if (!cohort) {
      return NextResponse.json({ error: "Cohort not found" }, { status: 404 });
    }
    cohortName = cohort.programName;

    const sequenceId = await generateSequenceForCohort(cohortId);
    return NextResponse.json({ sequenceId });
  } catch (err) {
    console.error("[sequence/generate] Unhandled error:", err);
    if (teacherEmail) {
      void sendNotification({
        to: teacherEmail,
        subject: "Something went wrong generating your sequence",
        body: `There was an error generating the launch sequence${cohortName ? ` for "${cohortName}"` : ""}. Please try again or contact support.\n\nError: ${err instanceof Error ? err.message : String(err)}`,
      });
    }
    const message = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : undefined;
    return NextResponse.json({ error: message, stack }, { status: 500 });
  }
}
