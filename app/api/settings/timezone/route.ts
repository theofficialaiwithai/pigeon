import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { teachers } from "@/lib/schema";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const formData = await req.formData();
  const timezone = formData.get("timezone");

  if (typeof timezone === "string" && timezone.trim()) {
    await db
      .update(teachers)
      .set({ timezone: timezone.trim() })
      .where(eq(teachers.clerkUserId, userId));
  }

  redirect("/settings");
}
