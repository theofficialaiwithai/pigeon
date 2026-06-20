import { auth, clerkClient } from "@clerk/nextjs/server";

export async function POST() {
  const { userId } = await auth();
  if (!userId) return new Response(null, { status: 401 });

  const client = await clerkClient();
  await client.users.updateUser(userId, {
    publicMetadata: { hasCompletedOnboarding: true },
  });

  return new Response(null, { status: 200 });
}
