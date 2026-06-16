import { Sidebar } from "./_components/sidebar";
import { Topbar } from "./_components/topbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto bg-pigeon-bg p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
