import {
  domainEvents,
  type MessageReceivedEvent
} from "../../events/domain/domain-events";
import { eventBus } from "../../events/event-bus";
import { logger } from "../../utils/logger";
import { AbandonedDetectorService } from "../abandoned-detector/abandoned-detector.service";
import { RecoveryService } from "../recovery/recovery.service";
import {
  type N8nAutomationLead,
  N8nAutomationsService
} from "../../services/n8n-automations";
import {
  type N8nChatbotInboundPayload,
  N8nChatbotService
} from "../../services/n8n-chatbot";
import { ConversationRepository } from "./conversation.repository";

export class ConversationService {
  constructor(
    private readonly repository: ConversationRepository,
    private readonly recoveryService: RecoveryService,
    private readonly abandonedDetectorService: AbandonedDetectorService,
    private readonly n8nAutomationsService: N8nAutomationsService,
    private readonly n8nChatbotService: N8nChatbotService
  ) {}

  registerEventHandlers(): void {
    eventBus.subscribe<MessageReceivedEvent>(
      domainEvents.MESSAGE_RECEIVED,
      async (event) => {
        await this.handleMessageReceived(event);
      }
    );
  }

  async handleMessageReceived(event: MessageReceivedEvent): Promise<void> {
    const payload = event.payload;

    const contact = await this.repository.upsertContact(
      event.workspaceId,
      payload.contactPhone,
      payload.contactName
    );

    const existingConversation = await this.repository.findActiveConversation(
      event.workspaceId,
      contact.id,
      payload.sessionId
    );

    const conversation =
      existingConversation ??
      (await this.repository.createConversation(
        event.workspaceId,
        contact.id,
        payload.sessionId
      ));

    const inserted = await this.repository.insertMessage({
      workspaceId: event.workspaceId,
      conversationId: conversation.id,
      providerMessageId: payload.providerMessageId,
      direction: payload.direction,
      messageType: payload.messageType,
      bodyText: payload.bodyText,
      providerStatus: null,
      occurredAt: payload.occurredAt,
      rawPayload: payload.rawPayload
    });

    if (!inserted) {
      logger.debug(
        { providerMessageId: payload.providerMessageId },
        "Ignoring duplicated message"
      );
      return;
    }

    await this.repository.updateConversationActivity(
      conversation.id,
      payload.direction,
      payload.occurredAt
    );

    if (payload.direction === "inbound") {
      await this.abandonedDetectorService.clearAbandonmentOnInboundMessage({
        workspaceId: event.workspaceId,
        conversationId: conversation.id
      });
      await this.abandonedDetectorService.evaluatePurchaseIntent({
        workspaceId: event.workspaceId,
        conversationId: conversation.id,
        bodyText: payload.bodyText
      });
      await this.recoveryService.handleInboundMessageForReply({
        workspaceId: event.workspaceId,
        conversationId: conversation.id,
        providerMessageId: payload.providerMessageId
      });

      this.triggerRecoveryAutomations({
        workspaceId: event.workspaceId,
        conversationId: conversation.id,
        name: contact.displayName ?? payload.contactName ?? payload.contactPhone,
        phone: contact.phoneE164,
        lastMessage: payload.bodyText,
        lastMessageTime: payload.occurredAt,
        status: "open"
      });

      if (this.shouldForwardInboundTextMessage(payload)) {
        const leadStatus = existingConversation?.status ?? "new";
        const conversationIdForWebhook =
          existingConversation?.id ??
          this.buildStableConversationId(event.workspaceId, contact.phoneE164);

        this.triggerAiChatbotWebhook({
          workspace_id: event.workspaceId,
          phone: contact.phoneE164,
          lead_name: contact.displayName ?? payload.contactName ?? "",
          message: payload.bodyText?.trim() ?? "",
          lead_status: leadStatus,
          conversation_id: conversationIdForWebhook,
          timestamp: payload.occurredAt
        });
      }
    }

    await this.repository.logDomainEvent(
      event.workspaceId,
      domainEvents.MESSAGE_RECEIVED,
      "conversation",
      conversation.id,
      payload
    );
  }

  private triggerRecoveryAutomations(lead: N8nAutomationLead): void {
    void this.n8nAutomationsService.triggerSalesRecoveryPlaybook(lead);
  }

  private triggerAiChatbotWebhook(payload: N8nChatbotInboundPayload): void {
    void this.n8nChatbotService.forwardIncomingMessageToAiRouter(payload);
  }

  private shouldForwardInboundTextMessage(
    payload: MessageReceivedEvent["payload"]
  ): boolean {
    if (payload.direction !== "inbound") {
      return false;
    }

    const bodyText = payload.bodyText?.trim() ?? "";
    if (!bodyText) {
      return false;
    }

    return (
      payload.messageType === "conversation" ||
      payload.messageType === "extendedTextMessage"
    );
  }

  private buildStableConversationId(workspaceId: string, phone: string): string {
    return `${workspaceId}:${phone}`;
  }

  async listConversations(input: {
    workspaceId: string;
    status: "open" | "idle" | "closed" | null;
    limit: number;
    offset: number;
  }) {
    return this.repository.listConversations(
      input.workspaceId,
      input.status,
      input.limit,
      input.offset
    );
  }

  async getConversationById(input: {
    workspaceId: string;
    conversationId: string;
    messageLimit: number;
  }) {
    const conversation = await this.repository.getConversationById(
      input.workspaceId,
      input.conversationId
    );

    if (!conversation) {
      return null;
    }

    const messages = await this.repository.listMessagesForConversation(
      input.workspaceId,
      input.conversationId,
      input.messageLimit
    );

    const latestRecovery =
      await this.repository.getLatestRecoveryForConversation(
        input.workspaceId,
        input.conversationId
      );

    const latestSaleOutcome =
      await this.repository.getLatestSaleOutcomeForConversation(
        input.workspaceId,
        input.conversationId
      );

    const saleRecovered = latestSaleOutcome !== null;
    const recoveredAmount = latestSaleOutcome?.amount ?? null;
    const recoveryStatus = latestRecovery?.status ?? null;

    return {
      conversation,
      messages,
      latest_recovery: latestRecovery,
      is_recovered: saleRecovered,
      recovery_status: recoveryStatus,
      sale_recovered: saleRecovered,
      recovered_amount: recoveredAmount
    };
  }
}
