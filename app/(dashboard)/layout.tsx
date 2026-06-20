import { currentUser } from "@clerk/nextjs/server";
import { Sidebar } from "./_components/sidebar";
import { Topbar } from "./_components/topbar";
import { Toaster } from "@/components/ui/sonner";
import { OnboardingModal } from "@/components/onboarding-modal";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();
  const hasOnboarded = user?.publicMetadata?.hasCompletedOnboarding === true;

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto bg-pigeon-cream p-8">
          {children}
        </main>
      </div>
      <Toaster />
      {!hasOnboarded && <OnboardingModal />}
    </div>
  );
}
