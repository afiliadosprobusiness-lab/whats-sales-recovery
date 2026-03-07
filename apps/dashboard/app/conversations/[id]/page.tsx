import Link from "next/link";
import { notFound } from "next/navigation";
import { StatusPill } from "@/components/status-pill";
import { requireAuthenticatedUser } from "@/lib/auth-session";
import { getConversationById } from "@/lib/api";
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
  requireAuthenticatedUser();

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
    <section className="space-y-6">
      <header className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <p className="text-sm text-cyan-200">
          <Link href="/conversations">Back to conversations</Link>
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-white">
          Conversation {detail.conversation.id}
        </h2>
      </header>

      <div className="grid gap-4 xl:grid-cols-[360px_1fr]">
        <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <h3 className="text-lg font-semibold text-white">Recovery summary</h3>

          <dl className="mt-4 space-y-3 text-sm">
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
              <dt className="text-xs uppercase tracking-wide text-slate-400">Recovery status</dt>
              <dd className="mt-1">
                <StatusPill value={detail.recovery_status ?? "none"} />
              </dd>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
              <dt className="text-xs uppercase tracking-wide text-slate-400">Sale recovered</dt>
              <dd className="mt-1">
                <StatusPill value={detail.sale_recovered ? "yes" : "no"} />
              </dd>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
              <dt className="text-xs uppercase tracking-wide text-slate-400">Recovered amount</dt>
              <dd className="mt-1 text-white">S/ {(detail.recovered_amount ?? 0).toFixed(2)}</dd>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
              <dt className="text-xs uppercase tracking-wide text-slate-400">Latest recovery</dt>
              <dd className="mt-1 break-all text-slate-200">{latestRecovery?.id ?? "-"}</dd>
            </div>
          </dl>

          <div className="mt-4">
            {canMarkSale && latestRecovery ? (
              <MarkSaleForm recoveryId={latestRecovery.id} />
            ) : (
              <p className="text-xs text-slate-400">
                Mark sale action is available only when latest recovery is sent or
                replied.
              </p>
            )}
          </div>
        </article>

        <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <h3 className="text-lg font-semibold text-white">Messages</h3>

          <div className="mt-4 space-y-3">
            {detail.messages.length === 0 ? (
              <p className="text-sm text-slate-400">No messages yet.</p>
            ) : null}

            {detail.messages.map((message) => (
              <div
                key={message.id}
                className={[
                  "max-w-[92%] rounded-2xl border px-4 py-3 text-sm",
                  message.direction === "outbound"
                    ? "ml-auto border-cyan-400/25 bg-cyan-500/10"
                    : "border-white/10 bg-white/[0.03]"
                ].join(" ")}
              >
                <p className="text-xs text-slate-400">
                  {message.direction} - {new Date(message.createdAt).toLocaleString()}
                </p>
                <p className="mt-1 text-slate-100">{message.bodyText || "-"}</p>
              </div>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}
