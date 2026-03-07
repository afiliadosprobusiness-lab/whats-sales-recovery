import { env } from "../../config/env";
import {
  createConversationIdleEvent,
  createCustomerRepliedEvent,
  createRecoveryFailedEvent,
  createRecoverySentEvent,
  createRecoveryTriggeredEvent,
  createSaleRecoveredEvent,
  domainEvents,
  type ConversationIdleEvent
} from "../../events/domain/domain-events";
import { eventBus } from "../../events/event-bus";
import { logger } from "../../utils/logger";
import { WhatsAppSessionManager } from "../whatsapp-session/whatsapp-session.manager";
import {
  RecoveryRepository,
  type IdleConversationCandidate,
  type RecoveryAttemptRecord
} from "./recovery.repository";

const DEFAULT_RECOVERY_MESSAGE = `Hola 👋
Ayer preguntaste por el producto.

¿Te ayudo a terminar tu pedido?`;

export class RecoveryService {
  constructor(
    private readonly repository: RecoveryRepository,
    private readonly whatsappSessionManager: WhatsAppSessionManager
  ) {}

  registerEventHandlers(): void {
    eventBus.subscribe<ConversationIdleEvent>(
      domainEvents.CONVERSATION_IDLE,
      async (event) => {
        await this.handleConversationIdle(event);
      }
    );
  }

  async detectAndEmitIdleConversations(input: {
    idleThresholdHours: number;
    limit: number;
  }): Promise<number> {
    const candidates = await this.repository.findIdleConversationCandidates(
      input.idleThresholdHours,
      input.limit
    );

    for (const candidate of candidates) {
      await this.repository.markConversationIdle(candidate.conversationId);

      const idleEvent = createConversationIdleEvent(candidate.workspaceId, {
        conversationId: candidate.conversationId,
        contactId: candidate.contactId,
        idleHours: input.idleThresholdHours,
        lastBusinessMessageAt: candidate.lastBusinessMessageAt
      });

      eventBus.publish(idleEvent);

      await this.repository.logDomainEvent({
        workspaceId: candidate.workspaceId,
        eventName: domainEvents.CONVERSATION_IDLE,
        aggregateType: "conversation",
        aggregateId: candidate.conversationId,
        payload: idleEvent.payload
      });
    }

    return candidates.length;
  }

  async processScheduledAttempts(limit: number): Promise<{
    processed: number;
    sent: number;
    failed: number;
  }> {
    const attempts = await this.repository.listScheduledAttempts(limit);

    let sent = 0;
    let failed = 0;

    for (const attempt of attempts) {
      const success = await this.sendRecoveryAttempt(attempt);
      if (success) {
        sent += 1;
      } else {
        failed += 1;
      }
    }

    return {
      processed: attempts.length,
      sent,
      failed
    };
  }

  async handleInboundMessageForReply(input: {
    workspaceId: string;
    conversationId: string;
    providerMessageId: string;
  }): Promise<void> {
    const sentAttempt = await this.repository.getLatestSentAttemptForConversation({
      workspaceId: input.workspaceId,
      conversationId: input.conversationId
    });

    if (!sentAttempt) {
      return;
    }

    await this.repository.markRecoveryAttemptReplied(sentAttempt.id);

    const repliedAt = new Date().toISOString();
    const repliedEvent = createCustomerRepliedEvent(input.workspaceId, {
      recoveryAttemptId: sentAttempt.id,
      conversationId: input.conversationId,
      providerMessageId: input.providerMessageId,
      repliedAt
    });
    eventBus.publish(repliedEvent);

    await this.repository.logDomainEvent({
      workspaceId: input.workspaceId,
      eventName: domainEvents.CUSTOMER_REPLIED,
      aggregateType: "recovery_attempt",
      aggregateId: sentAttempt.id,
      correlationId: input.conversationId,
      payload: repliedEvent.payload
    });

    logger.info(
      {
        workspaceId: input.workspaceId,
        conversationId: input.conversationId,
        recoveryAttemptId: sentAttempt.id
      },
      "Customer replied after recovery message"
    );
  }

  async markSaleRecovered(input: {
    recoveryId: string;
    amount: number;
    currency: string;
  }): Promise<
    | {
        recoveryId: string;
        conversationId: string;
        amount: number;
        currency: string;
      }
    | null
  > {
    const attempt = await this.repository.getRecoveryAttemptById(input.recoveryId);
    if (!attempt) {
      return null;
    }

    const normalizedCurrency = input.currency.toUpperCase();

    await this.repository.createSaleOutcome({
      workspaceId: attempt.workspaceId,
      conversationId: attempt.conversationId,
      recoveryAttemptId: attempt.id,
      amount: input.amount,
      currency: normalizedCurrency
    });

    await this.repository.markRecoveryAttemptRecovered(attempt.id);
    await this.repository.closeConversation(attempt.conversationId);

    const recoveredAt = new Date().toISOString();
    const saleRecoveredEvent = createSaleRecoveredEvent(attempt.workspaceId, {
      recoveryAttemptId: attempt.id,
      conversationId: attempt.conversationId,
      amount: input.amount,
      currency: normalizedCurrency,
      recoveredAt
    });
    eventBus.publish(saleRecoveredEvent);

    await this.repository.logDomainEvent({
      workspaceId: attempt.workspaceId,
      eventName: domainEvents.SALE_RECOVERED,
      aggregateType: "recovery_attempt",
      aggregateId: attempt.id,
      correlationId: attempt.conversationId,
      payload: saleRecoveredEvent.payload
    });

    logger.info(
      {
        workspaceId: attempt.workspaceId,
        conversationId: attempt.conversationId,
        recoveryAttemptId: attempt.id,
        amount: input.amount,
        currency: normalizedCurrency
      },
      "Recovered sale recorded"
    );

    return {
      recoveryId: attempt.id,
      conversationId: attempt.conversationId,
      amount: input.amount,
      currency: normalizedCurrency
    };
  }

