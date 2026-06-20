import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { teachers } from "@/lib/schema";
import { pendoTrack } from "@/lib/pendo-track";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const formData = await req.formData();
  const timezone = formData.get("timezone");

  if (typeof timezone === "string" && timezone.trim()) {
    const [teacher] = await db
      .select({ timezone: teachers.timezone })
      .from(teachers)
      .where(eq(teachers.clerkUserId, userId))
      .limit(1);

    await db
      .update(teachers)
      .set({ timezone: timezone.trim() })
      .where(eq(teachers.clerkUserId, userId));

    void pendoTrack({
      event: "timezone_updated",
      visitorId: userId,
      properties: {
        new_timezone: timezone.trim(),
        previous_timezone: teacher?.timezone ?? null,
      },
    });
  }

  redirect("/settings");
}
