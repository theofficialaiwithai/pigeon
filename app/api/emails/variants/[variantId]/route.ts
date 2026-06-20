import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { emailVariants, emails, emailSequences, teachers } from "@/lib/schema";

export async function PATCH(
  req: Request,
  { params }: { params: { variantId: string } }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const { subject_line, preview_text, body_html } = body as {
    subject_line?: string;
    preview_text?: string;
    body_html?: string;
  };

  // Verify ownership through the join chain
  const [row] = await db
    .select({ id: emailVariants.id })
    .from(emailVariants)
    .innerJoin(emails, eq(emails.id, emailVariants.emailId))
    .innerJoin(emailSequences, eq(emailSequences.id, emails.sequenceId))
    .innerJoin(teachers, eq(teachers.id, emailSequences.teacherId))
    .where(
      and(
        eq(emailVariants.id, params.variantId),
        eq(teachers.clerkUserId, userId)
      )
    )
    .limit(1);

  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db
    .update(emailVariants)
    .set({
      ...(subject_line !== undefined && { subjectLine: subject_line }),
      ...(preview_text !== undefined && { previewText: preview_text }),
      ...(body_html !== undefined && { bodyHtml: body_html }),
    })
    .where(eq(emailVariants.id, params.variantId));

  return NextResponse.json({ ok: true });
}
