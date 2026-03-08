"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  getDefaultWorkspaceId,
  getStoredWorkspaceId,
  getWhatsappSessionStatusByWorkspace
} from "@/lib/api";

const navigationItems: Array<{ href: string; label: string }> = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/connect-whatsapp", label: "Connect WhatsApp" },
  { href: "/conversations", label: "Conversations" },
  { href: "/recovery", label: "Recovery" },
  { href: "/automations", label: "Automations" },
  { href: "/analytics", label: "Analytics" },
  { href: "/settings", label: "Settings" }
];

type SidebarConnectionStatus = "checking" | "connected" | "not_connected";

function isActivePath(currentPath: string, targetPath: string): boolean {
  if (currentPath === targetPath) {
    return true;
  }

  return currentPath.startsWith(`${targetPath}/`);
}

export function Sidebar(): JSX.Element {
  const pathname = usePathname();
  const defaultWorkspaceId = useMemo(() => getDefaultWorkspaceId(), []);
  const [workspaceId, setWorkspaceId] = useState(defaultWorkspaceId);
  const [connectionStatus, setConnectionStatus] =
    useState<SidebarConnectionStatus>("checking");

  useEffect(() => {
    const storedWorkspaceId = getStoredWorkspaceId();
    if (workspaceId || !storedWorkspaceId) {
      return;
    }

    setWorkspaceId(storedWorkspaceId);
  }, [workspaceId]);

  useEffect(() => {
    if (!workspaceId) {
      setConnectionStatus("not_connected");
      return;
    }

    let isCancelled = false;
    setConnectionStatus("checking");

    void getWhatsappSessionStatusByWorkspace({ workspaceId })
      .then((response) => {
        if (isCancelled) {
          return;
        }

        setConnectionStatus(response.connected ? "connected" : "not_connected");
      })
      .catch(() => {
        if (!isCancelled) {
          setConnectionStatus("not_connected");
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [workspaceId, pathname]);

  const statusToneClass =
    connectionStatus === "connected"
      ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-200"
      : connectionStatus === "checking"
        ? "border-amber-400/40 bg-amber-500/10 text-amber-100"
        : "border-rose-400/40 bg-rose-500/10 text-rose-100";

  const statusText =
    connectionStatus === "connected"
      ? "Connected"
      : connectionStatus === "checking"
        ? "Checking..."
        : "Not connected";

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

        <div className="mt-auto space-y-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="text-slate-300">WhatsApp</span>
            <span
              className={[
                "inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                statusToneClass
              ].join(" ")}
            >
              {statusText}
            </span>
          </div>
          <p className="text-xs text-slate-300">AI recovery engine active.</p>
        </div>
      </div>
    </aside>
  );
}
