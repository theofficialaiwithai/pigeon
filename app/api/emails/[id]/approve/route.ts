import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { emails, emailVariants } from "@/lib/schema";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({})) as { variantId?: string };

  await db
    .update(emails)
    .set({ approvalStatus: "approved", updatedAt: new Date() })
    .where(eq(emails.id, params.id));

  // For final_call: record which variant was chosen
  if (body.variantId) {
    await db
      .update(emailVariants)
      .set({ isSelected: false })
      .where(eq(emailVariants.emailId, params.id));
    await db
      .update(emailVariants)
      .set({ isSelected: true })
      .where(eq(emailVariants.id, body.variantId));
  }

  return NextResponse.json({ ok: true });
}
