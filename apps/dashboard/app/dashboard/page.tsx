import { MetricCard } from "@/components/metric-card";
import { getDashboardMetrics, getWorkspaceConfig } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function DashboardPage(): Promise<JSX.Element> {
  const config = getWorkspaceConfig();

  if (!config.configured) {
    return (
      <section className="panel">
        <h1 className="page-title">Dashboard</h1>
        <p className="muted">
          Missing environment config. Set `NEXT_PUBLIC_API_BASE_URL` and
          `NEXT_PUBLIC_WORKSPACE_ID` in `apps/dashboard/.env.local`.
        </p>
      </section>
    );
  }

  const metrics = await getDashboardMetrics();

  return (
    <section className="page">
      <header className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="muted">Recovered sales performance overview</p>
      </header>

      <div className="metric-grid">
        <MetricCard
          label="Recovered Revenue"
          value={`S/ ${metrics.recoveredRevenue.toFixed(2)}`}
          tone="highlight"
        />
        <MetricCard
          label="Recovered Sales"
          value={String(metrics.recoveredSales)}
          tone="default"
        />
        <MetricCard
          label="Recovery Messages Sent"
          value={String(metrics.recoveryMessagesSent)}
        />
        <MetricCard
          label="Total Conversations"
          value={String(metrics.totalConversations)}
        />
        <MetricCard
          label="Idle Conversations"
          value={String(metrics.idleConversations)}
        />
      </div>
    </section>
  );
}
