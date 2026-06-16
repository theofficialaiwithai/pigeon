import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { teachers, voiceProfiles } from "@/lib/schema";
import {
  VoicePageClient,
  type VoiceProfileData,
} from "./VoicePageClient";

export default async function VoicePage({
  params,
}: {
  params: { id: string };
}) {
  const { userId } = await auth();

  let initialProfile: VoiceProfileData | null = null;

  if (userId) {
    const [teacher] = await db
      .select()
      .from(teachers)
      .where(eq(teachers.clerkUserId, userId))
      .limit(1);

    if (teacher) {
      const [row] = await db
        .select({ fullProfileJson: voiceProfiles.fullProfileJson })
        .from(voiceProfiles)
        .where(eq(voiceProfiles.teacherId, teacher.id))
        .limit(1);

      if (row?.fullProfileJson) {
        initialProfile = row.fullProfileJson as VoiceProfileData;
      }
    }
  }

  return (
    <VoicePageClient cohortId={params.id} initialProfile={initialProfile} />
  );
}
