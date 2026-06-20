import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cohorts, teachers } from "@/lib/schema";

// Shared helper — resolves the authenticated teacher and confirms cohort ownership.
async function resolveOwnership(userId: string, cohortId: string) {
  const [teacher] = await db
    .select({ id: teachers.id })
    .from(teachers)
    .where(eq(teachers.clerkUserId, userId))
    .limit(1);
  if (!teacher) return { error: "Teacher not found", status: 404 } as const;

  const [cohort] = await db
    .select({ id: cohorts.id, archivedAt: cohorts.archivedAt })
    .from(cohorts)
    .where(and(eq(cohorts.id, cohortId), eq(cohorts.teacherId, teacher.id)))
    .limit(1);
  if (!cohort) return { error: "Cohort not found", status: 404 } as const;

  return { teacher, cohort };
}

// PATCH /api/cohorts/[id]  — toggle archive state
export async function PATCH(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const result = await resolveOwnership(userId, params.id);
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });

  const nowArchived = !result.cohort.archivedAt;
  const [updated] = await db
    .update(cohorts)
    .set({ archivedAt: nowArchived ? new Date() : null, updatedAt: new Date() })
    .where(eq(cohorts.id, params.id))
    .returning({ archivedAt: cohorts.archivedAt });

  return NextResponse.json({ archivedAt: updated.archivedAt });
}

// DELETE /api/cohorts/[id]  — permanently delete cohort and all dependents.
// emailSequences → emails → emailVariants and sendLog all have onDelete: cascade
// on their cohortId / sequenceId / emailId FKs, so one delete is enough.
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const result = await resolveOwnership(userId, params.id);
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });

  await db.delete(cohorts).where(eq(cohorts.id, params.id));

  return NextResponse.json({ deleted: true });
}
