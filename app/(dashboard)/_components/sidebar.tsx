"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { LayoutDashboard, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r border-pigeon-border bg-white">
      {/* Logo */}
      <div className="p-6">
        <span className="font-heading text-xl font-bold text-pigeon-primary">
          🐦 Pigeon
        </span>
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
                  ? "bg-pigeon-bg text-pigeon-primary"
                  : "text-pigeon-muted hover:bg-pigeon-bg hover:text-pigeon-primary"
              )}
            >
              <Icon size={16} strokeWidth={active ? 2.5 : 2} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User button */}
      <div className="border-t border-pigeon-border p-5">
        <UserButton afterSignOutUrl="/" />
      </div>
    </aside>
  );
}
