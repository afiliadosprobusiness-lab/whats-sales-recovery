import Link from "next/link";
import { Manrope } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope"
});

type RootLayoutProps = {
  children: ReactNode;
};

export const metadata = {
  title: "RecuperaVentas Dashboard",
  description: "Recovered sales and conversation tracking"
};

export default function RootLayout({ children }: RootLayoutProps): JSX.Element {
  return (
    <html lang="en">
      <body className={manrope.variable}>
        <div className="app-shell">
          <aside className="sidebar">
            <p className="sidebar__brand">RecuperaVentas</p>
            <nav className="sidebar__nav">
              <Link href="/connect-whatsapp">Connect WhatsApp</Link>
              <Link href="/dashboard">Dashboard</Link>
              <Link href="/conversations">Conversations</Link>
            </nav>
          </aside>
          <main className="content">{children}</main>
        </div>
      </body>
    </html>
  );
}
