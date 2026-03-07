export type WorkspaceChatbotSettings = {
  workspaceId: string;
  chatbotEnabled: boolean;
  chatbotStyle: string | null;
  chatbotProductContext: string | null;
};

export type SalesAssistantConversationContext = {
  contactId: string | null;
  conversationId: string | null;
  conversationStatus: "open" | "idle" | "closed" | null;
  contactOptOut: boolean;
};

export type SalesAssistantLogRecord = {
  customerMessage: string;
  botResponse: string;
  createdAt: string;
};

export type SalesAssistantIncomingInput = {
  workspaceId: string;
  sessionId: string;
  contactPhone: string;
  customerMessage: string | null;
  providerMessageId: string;
};

export type SalesAssistantAgentInput = {
  workspaceId: string;
  sessionId: string;
  contactPhone: string;
  agentMessage: string | null;
  providerMessageId: string | null;
};

export type SalesAssistantDashboardMetrics = {
  chatbotMessagesSent: number;
  chatbotConversationsHandled: number;
  chatbotSalesClosed: number;
};
