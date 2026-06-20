import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { platformConnections, teachers } from "@/lib/schema";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const { webhookUrl } = (body ?? {}) as { webhookUrl?: string };

  if (!webhookUrl?.trim()) {
    return NextResponse.json({ error: "webhookUrl is required" }, { status: 400 });
  }

  // Validate it's a well-formed HTTPS URL
  let parsed: URL;
  try {
    parsed = new URL(webhookUrl.trim());
  } catch {
    return NextResponse.json({ error: "That doesn't look like a valid URL" }, { status: 400 });
  }
  if (parsed.protocol !== "https:") {
    return NextResponse.json({ error: "Webhook URL must use HTTPS" }, { status: 400 });
  }

  const [teacher] = await db
    .select({ id: teachers.id })
    .from(teachers)
    .where(eq(teachers.clerkUserId, userId))
    .limit(1);
  if (!teacher) return NextResponse.json({ error: "Teacher not found" }, { status: 404 });

  // Manual upsert — no unique constraint on (teacher_id, platform)
  const [existing] = await db
    .select({ id: platformConnections.id })
    .from(platformConnections)
    .where(
      and(
        eq(platformConnections.teacherId, teacher.id),
        eq(platformConnections.platform, "webhook")
      )
    )
    .limit(1);

  if (existing) {
    await db
      .update(platformConnections)
      .set({ accessToken: parsed.toString(), updatedAt: new Date() })
      .where(eq(platformConnections.id, existing.id));
  } else {
    await db.insert(platformConnections).values({
      teacherId: teacher.id,
      platform: "webhook",
      accessToken: parsed.toString(),
    });
  }

  return NextResponse.json({ ok: true });
}
