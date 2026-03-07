"use client";

import type { ReactNode } from "react";
import { Navbar } from "@/components/navbar";
import { Sidebar } from "@/components/sidebar";
import type { AuthTokenPayload } from "@/lib/auth-token";
import { usePathname } from "next/navigation";

type AppShellProps = {
  children: ReactNode;
  user: AuthTokenPayload | null;
};

const authRoutes = new Set(["/login", "/register"]);

export function AppShell({ children, user }: AppShellProps): JSX.Element {
  const pathname = usePathname();

  if (authRoutes.has(pathname)) {
    return <div className="min-h-screen bg-slate-925 text-slate-100">{children}</div>;
  }

  return (
    <div className="grid min-h-screen grid-cols-1 bg-slate-925 text-slate-100 lg:grid-cols-[280px_1fr]">
      <Sidebar />

      <div className="flex min-h-screen flex-col">
        <Navbar userName={user?.name ?? "Workspace Owner"} userEmail={user?.email ?? ""} />
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
