import { currentUser } from "@clerk/nextjs/server";

export default async function DashboardPage() {
  const user = await currentUser();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-pigeon-bg">
      <div className="rounded-2xl bg-pigeon-surface p-10 shadow-sm">
        <h1 className="font-[family-name:var(--font-plus-jakarta-sans)] text-3xl font-extrabold text-pigeon-primary">
          Welcome to Pigeon
        </h1>
        <p className="mt-3 text-pigeon-muted">
          {user?.emailAddresses[0]?.emailAddress}
        </p>
      </div>
    </main>
  );
}
