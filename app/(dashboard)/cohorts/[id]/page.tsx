import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { cohorts, emailSequences, teachers } from "@/lib/schema";

export default async function CohortPage({
  params,
}: {
  params: { id: string };
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const [teacher] = await db
    .select({ id: teachers.id })
    .from(teachers)
    .where(eq(teachers.clerkUserId, userId))
    .limit(1);
  if (!teacher) redirect("/dashboard");

  const [cohort] = await db
    .select({ id: cohorts.id })
    .from(cohorts)
    .where(and(eq(cohorts.id, params.id), eq(cohorts.teacherId, teacher.id)))
    .limit(1);
  if (!cohort) redirect("/dashboard");

  const [sequence] = await db
    .select({ id: emailSequences.id })
    .from(emailSequences)
    .where(eq(emailSequences.cohortId, cohort.id))
    .limit(1);

  redirect(sequence ? `/cohorts/${params.id}/sequence` : `/voice-profile?from=${params.id}`);
}
