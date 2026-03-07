"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

type NavbarProps = {
  userName: string;
  userEmail: string;
};

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/connect-whatsapp": "Connect WhatsApp",
  "/conversations": "Conversations CRM",
  "/recovery": "Recovery Panel",
  "/analytics": "Analytics",
  "/settings": "Settings"
};

function resolveTitle(pathname: string): string {
  if (pathname.startsWith("/conversations/")) {
    return "Conversation Detail";
  }

  return pageTitles[pathname] ?? "RecuperaVentas";
}

export function Navbar({ userName, userEmail }: NavbarProps): JSX.Element {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout(): Promise<void> {
    setIsLoggingOut(true);

    try {
      await fetch("/api/auth/logout", {
        method: "POST"
      });
      router.replace("/login");
      router.refresh();
    } finally {
      setIsLoggingOut(false);
    }
  }

  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/70 px-6 py-4 backdrop-blur-xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-300/80">Workspace</p>
          <h1 className="text-xl font-semibold text-white">{resolveTitle(pathname)}</h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-right text-xs text-slate-300 sm:block">
            <p className="font-medium text-white">{userName}</p>
            <p>{userEmail}</p>
          </div>

          <button
            type="button"
            onClick={() => {
              void handleLogout();
            }}
            disabled={isLoggingOut}
            className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100 transition hover:bg-white/10 disabled:opacity-60"
          >
            {isLoggingOut ? "Signing out..." : "Sign out"}
          </button>
        </div>
      </div>
    </header>
  );
}
