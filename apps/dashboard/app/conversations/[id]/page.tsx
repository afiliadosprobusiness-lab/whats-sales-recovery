import Link from "next/link";
import { notFound } from "next/navigation";
import { StatusPill } from "@/components/status-pill";
import { getConversationById, getWorkspaceConfig } from "@/lib/api";
import { MarkSaleForm } from "./mark-sale-form";

type ConversationDetailPageProps = {
  params: {
    id: string;
  };
};

export const dynamic = "force-dynamic";

export default async function ConversationDetailPage({
  params
}: ConversationDetailPageProps): Promise<JSX.Element> {
  const config = getWorkspaceConfig();
  if (!config.configured) {
    return (
      <section className="panel">
        <h1 className="page-title">Conversation detail</h1>
        <p className="muted">
          Missing environment config. Set `NEXT_PUBLIC_API_BASE_URL` and
          `NEXT_PUBLIC_WORKSPACE_ID` in `apps/dashboard/.env.local`.
        </p>
      </section>
    );
  }

  const detail = await getConversationById(params.id);
  if (!detail) {
    notFound();
  }

  const latestRecovery = detail.latest_recovery;
  const canMarkSale =
    latestRecovery !== null &&
    ["sent", "replied"].includes(latestRecovery.status) &&
    !detail.sale_recovered;

  return (
    <section className="page">
      <header className="page-header">
        <h1 className="page-title">Conversation {detail.conversation.id}</h1>
        <p className="muted">
          <Link href="/conversations">Back to conversations</Link>
        </p>
      </header>

      <div className="detail-grid">
        <article className="panel">
          <h2>Recovery summary</h2>
          <dl className="detail-list">
            <div>
              <dt>Recovery status</dt>
              <dd>
                <StatusPill value={detail.recovery_status ?? "none"} />
              </dd>
            </div>
            <div>
              <dt>Sale recovered</dt>
              <dd>
                <StatusPill value={detail.sale_recovered ? "yes" : "no"} />
              </dd>
            </div>
            <div>
              <dt>Recovered amount</dt>
              <dd>S/ {(detail.recovered_amount ?? 0).toFixed(2)}</dd>
            </div>
            <div>
              <dt>Latest recovery</dt>
              <dd>{latestRecovery?.id ?? "-"}</dd>
            </div>
          </dl>

          {canMarkSale && latestRecovery ? (
            <MarkSaleForm recoveryId={latestRecovery.id} />
          ) : (
            <p className="muted">
              Mark sale action is available only when latest recovery is sent or
              replied.
            </p>
          )}
        </article>

        <article className="panel">
          <h2>Messages</h2>
          <div className="message-list">
            {detail.messages.length === 0 ? (
              <p className="muted">No messages yet.</p>
            ) : null}
            {detail.messages.map((message) => (
              <div
                key={message.id}
                className={`message message--${message.direction}`}
              >
                <p className="message__meta">
                  {message.direction} -{" "}
                  {new Date(message.createdAt).toLocaleString()}
                </p>
                <p>{message.bodyText || "-"}</p>
              </div>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}
