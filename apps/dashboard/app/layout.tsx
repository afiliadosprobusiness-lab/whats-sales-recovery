import { DM_Sans, Space_Grotesk } from "next/font/google";
import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell";
import { getAuthenticatedUser } from "@/lib/auth-session";
import "./globals.css";

const bodyFont = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body"
});

const displayFont = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display"
});

type RootLayoutProps = {
  children: ReactNode;
};

export const metadata = {
  title: "RecuperaVentas",
  description: "Recover revenue from WhatsApp conversations"
};

export default function RootLayout({ children }: RootLayoutProps): JSX.Element {
  const user = getAuthenticatedUser();

  return (
    <html lang="en">
      <body
        className={`${bodyFont.variable} ${displayFont.variable} min-h-screen bg-slate-925 text-slate-100 antialiased`}
      >
        <AppShell user={user}>{children}</AppShell>
      </body>
    </html>
  );
}
