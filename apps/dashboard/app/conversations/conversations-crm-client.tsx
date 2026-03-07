"use client";

import { useMemo, useState } from "react";
import { ChatWindow } from "@/components/chat-window";
import { ConversationList } from "@/components/conversation-list";
import { CustomerPanel } from "@/components/customer-panel";
import type { CrmConversation } from "@/lib/saas-data";

type ConversationsCrmClientProps = {
  conversations: CrmConversation[];
};

export function ConversationsCrmClient({
  conversations
}: ConversationsCrmClientProps): JSX.Element {
  const [selectedConversationId, setSelectedConversationId] = useState(
    conversations[0]?.id ?? ""
  );

  const selectedConversation = useMemo(
    () =>
      conversations.find((conversation) => conversation.id === selectedConversationId) ??
      conversations[0],
    [conversations, selectedConversationId]
  );

  if (!selectedConversation) {
    return (
      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <h2 className="text-2xl font-semibold text-white">Conversations CRM</h2>
        <p className="mt-2 text-sm text-slate-300">
          No conversations available for this workspace yet.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <header className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <h2 className="text-3xl font-semibold text-white">Conversations CRM</h2>
        <p className="mt-2 text-sm text-slate-300">
          Manage customer conversations with lead context and recovery insights.
        </p>
      </header>

      <div className="grid gap-4 xl:grid-cols-[320px_1fr_300px]">
        <ConversationList
          conversations={conversations}
          selectedConversationId={selectedConversation.id}
          onSelect={setSelectedConversationId}
        />

        <ChatWindow messages={selectedConversation.messages} />

        <CustomerPanel conversation={selectedConversation} />
      </div>
    </section>
  );
}
