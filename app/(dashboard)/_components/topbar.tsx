"use client";

import { usePathname } from "next/navigation";

const TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/cohorts": "Cohorts",
  "/cohorts/new": "New Cohort",
  "/voice-profile": "Voice Profile",
  "/settings": "Settings",
};

function deriveTitle(pathname: string): string {
  if (TITLES[pathname]) return TITLES[pathname];
  if (pathname.endsWith("/sequence")) return "Email Sequence";
  if (pathname.endsWith("/export")) return "Export to Kit";
  if (pathname.startsWith("/cohorts/")) return "Cohort Details";
  return "Pigeon";
}

export function Topbar() {
  const pathname = usePathname();

  return (
    <header className="shrink-0 border-b border-pigeon-warm-rule bg-white px-8 py-4">
      <h1 className="font-heading text-2xl font-semibold text-pigeon-ink">
        {deriveTitle(pathname)}
      </h1>
    </header>
  );
}
