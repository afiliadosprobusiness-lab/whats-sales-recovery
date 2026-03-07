import Link from "next/link";
import { StatusPill } from "@/components/status-pill";
import {
  getConversationSummaries,
  getWorkspaceConfig
} from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function ConversationsPage(): Promise<JSX.Element> {
  const config = getWorkspaceConfig();
  if (!config.configured) {
    return (
      <section className="panel">
        <h1 className="page-title">Conversations</h1>
        <p className="muted">
          Missing environment config. Set `NEXT_PUBLIC_API_BASE_URL` and
          `NEXT_PUBLIC_WORKSPACE_ID` in `apps/dashboard/.env.local`.
        </p>
      </section>
    );
  }

  const summaries = await getConversationSummaries();

  return (
    <section className="page">
      <header className="page-header">
        <h1 className="page-title">Conversations</h1>
        <p className="muted">Track recovery and recovered revenue per contact</p>
      </header>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Contact phone</th>
              <th>Last message</th>
              <th>Recovery status</th>
              <th>Recovered</th>
              <th>Recovered amount</th>
              <th>Detail</th>
            </tr>
          </thead>
          <tbody>
            {summaries.length === 0 ? (
              <tr>
                <td colSpan={6} className="table-empty">
                  No conversations available.
                </td>
              </tr>
            ) : null}
            {summaries.map((item) => (
              <tr key={item.conversationId}>
                <td>{item.contactPhone}</td>
                <td>{item.lastMessage}</td>
                <td>
                  <StatusPill value={item.recoveryStatus} />
                </td>
                <td>
                  <StatusPill value={item.saleRecovered ? "yes" : "no"} />
                </td>
                <td>S/ {item.recoveredAmount.toFixed(2)}</td>
                <td>
                  <Link href={`/conversations/${item.conversationId}`}>Open</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
