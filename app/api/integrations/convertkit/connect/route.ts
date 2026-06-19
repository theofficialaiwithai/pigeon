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
  const { apiKey } = (body ?? {}) as { apiKey?: string };
  if (!apiKey?.trim()) {
    return NextResponse.json({ error: "apiKey is required" }, { status: 400 });
  }

  // Validate the key against Kit's V4 account endpoint
  const kitRes = await fetch("https://api.kit.com/v4/account", {
    headers: { "X-Kit-Api-Key": apiKey.trim(), "Content-Type": "application/json" },
  });

  if (kitRes.status === 401) {
    let errMsg = "Invalid API key";
    try {
      const errBody = await kitRes.json() as { errors?: string[] };
      if (errBody.errors?.[0]) errMsg = errBody.errors[0];
    } catch { /* swallow */ }
    return NextResponse.json({ error: errMsg }, { status: 401 });
  }

  if (!kitRes.ok) {
    return NextResponse.json({ error: "Kit API error" }, { status: 502 });
  }

  const kitData = await kitRes.json() as { account?: { name?: string } };
  const accountName = kitData.account?.name ?? null;

  const [teacher] = await db
    .select({ id: teachers.id })
    .from(teachers)
    .where(eq(teachers.clerkUserId, userId))
    .limit(1);
  if (!teacher) return NextResponse.json({ error: "Teacher not found" }, { status: 404 });

  // Manual upsert — platform_connections has no unique constraint on (teacher_id, platform)
  const [existing] = await db
    .select({ id: platformConnections.id })
    .from(platformConnections)
    .where(
      and(
        eq(platformConnections.teacherId, teacher.id),
        eq(platformConnections.platform, "convertkit")
      )
    )
    .limit(1);

  if (existing) {
    await db
      .update(platformConnections)
      .set({ accessToken: apiKey.trim(), accountName, updatedAt: new Date() })
      .where(eq(platformConnections.id, existing.id));
  } else {
    await db.insert(platformConnections).values({
      teacherId: teacher.id,
      platform: "convertkit",
      accessToken: apiKey.trim(),
      accountName,
    });
  }

  return NextResponse.json({ accountName });
}
