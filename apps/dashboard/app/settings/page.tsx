import Link from "next/link";
import { requireAuthenticatedUser } from "@/lib/auth-session";

export const dynamic = "force-dynamic";

export default function SettingsPage(): JSX.Element {
  requireAuthenticatedUser();

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
      <h2 className="text-3xl font-semibold text-white">Settings</h2>
      <p className="mt-3 max-w-2xl text-sm text-slate-300">
        Settings flow is scaffolded for the SaaS navigation. Use
        <span className="text-cyan-200"> Connect WhatsApp </span>
        to configure your session first.
      </p>
      <Link
        href="/connect-whatsapp"
        className="mt-6 inline-flex rounded-xl bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950"
      >
        Go to WhatsApp connection
      </Link>
    </section>
  );
}
