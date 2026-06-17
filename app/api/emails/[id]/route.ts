import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { emails } from "@/lib/schema";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const { subject_line, preview_text, body_html, approval_status, scheduled_send_at } = body as {
    subject_line?: string;
    preview_text?: string;
    body_html?: string;
    approval_status?: string;
    scheduled_send_at?: string;
  };

  await db
    .update(emails)
    .set({
      ...(subject_line !== undefined && { subjectLine: subject_line }),
      ...(preview_text !== undefined && { previewText: preview_text }),
      ...(body_html !== undefined && { bodyHtml: body_html }),
      ...(approval_status !== undefined && { approvalStatus: approval_status }),
      ...(scheduled_send_at !== undefined && { scheduledSendAt: new Date(scheduled_send_at) }),
      updatedAt: new Date(),
    })
    .where(eq(emails.id, params.id));

  return NextResponse.json({ ok: true });
}
