import { type Client, type Message } from "whatsapp-web.js";
import {
  createMessageReceivedEvent,
  type MessageReceivedPayload
} from "../../events/domain/domain-events";
import { eventBus } from "../../events/event-bus";
import { logger } from "../../utils/logger";

type AttachSessionInput = {
  workspaceId: string;
  sessionId: string;
  client: Client;
};

export class MessageIngestionService {
  attachSessionListeners(input: AttachSessionInput): void {
    const { client, workspaceId, sessionId } = input;

    client.on("message", (message) => {
      void this.ingestIncomingMessage(workspaceId, sessionId, message);
    });
  }

  async ingestIncomingMessage(
    workspaceId: string,
    sessionId: string,
    message: Message
  ): Promise<void> {
    const normalized = this.normalizeIncomingMessage(sessionId, message);
    if (!normalized) {
      return;
    }

    logger.info(
      {
        workspaceId,
        sessionId,
        providerMessageId: normalized.providerMessageId
      },
      "Incoming message received"
    );

    eventBus.publish(createMessageReceivedEvent(workspaceId, normalized));
  }

  private normalizeIncomingMessage(
    sessionId: string,
    message: Message
  ): MessageReceivedPayload | null {
    if (message.fromMe) {
      return null;
    }

    if (!message.from || !message.from.endsWith("@c.us")) {
      return null;
    }

    const providerMessageId = message.id?._serialized ?? "";
    if (!providerMessageId) {
      return null;
    }

    const rawPhone = message.from.split("@")[0];
    const contactPhone = this.normalizePhone(rawPhone);
    if (!contactPhone) {
      return null;
    }

    const occurredAt = new Date(
      Number.isFinite(message.timestamp) ? message.timestamp * 1000 : Date.now()
    ).toISOString();

    const rawPayload: Record<string, unknown> = {
      id: providerMessageId,
      from: message.from,
      to: message.to,
      body: message.body,
      type: message.type,
      timestamp: message.timestamp,
      fromMe: message.fromMe
    };

    return {
      sessionId,
      providerMessageId,
      contactPhone,
      contactName: null,
      bodyText: message.body ?? null,
      messageType: message.type ?? "text",
      direction: "inbound",
      occurredAt,
      rawPayload
    };
  }

  private normalizePhone(rawPhone: string): string | null {
    const digits = rawPhone.replace(/[^\d]/g, "");
    if (!digits) {
      return null;
    }

    return `+${digits}`;
  }
}
