"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navigationItems: Array<{ href: string; label: string }> = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/conversations", label: "Conversations" },
  { href: "/recovery", label: "Recovery" },
  { href: "/analytics", label: "Analytics" },
  { href: "/settings", label: "Settings" }
];

function isActivePath(currentPath: string, targetPath: string): boolean {
  if (currentPath === targetPath) {
    return true;
  }

  return currentPath.startsWith(`${targetPath}/`);
}

export function Sidebar(): JSX.Element {
  const pathname = usePathname();

  return (
    <aside className="border-r border-white/10 bg-slate-950/80 backdrop-blur-xl">
      <div className="flex h-full flex-col px-4 py-6">
        <Link
          href="/dashboard"
          className="rounded-2xl border border-white/10 bg-gradient-to-r from-cyan-400/15 to-blue-500/15 px-4 py-3 text-sm font-semibold tracking-wide text-white"
        >
          RecuperaVentas
        </Link>

        <nav className="mt-6 space-y-1.5">
          {navigationItems.map((item) => {
            const active = isActivePath(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition",
                  active
                    ? "bg-cyan-400/20 text-white"
                    : "text-slate-300 hover:bg-white/5 hover:text-white"
                ].join(" ")}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs text-slate-300">
          AI recovery engine active.
        </div>
      </div>
    </aside>
  );
}