  private async handleConversationIdle(event: ConversationIdleEvent): Promise<void> {
    const { conversationId, contactId } = event.payload;

    const closed = await this.repository.isConversationClosed(conversationId);
    if (closed) {
      return;
    }

    const hasRecentAttempt = await this.repository.hasRecentRecoveryAttempt(
      conversationId,
      48
    );
    if (hasRecentAttempt) {
      return;
    }

    const optedOut = await this.repository.isContactOptedOut(contactId);
    if (optedOut) {
      return;
    }

    const attempt = await this.repository.createRecoveryAttempt({
      workspaceId: event.workspaceId,
      conversationId,
      contactId
    });

    logger.info(
      {
        recoveryAttemptId: attempt.id,
        workspaceId: attempt.workspaceId,
        conversationId: attempt.conversationId
      },
      "Recovery attempt scheduled"
    );
  }

  private async sendRecoveryAttempt(
    attempt: RecoveryAttemptRecord
  ): Promise<boolean> {
    const triggerEvent = createRecoveryTriggeredEvent(attempt.workspaceId, {
      recoveryAttemptId: attempt.id,
      conversationId: attempt.conversationId,
      contactId: attempt.contactId,
      scheduledAt: attempt.scheduledAt
    });
    eventBus.publish(triggerEvent);

    await this.repository.logDomainEvent({
      workspaceId: attempt.workspaceId,
      eventName: domainEvents.RECOVERY_TRIGGERED,
      aggregateType: "recovery_attempt",
      aggregateId: attempt.id,
      correlationId: attempt.conversationId,
      payload: triggerEvent.payload
    });

    const phone = await this.repository.getContactPhone(attempt.contactId);
    if (!phone) {
      await this.markRecoveryFailed(attempt, "Contact phone not found");
      return false;
    }

    try {
      const messageText =
        env.RECOVERY_TEMPLATE_TEXT?.trim() || DEFAULT_RECOVERY_MESSAGE;

      const sendResult = await this.whatsappSessionManager.sendMessage({
        workspaceId: attempt.workspaceId,
        contactPhone: phone,
        text: messageText
      });

      await this.repository.markRecoveryAttemptSent(attempt.id);

      const sentEvent = createRecoverySentEvent(attempt.workspaceId, {
        recoveryAttemptId: attempt.id,
        conversationId: attempt.conversationId,
        sentAt: new Date().toISOString()
      });
      eventBus.publish(sentEvent);

      await this.repository.logDomainEvent({
        workspaceId: attempt.workspaceId,
        eventName: domainEvents.RECOVERY_SENT,
        aggregateType: "recovery_attempt",
        aggregateId: attempt.id,
        correlationId: attempt.conversationId,
        payload: {
          ...sentEvent.payload,
          providerMessageId: sendResult.providerMessageId
        }
      });

      logger.info(
        {
          recoveryAttemptId: attempt.id,
          conversationId: attempt.conversationId,
          providerMessageId: sendResult.providerMessageId
        },
        "Recovery attempt sent"
      );

      return true;
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Unknown send error";
      await this.markRecoveryFailed(attempt, reason);
      return false;
    }
  }

  private async markRecoveryFailed(
    attempt: RecoveryAttemptRecord,
    reason: string
  ): Promise<void> {
    await this.repository.markRecoveryAttemptFailed(attempt.id, reason);

    const failedEvent = createRecoveryFailedEvent(attempt.workspaceId, {
      recoveryAttemptId: attempt.id,
      conversationId: attempt.conversationId,
      failedReason: reason
    });
    eventBus.publish(failedEvent);

    await this.repository.logDomainEvent({
      workspaceId: attempt.workspaceId,
      eventName: domainEvents.RECOVERY_FAILED,
      aggregateType: "recovery_attempt",
      aggregateId: attempt.id,
      correlationId: attempt.conversationId,
      payload: failedEvent.payload
    });

    logger.warn(
      {
        recoveryAttemptId: attempt.id,
        conversationId: attempt.conversationId,
        reason
      },
      "Recovery attempt failed"
    );
  }

  // Utility reserved for future testing/extension
  toCandidateSummary(candidate: IdleConversationCandidate): string {
    return `${candidate.workspaceId}:${candidate.conversationId}:${candidate.contactId}`;
  }
}
