import { requireAuthenticatedUser } from "@/lib/auth-session";

export const dynamic = "force-dynamic";

export default function SettingsPage(): JSX.Element {
  requireAuthenticatedUser();

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
      <h2 className="text-3xl font-semibold text-white">Advanced Settings</h2>
      <p className="mt-3 max-w-2xl text-sm text-slate-300">
        Webhook infrastructure is managed internally. Normal users should use
        <span className="text-cyan-200"> Automations </span>
        to enable or disable playbooks.
      </p>
    </section>
  );
}
