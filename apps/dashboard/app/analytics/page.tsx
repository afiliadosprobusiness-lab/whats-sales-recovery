import { requireAuthenticatedUser } from "@/lib/auth-session";
import { getAnalyticsData } from "@/lib/saas-data";

export const dynamic = "force-dynamic";

function BarChartCard({
  title,
  subtitle,
  points,
  suffix = ""
}: {
  title: string;
  subtitle: string;
  points: Array<{ label: string; value: number }>;
  suffix?: string;
}): JSX.Element {
  const maxValue = Math.max(...points.map((point) => point.value), 1);

  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <p className="mt-1 text-sm text-slate-300">{subtitle}</p>

      <div className="mt-5 space-y-3">
        {points.map((point) => {
          const width = Math.max(8, Math.round((point.value / maxValue) * 100));

          return (
            <div key={point.label} className="space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span>{point.label}</span>
                <span>
                  {point.value}
                  {suffix}
                </span>
              </div>
              <div className="h-2 rounded-full bg-slate-800">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500"
                  style={{ width: `${width}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </article>
  );
}

export default async function AnalyticsPage(): Promise<JSX.Element> {
  requireAuthenticatedUser();

  const analytics = await getAnalyticsData();

  return (
    <section className="space-y-6">
      <header className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <h2 className="text-3xl font-semibold text-white">Analytics</h2>
        <p className="mt-2 text-sm text-slate-300">
          Placeholder charts for recovered revenue, follow-up performance, and
          lead conversion rate.
        </p>
      </header>

      <div className="grid gap-4 xl:grid-cols-3">
        <BarChartCard
          title="Recovered revenue"
          subtitle="Daily recovered revenue trend"
          points={analytics.recoveredRevenue}
        />
        <BarChartCard
          title="Follow-up performance"
          subtitle="Completion by sequence step"
          points={analytics.followupPerformance}
          suffix="%"
        />
        <BarChartCard
          title="Lead conversion rate"
          subtitle="Weekly conversion percentage"
          points={analytics.leadConversionRate}
          suffix="%"
        />
      </div>
    </section>
  );
}
