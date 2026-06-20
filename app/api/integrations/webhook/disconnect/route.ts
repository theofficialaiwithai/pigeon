import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { platformConnections, teachers } from "@/lib/schema";

export const runtime = "nodejs";

export async function POST() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [teacher] = await db
    .select({ id: teachers.id })
    .from(teachers)
    .where(eq(teachers.clerkUserId, userId))
    .limit(1);
  if (!teacher) return NextResponse.json({ error: "Teacher not found" }, { status: 404 });

  await db
    .delete(platformConnections)
    .where(
      and(
        eq(platformConnections.teacherId, teacher.id),
        eq(platformConnections.platform, "webhook")
      )
    );

  return NextResponse.json({ ok: true });
}
