import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { teachers, voiceProfiles } from "@/lib/schema";
import { VoiceProfileClient, type VoiceProfileData } from "./VoiceProfileClient";

export const metadata = { title: "Voice Profile — Pigeon" };

export default async function VoiceProfilePage({
  searchParams,
}: {
  searchParams: { from?: string };
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const [teacher] = await db
    .select({ id: teachers.id })
    .from(teachers)
    .where(eq(teachers.clerkUserId, userId))
    .limit(1);
  if (!teacher) redirect("/dashboard");

  let initialProfile: VoiceProfileData | null = null;
  const [row] = await db
    .select({ fullProfileJson: voiceProfiles.fullProfileJson })
    .from(voiceProfiles)
    .where(eq(voiceProfiles.teacherId, teacher.id))
    .limit(1);

  if (row?.fullProfileJson) {
    initialProfile = row.fullProfileJson as VoiceProfileData;
  }

  // `from` carries the cohortId to return to after profile generation
  const returnCohortId = searchParams.from ?? null;

  return (
    <VoiceProfileClient
      initialProfile={initialProfile}
      returnCohortId={returnCohortId}
    />
  );
}
