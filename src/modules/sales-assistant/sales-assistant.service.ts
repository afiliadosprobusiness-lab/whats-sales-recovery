import { env } from "../../config/env";
import { logger } from "../../utils/logger";
import { WhatsAppSessionManager } from "../whatsapp-session/whatsapp-session.manager";
import {
  buildSalesAssistantSystemPrompt,
  buildSalesAssistantUserPrompt
} from "./sales-assistant.prompts";
import { SalesAssistantRepository } from "./sales-assistant.repository";
import {
  type SalesAssistantAgentInput,
  type SalesAssistantDashboardMetrics,
  type SalesAssistantIncomingInput,
  type WorkspaceChatbotSettings
} from "./sales-assistant.types";

const REPLY_DELAY_MIN_MS = 2000;
const REPLY_DELAY_MAX_MS = 4000;
const CONTEXT_RETRY_DELAY_MS = 150;
const OPENAI_REQUEST_TIMEOUT_MS = 8000;
const ASSISTANT_MESSAGE_ID_TTL_MS = 10 * 60 * 1000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class SalesAssistantService {
  private readonly humanTakeoverConversationIds = new Set<string>();
  private readonly responseQueueByConversation = new Map<string, Promise<void>>();
  private readonly assistantMessageIds = new Map<string, number>();

  constructor(
    private readonly repository: SalesAssistantRepository,
    private readonly whatsappSessionManager: WhatsAppSessionManager
  ) {}

  async handleIncomingMessage(input: SalesAssistantIncomingInput): Promise<void> {
    const customerMessage = input.customerMessage?.trim() ?? "";
    if (!customerMessage) {
      return;
    }

    const settings = await this.repository.getWorkspaceSettings(input.workspaceId);
    if (!settings.chatbotEnabled) {
      return;
    }

    const context = await this.resolveConversationContext(input);
    if (!context.conversationId) {
      return;
    }

    if (context.conversationStatus === "closed") {
      return;
    }

    if (context.contactOptOut) {
      return;
    }

    const conversationId = context.conversationId;
    await this.enqueueConversationResponse(conversationId, async () => {
      if (this.humanTakeoverConversationIds.has(conversationId)) {
        logger.info(
          { workspaceId: input.workspaceId, conversationId },
          "Sales assistant stopped (human takeover)"
        );
        return;
      }

      logger.info(
        {
          workspaceId: input.workspaceId,
          conversationId,
          providerMessageId: input.providerMessageId
        },
        "Sales assistant responding"
      );

      const recentLogs = await this.repository.listRecentChatbotLogs({
        workspaceId: input.workspaceId,
        conversationId,
        limit: 5
      });

      const botReply = await this.generateReply({
        settings,
        customerMessage,
        recentLogs
      });

      logger.info(
        { workspaceId: input.workspaceId, conversationId },
        "Sales assistant generated reply"
      );

      const delayMs = this.getReplyDelayMs();
      await sleep(delayMs);

      if (this.humanTakeoverConversationIds.has(conversationId)) {
        logger.info(
          { workspaceId: input.workspaceId, conversationId },
          "Sales assistant stopped (human takeover)"
        );
        return;
      }

      const sendResult = await this.whatsappSessionManager.sendMessage({
        workspaceId: input.workspaceId,
        contactPhone: input.contactPhone,
        text: botReply
      });

      if (sendResult.providerMessageId) {
        this.trackAssistantMessageId(sendResult.providerMessageId);
      }

      await this.repository.insertChatbotLog({
        workspaceId: input.workspaceId,
        conversationId,
        customerMessage,
        botResponse: botReply
      });
    });
  }

  async handleAgentMessage(input: SalesAssistantAgentInput): Promise<void> {
    if (
      input.providerMessageId &&
      this.isAssistantSentMessage(input.providerMessageId)
    ) {
      return;
    }

    const context = await this.repository.findConversationContext({
      workspaceId: input.workspaceId,
      sessionId: input.sessionId,
      contactPhone: input.contactPhone
    });

    if (!context.conversationId) {
      return;
    }

    this.humanTakeoverConversationIds.add(context.conversationId);

    logger.info(
      {
        workspaceId: input.workspaceId,
        conversationId: context.conversationId
      },
      "Sales assistant stopped (human takeover)"
    );
  }

  async getWorkspaceSettings(
    workspaceId: string
  ): Promise<WorkspaceChatbotSettings> {
    return this.repository.getWorkspaceSettings(workspaceId);
  }

  async updateWorkspaceSettings(input: {
    workspaceId: string;
    chatbotEnabled: boolean;
    chatbotStyle: string | null;
    chatbotProductContext: string | null;
  }): Promise<WorkspaceChatbotSettings> {
    return this.repository.upsertWorkspaceSettings(input);
  }

  async getDashboardMetrics(
    workspaceId: string
  ): Promise<SalesAssistantDashboardMetrics> {
    return this.repository.getDashboardMetrics(workspaceId);
  }

  private async resolveConversationContext(input: SalesAssistantIncomingInput) {
    const first = await this.repository.findConversationContext({
      workspaceId: input.workspaceId,
      sessionId: input.sessionId,
      contactPhone: input.contactPhone
    });

    if (first.conversationId) {
      return first;
    }

    await sleep(CONTEXT_RETRY_DELAY_MS);
    return this.repository.findConversationContext({
      workspaceId: input.workspaceId,
      sessionId: input.sessionId,
      contactPhone: input.contactPhone
    });
  }

  private async generateReply(input: {
    settings: WorkspaceChatbotSettings;
    customerMessage: string;
    recentLogs: Array<{
      customerMessage: string;
      botResponse: string;
      createdAt: string;
    }>;
  }): Promise<string> {
    const aiReply = await this.generateReplyWithOpenAI(input);
    if (aiReply) {
      return aiReply;
    }

    return this.generateFallbackReply(input.customerMessage);
  }

  private async generateReplyWithOpenAI(input: {
    settings: WorkspaceChatbotSettings;
    customerMessage: string;
    recentLogs: Array<{
      customerMessage: string;
      botResponse: string;
      createdAt: string;
    }>;
  }): Promise<string | null> {
    const apiKey = env.OPENAI_API_KEY?.trim();
    if (!apiKey) {
      return null;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => {
      controller.abort();
    }, OPENAI_REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(`${env.OPENAI_BASE_URL}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: env.OPENAI_MODEL,
          temperature: 0.6,
          max_tokens: 140,
          messages: [
            {
              role: "system",
              content: buildSalesAssistantSystemPrompt(input.settings)
            },
            {
              role: "user",
              content: buildSalesAssistantUserPrompt({
                customerMessage: input.customerMessage,
                recentLogs: input.recentLogs
              })
            }
          ]
        }),
        signal: controller.signal
      });

      if (!response.ok) {
        logger.warn(
          { status: response.status },
          "Sales assistant OpenAI request failed"
        );
        return null;
      }

      const data = (await response.json()) as {
        choices?: Array<{
          message?: {
            content?: string;
          };
        }>;
      };

      const text = data.choices?.[0]?.message?.content?.trim() ?? "";
      return text || null;
    } catch (error) {
      logger.warn({ error }, "Sales assistant OpenAI request error");
      return null;
    } finally {
      clearTimeout(timeout);
    }
  }

  private generateFallbackReply(customerMessage: string): string {
    const message = customerMessage.toLowerCase();

    if (
      message.includes("precio") ||
      message.includes("costo") ||
      message.includes("cuanto")
    ) {
      return [
        "Claro 👌",
        "Tenemos 2 opciones: 1) Entrega hoy 2) Entrega mañana.",
        "¿Para qué distrito sería tu pedido?"
      ].join("\n");
    }

    if (
      message.includes("informacion") ||
      message.includes("info") ||
      message.includes("detalles")
    ) {
      return [
        "Perfecto 👌",
        "¿Este producto lo necesitas para: 1) uso personal o 2) negocio?",
        "Así te recomiendo la mejor opción."
      ].join("\n");
    }

    if (
      message.includes("si") ||
      message.includes("quiero") ||
      message.includes("comprar")
    ) {
      return [
        "Excelente, avancemos con tu compra 🙌",
        "Compárteme por favor tu nombre completo y distrito de entrega.",
        "Con eso te confirmo el pedido hoy."
      ].join("\n");
    }

    return [
      "Gracias por escribirnos 👌",
      "Te ayudo a cerrar tu compra rápido.",
      "¿Prefieres entrega hoy o mañana?"
    ].join("\n");
  }

  private getReplyDelayMs(): number {
    return (
      REPLY_DELAY_MIN_MS +
      Math.floor(Math.random() * (REPLY_DELAY_MAX_MS - REPLY_DELAY_MIN_MS + 1))
    );
  }

  private async enqueueConversationResponse(
    conversationId: string,
    job: () => Promise<void>
  ): Promise<void> {
    const previous = this.responseQueueByConversation.get(conversationId);
    const next = (previous ?? Promise.resolve())
      .catch(() => undefined)
      .then(job)
      .finally(() => {
        if (this.responseQueueByConversation.get(conversationId) === next) {
          this.responseQueueByConversation.delete(conversationId);
        }
      });

    this.responseQueueByConversation.set(conversationId, next);
    await next;
  }

  private trackAssistantMessageId(providerMessageId: string): void {
    this.cleanupAssistantMessageIds();
    this.assistantMessageIds.set(
      providerMessageId,
      Date.now() + ASSISTANT_MESSAGE_ID_TTL_MS
    );
  }

  private isAssistantSentMessage(providerMessageId: string): boolean {
    this.cleanupAssistantMessageIds();
    return this.assistantMessageIds.has(providerMessageId);
  }

  private cleanupAssistantMessageIds(): void {
    const now = Date.now();
    for (const [messageId, expiresAt] of this.assistantMessageIds.entries()) {
      if (expiresAt <= now) {
        this.assistantMessageIds.delete(messageId);
      }
    }
  }
}
