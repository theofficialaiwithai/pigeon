import { redirect } from "next/navigation";

// Voice profile is now a top-level teacher resource at /voice-profile.
// Any link that still points here is forwarded automatically.
export default function VoicePageRedirect({
  params,
}: {
  params: { id: string };
}) {
  redirect(`/voice-profile?from=${params.id}`);
}
