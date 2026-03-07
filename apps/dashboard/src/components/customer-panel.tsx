import type { CrmConversation } from "@/lib/saas-data";

type CustomerPanelProps = {
  conversation: CrmConversation;
};

function stateLabel(state: CrmConversation["state"]): string {
  return state.replaceAll("_", " ");
}

export function CustomerPanel({ conversation }: CustomerPanelProps): JSX.Element {
  return (
    <aside className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-slate-300">
        Customer info
      </h2>

      <dl className="space-y-3 text-sm">
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
          <dt className="text-xs uppercase tracking-wide text-slate-400">Phone number</dt>
          <dd className="mt-1 text-white">{conversation.phone}</dd>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
          <dt className="text-xs uppercase tracking-wide text-slate-400">Lead score</dt>
          <dd className="mt-1 text-white">{conversation.leadScore}/100</dd>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
          <dt className="text-xs uppercase tracking-wide text-slate-400">Conversation state</dt>
          <dd className="mt-1 text-white">{stateLabel(conversation.state)}</dd>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
          <dt className="text-xs uppercase tracking-wide text-slate-400">Last activity</dt>
          <dd className="mt-1 text-white">{conversation.lastActivity}</dd>
        </div>
      </dl>
    </aside>
  );
}
