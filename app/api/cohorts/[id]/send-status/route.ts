import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cohorts, teachers, type SendStatus } from "@/lib/schema";

export const runtime = "nodejs";

const VALID_STATUSES: SendStatus[] = ["active", "paused", "cancelled"];

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const { status } = (body ?? {}) as { status?: string };

  if (!status || !VALID_STATUSES.includes(status as SendStatus)) {
    return NextResponse.json(
      { error: `status must be one of: ${VALID_STATUSES.join(", ")}` },
      { status: 400 }
    );
  }

  const [teacher] = await db
    .select({ id: teachers.id })
    .from(teachers)
    .where(eq(teachers.clerkUserId, userId))
    .limit(1);
  if (!teacher) return NextResponse.json({ error: "Teacher not found" }, { status: 404 });

  const [updated] = await db
    .update(cohorts)
    .set({ sendStatus: status as SendStatus, updatedAt: new Date() })
    .where(and(eq(cohorts.id, params.id), eq(cohorts.teacherId, teacher.id)))
    .returning({ sendStatus: cohorts.sendStatus });

  if (!updated) return NextResponse.json({ error: "Cohort not found" }, { status: 404 });

  return NextResponse.json({ sendStatus: updated.sendStatus });
}
