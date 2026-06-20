import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cohorts, teachers, voiceProfiles } from "@/lib/schema";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const {
    program_name,
    curriculum_summary,
    sequence_type = "launch",
    cart_open_date,
    cart_close_date,
    cohort_start_date,
    seat_count,
    price_usd,
    kajabi_product_id,
  } = body as {
    program_name: string;
    curriculum_summary: string;
    sequence_type?: string;
    cart_open_date?: string;
    cart_close_date?: string;
    cohort_start_date?: string;
    seat_count?: number;
    price_usd?: number;
    kajabi_product_id?: string;
  };

  if (!program_name?.trim()) {
    return NextResponse.json({ error: "Program name is required" }, { status: 400 });
  }
  if (!curriculum_summary?.trim()) {
    return NextResponse.json({ error: "Details are required" }, { status: 400 });
  }

  // Dates are only required for launch sequences
  if (sequence_type === "launch") {
    if (!cart_open_date || !cart_close_date || !cohort_start_date) {
      return NextResponse.json({ error: "All dates are required for launch sequences" }, { status: 400 });
    }
    if (cart_close_date <= cart_open_date) {
      return NextResponse.json({ error: "Cart close date must be after cart open date" }, { status: 400 });
    }
    if (cohort_start_date <= cart_close_date) {
      return NextResponse.json({ error: "Cohort start date must be after cart close date" }, { status: 400 });
    }
  }

  const [teacher] = await db
    .select()
    .from(teachers)
    .where(eq(teachers.clerkUserId, userId))
    .limit(1);

  if (!teacher) {
    return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
  }

  const [cohort] = await db
    .insert(cohorts)
    .values({
      teacherId: teacher.id,
      programName: program_name.trim(),
      curriculumSummary: curriculum_summary.trim(),
      sequenceType: sequence_type,
      cartOpenDate: cart_open_date ?? null,
      cartCloseDate: cart_close_date ?? null,
      cohortStartDate: cohort_start_date ?? null,
      seatCount: seat_count ?? null,
      priceUsd: price_usd ?? null,
      kajabiProductId: kajabi_product_id ?? null,
      status: "draft",
    })
    .returning();

  const [vp] = await db
    .select({ id: voiceProfiles.id })
    .from(voiceProfiles)
    .where(eq(voiceProfiles.teacherId, teacher.id))
    .limit(1);

  return NextResponse.json({
    cohortId: cohort.id,
    hasVoiceProfile: !!vp,
  });
}
