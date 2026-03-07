import { MetricCard } from "@/components/metric-card";
import { requireAuthenticatedUser } from "@/lib/auth-session";
import { getDashboardMetrics } from "@/lib/saas-data";
import { AutomationsStatusCard } from "./automations-status-card";

export const dynamic = "force-dynamic";

export default async function DashboardPage(): Promise<JSX.Element> {
  const user = requireAuthenticatedUser();
  const metrics = await getDashboardMetrics();

  return (
    <section className="space-y-6">
      <header className="rounded-2xl border border-white/10 bg-gradient-to-r from-cyan-500/15 via-blue-500/15 to-transparent p-6">
        <p className="text-sm text-cyan-200">Welcome back, {user.name}</p>
        <h2 className="mt-2 text-3xl font-semibold text-white">
          Revenue recovery command center
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-slate-300">
          Monitor customer intent, prioritize high-value opportunities, and keep
          recovery automation moving in real time.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard
            key={metric.label}
            label={metric.label}
            value={metric.value}
            delta={metric.delta}
          />
        ))}
      </div>

      <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <h3 className="text-lg font-semibold text-white">Pipeline focus</h3>
        <p className="mt-2 text-sm text-slate-300">
          Follow-up sequencer and deal probability workers are currently in
          placeholder mode on frontend. Connect production endpoints to replace
          demo insights with live workspace signals.
        </p>
      </article>

      <AutomationsStatusCard />
    </section>
  );
}
