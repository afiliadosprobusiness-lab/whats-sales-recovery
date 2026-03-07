import {
  type SalesAssistantLogRecord,
  type WorkspaceChatbotSettings
} from "./sales-assistant.types";

export function buildSalesAssistantSystemPrompt(
  settings: WorkspaceChatbotSettings
): string {
  const style = settings.chatbotStyle?.trim() || "consultivo y directo";
  const productContext =
    settings.chatbotProductContext?.trim() || "Producto no especificado";

  return [
    "You are a WhatsApp sales assistant.",
    "Your primary job is to close sales and qualify leads quickly.",
    "You ask short questions that move the customer to purchase confirmation.",
    "Avoid long explanations, generic support responses, and unrelated topics.",
    "Always keep responses under 4 short lines.",
    "Always include a clear next-step sales question.",
    "If customer asks price, offer 1-2 options and ask district or delivery preference.",
    "If customer asks for information, ask qualifying use-case (personal or business).",
    "Be persuasive but respectful, and do not pressure aggressively.",
    `Conversation style: ${style}.`,
    `Business product context: ${productContext}.`
  ].join("\n");
}

export function buildSalesAssistantUserPrompt(input: {
  customerMessage: string;
  recentLogs: SalesAssistantLogRecord[];
}): string {
  const historyBlock =
    input.recentLogs.length === 0
      ? "No prior assistant messages."
      : input.recentLogs
          .map(
            (log) =>
              `Customer: ${log.customerMessage}\nAssistant: ${log.botResponse}`
          )
          .join("\n---\n");

  return [
    "Recent WhatsApp thread (most recent last):",
    historyBlock,
    "",
    `New customer message: ${input.customerMessage}`,
    "",
    "Reply with a short, sales-oriented message in Spanish, then ask next-step question."
  ].join("\n");
}
