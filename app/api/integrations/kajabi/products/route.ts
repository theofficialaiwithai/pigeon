import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { platformConnections, teachers } from "@/lib/schema";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [teacher] = await db
    .select()
    .from(teachers)
    .where(eq(teachers.clerkUserId, userId))
    .limit(1);

  if (!teacher) {
    return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
  }

  const [conn] = await db
    .select()
    .from(platformConnections)
    .where(
      and(
        eq(platformConnections.teacherId, teacher.id),
        eq(platformConnections.platform, "kajabi")
      )
    )
    .limit(1);

  if (!conn) {
    return NextResponse.json({ error: "Kajabi not connected" }, { status: 404 });
  }

  // TODO: call Kajabi API with conn.accessToken
  // Returning mock products until Kajabi OAuth is wired up
  return NextResponse.json({
    products: [
      {
        id: "kj_prod_1",
        name: "6-Week Business Bootcamp",
        startDate: "2024-09-01",
      },
      {
        id: "kj_prod_2",
        name: "Content Creator Masterclass",
        startDate: null,
      },
      {
        id: "kj_prod_3",
        name: "The Launch Blueprint",
        startDate: "2024-10-15",
      },
    ],
  });
}
