import { randomUUID } from "node:crypto";

export const domainEvents = {
  MESSAGE_RECEIVED: "message_received",
  CONVERSATION_IDLE: "conversation_idle",
  RECOVERY_TRIGGERED: "recovery_triggered",
  RECOVERY_SENT: "recovery_sent",
  RECOVERY_FAILED: "recovery_failed",
  CUSTOMER_REPLIED: "customer_replied",
  SALE_RECOVERED: "sale_recovered"
} as const;

export type DomainEventName = (typeof domainEvents)[keyof typeof domainEvents];

export type MessageDirection = "inbound" | "outbound";

export type MessageReceivedPayload = {
  sessionId: string;
  providerMessageId: string;
  contactPhone: string;
  contactName: string | null;
  bodyText: string | null;
  messageType: string;
  direction: MessageDirection;
  occurredAt: string;
  rawPayload: Record<string, unknown>;
};

export type ConversationIdlePayload = {
  conversationId: string;
  contactId: string;
  idleHours: number;
  lastBusinessMessageAt: string;
};

export type RecoveryTriggeredPayload = {
  recoveryAttemptId: string;
  conversationId: string;
  contactId: string;
  scheduledAt: string;
};

export type RecoverySentPayload = {
  recoveryAttemptId: string;
  conversationId: string;
  sentAt: string;
};

export type RecoveryFailedPayload = {
  recoveryAttemptId: string;
  conversationId: string;
  failedReason: string;
};

export type CustomerRepliedPayload = {
  recoveryAttemptId: string;
  conversationId: string;
  providerMessageId: string;
  repliedAt: string;
};

export type SaleRecoveredPayload = {
  recoveryAttemptId: string;
  conversationId: string;
  amount: number;
  currency: string;
  recoveredAt: string;
};

type BaseDomainEvent<TName extends DomainEventName, TPayload> = {
  id: string;
  name: TName;
  workspaceId: string;
  occurredAt: string;
  payload: TPayload;
};

export type MessageReceivedEvent = BaseDomainEvent<
  typeof domainEvents.MESSAGE_RECEIVED,
  MessageReceivedPayload
>;

export type ConversationIdleEvent = BaseDomainEvent<
  typeof domainEvents.CONVERSATION_IDLE,
  ConversationIdlePayload
>;

export type RecoveryTriggeredEvent = BaseDomainEvent<
  typeof domainEvents.RECOVERY_TRIGGERED,
  RecoveryTriggeredPayload
>;

export type RecoverySentEvent = BaseDomainEvent<
  typeof domainEvents.RECOVERY_SENT,
  RecoverySentPayload
>;

export type RecoveryFailedEvent = BaseDomainEvent<
  typeof domainEvents.RECOVERY_FAILED,
  RecoveryFailedPayload
>;

export type CustomerRepliedEvent = BaseDomainEvent<
  typeof domainEvents.CUSTOMER_REPLIED,
  CustomerRepliedPayload
>;

export type SaleRecoveredEvent = BaseDomainEvent<
  typeof domainEvents.SALE_RECOVERED,
  SaleRecoveredPayload
>;

export type GenericDomainEvent = BaseDomainEvent<
  Exclude<
    DomainEventName,
    | typeof domainEvents.MESSAGE_RECEIVED
    | typeof domainEvents.CONVERSATION_IDLE
    | typeof domainEvents.RECOVERY_TRIGGERED
    | typeof domainEvents.RECOVERY_SENT
    | typeof domainEvents.RECOVERY_FAILED
    | typeof domainEvents.CUSTOMER_REPLIED
    | typeof domainEvents.SALE_RECOVERED
  >,
  Record<string, unknown>
>;

export type DomainEvent =
  | MessageReceivedEvent
  | ConversationIdleEvent
  | RecoveryTriggeredEvent
  | RecoverySentEvent
  | RecoveryFailedEvent
  | CustomerRepliedEvent
  | SaleRecoveredEvent
  | GenericDomainEvent;

export function createMessageReceivedEvent(
  workspaceId: string,
  payload: MessageReceivedPayload
): MessageReceivedEvent {
  return {
    id: randomUUID(),
    name: domainEvents.MESSAGE_RECEIVED,
    workspaceId,
    occurredAt: new Date().toISOString(),
    payload
  };
}

export function createConversationIdleEvent(
  workspaceId: string,
  payload: ConversationIdlePayload
): ConversationIdleEvent {
  return {
    id: randomUUID(),
    name: domainEvents.CONVERSATION_IDLE,
    workspaceId,
    occurredAt: new Date().toISOString(),
    payload
  };
}

export function createRecoveryTriggeredEvent(
  workspaceId: string,
  payload: RecoveryTriggeredPayload
): RecoveryTriggeredEvent {
  return {
    id: randomUUID(),
    name: domainEvents.RECOVERY_TRIGGERED,
    workspaceId,
    occurredAt: new Date().toISOString(),
    payload
  };
}

export function createRecoverySentEvent(
  workspaceId: string,
  payload: RecoverySentPayload
): RecoverySentEvent {
  return {
    id: randomUUID(),
    name: domainEvents.RECOVERY_SENT,
    workspaceId,
    occurredAt: new Date().toISOString(),
    payload
  };
}

export function createRecoveryFailedEvent(
  workspaceId: string,
  payload: RecoveryFailedPayload
): RecoveryFailedEvent {
  return {
    id: randomUUID(),
    name: domainEvents.RECOVERY_FAILED,
    workspaceId,
    occurredAt: new Date().toISOString(),
    payload
  };
}

export function createCustomerRepliedEvent(
  workspaceId: string,
  payload: CustomerRepliedPayload
): CustomerRepliedEvent {
  return {
    id: randomUUID(),
    name: domainEvents.CUSTOMER_REPLIED,
    workspaceId,
    occurredAt: new Date().toISOString(),
    payload
  };
}

export function createSaleRecoveredEvent(
  workspaceId: string,
  payload: SaleRecoveredPayload
): SaleRecoveredEvent {
  return {
    id: randomUUID(),
    name: domainEvents.SALE_RECOVERED,
    workspaceId,
    occurredAt: new Date().toISOString(),
    payload
  };
}
