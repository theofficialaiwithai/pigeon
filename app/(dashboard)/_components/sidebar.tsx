"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { LayoutDashboard, Mic2, Settings } from "lucide-react";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/voice-profile", label: "Voice Profile", icon: Mic2 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r border-pigeon-warm-rule bg-white">
      {/* Logo */}
      <div className="p-6">
        <Logo variant="compact" />
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 px-3">
        {NAV_LINKS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-pigeon-cream text-pigeon-ink"
                  : "text-pigeon-ink-muted hover:bg-pigeon-cream hover:text-pigeon-ink"
              )}
            >
              <Icon size={16} strokeWidth={active ? 2.5 : 2} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User button */}
      <div className="border-t border-pigeon-warm-rule p-5">
        <UserButton afterSignOutUrl="/" />
      </div>
    </aside>
  );
}
