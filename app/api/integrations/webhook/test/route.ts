import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { platformConnections, teachers } from "@/lib/schema";

export const runtime = "nodejs";

// Realistic sample payload using Jordan's demo persona
const SAMPLE_PAYLOAD = {
  event: "sequence.approved",
  cohort: {
    id: "demo-cohort-id",
    program_name: "The Mindset Shift Accelerator",
    cart_open_date: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
    cart_close_date: new Date(Date.now() + 21 * 86400000).toISOString().slice(0, 10),
  },
  teacher: {
    name: "Jordan (Demo)",
    email: "jordan@example.com",
  },
  emails: [
    {
      position: 1,
      subject: "I want to ask you something.",
      body: "<p>When was the last time you made a decision — a real one — from a place of clarity instead of fear?</p><p>— Jordan</p>",
      scheduled_send_at: new Date(Date.now() + 1 * 86400000).toISOString(),
    },
    {
      position: 2,
      subject: "Who this is for (and who it isn't).",
      body: "<p>Before I open the doors next week, I want to be direct. This is for women in leadership who are done playing small.</p><p>— Jordan</p>",
      scheduled_send_at: new Date(Date.now() + 7 * 86400000).toISOString(),
    },
    {
      position: 3,
      subject: "The door opens today.",
      body: "<p>It's here. The Mindset Shift Accelerator is open for enrollment as of right now.</p><p>— Jordan</p>",
      scheduled_send_at: new Date(Date.now() + 14 * 86400000).toISOString(),
    },
  ],
  _note: "This is a test payload with 3 of 9 emails. A real export sends all 9.",
};

export async function POST() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [teacher] = await db
    .select({ id: teachers.id })
    .from(teachers)
    .where(eq(teachers.clerkUserId, userId))
    .limit(1);
  if (!teacher) return NextResponse.json({ error: "Teacher not found" }, { status: 404 });

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
      { error: "No webhook URL saved. Add one in Settings first." },
      { status: 400 }
    );
  }

  let status: number;
  try {
    const res = await fetch(webhookConn.accessToken, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(SAMPLE_PAYLOAD),
    });
    status = res.status;
  } catch (err) {
    return NextResponse.json(
      { error: `Could not reach your webhook URL: ${err instanceof Error ? err.message : "Network error"}` },
      { status: 502 }
    );
  }

  if (status >= 200 && status < 300) {
    return NextResponse.json({ ok: true, status });
  }
  return NextResponse.json(
    { error: `Webhook returned HTTP ${status}. Check the URL and try again.` },
    { status: 502 }
  );
}
