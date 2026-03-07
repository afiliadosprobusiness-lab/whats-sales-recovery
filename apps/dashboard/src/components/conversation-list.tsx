"use client";

import type { CrmConversation } from "@/lib/saas-data";

type ConversationListProps = {
  conversations: CrmConversation[];
  selectedConversationId: string;
  onSelect: (conversationId: string) => void;
};

function stateLabel(state: CrmConversation["state"]): string {
  return state.replaceAll("_", " ");
}

export function ConversationList({
  conversations,
  selectedConversationId,
  onSelect
}: ConversationListProps): JSX.Element {
  return (
    <section className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-slate-300">
        Conversation list
      </h2>

      <div className="space-y-2">
        {conversations.map((conversation) => {
          const selected = conversation.id === selectedConversationId;

          return (
            <button
              type="button"
              key={conversation.id}
              onClick={() => onSelect(conversation.id)}
              className={[
                "w-full rounded-xl border px-3 py-3 text-left transition",
                selected
                  ? "border-cyan-400/60 bg-cyan-400/10"
                  : "border-white/10 bg-white/[0.02] hover:bg-white/[0.06]"
              ].join(" ")}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-white">{conversation.customerName}</p>
                <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-slate-300">
                  {stateLabel(conversation.state)}
                </span>
              </div>

              <p className="mt-1 text-xs text-slate-300">{conversation.phone}</p>
              <p className="mt-2 line-clamp-1 text-sm text-slate-400">{conversation.lastMessage}</p>
            </button>
          );
        })}
      </div>
    </section>
  );
}
