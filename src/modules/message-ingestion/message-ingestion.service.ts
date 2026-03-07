import { type WASocket, type WAMessage, type proto } from "@whiskeysockets/baileys";
import {
  createMessageReceivedEvent,
  type MessageReceivedPayload
} from "../../events/domain/domain-events";
import { eventBus } from "../../events/event-bus";
import { logger } from "../../utils/logger";
import { type SalesAssistantService } from "../sales-assistant/sales-assistant.service";

type AttachSessionInput = {
  workspaceId: string;
  sessionId: string;
  socket: WASocket;
};

export class MessageIngestionService {
  private salesAssistantService: SalesAssistantService | null = null;

  setSalesAssistantService(service: SalesAssistantService): void {
    this.salesAssistantService = service;
  }

  attachSessionListeners(input: AttachSessionInput): void {
    const { socket, workspaceId, sessionId } = input;

    socket.ev.on("messages.upsert", (event) => {
      if (event.type !== "notify") {
        return;
      }

      for (const message of event.messages) {
        if (message.key?.fromMe) {
          void this.handleAgentOutgoingMessage(workspaceId, sessionId, message);
          continue;
        }
        void this.ingestIncomingMessage(workspaceId, sessionId, message);
      }
    });
  }

  async ingestIncomingMessage(
    workspaceId: string,
    sessionId: string,
    message: WAMessage
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

    if (this.salesAssistantService) {
      void this.salesAssistantService.handleIncomingMessage({
        workspaceId,
        sessionId,
        contactPhone: normalized.contactPhone,
        customerMessage: normalized.bodyText,
        providerMessageId: normalized.providerMessageId
      });
    }
  }

  private normalizeIncomingMessage(
    sessionId: string,
    message: WAMessage
  ): MessageReceivedPayload | null {
    const remoteJid = message.key?.remoteJid ?? "";
    const contactPhone = this.normalizePhoneFromJid(remoteJid);

    const providerMessageId = message.key?.id ?? "";
    if (!providerMessageId || !contactPhone) {
      return null;
    }

    const { bodyText, messageType } = this.extractMessageData(message.message);
    const occurredAt = new Date(
      this.resolveTimestampSeconds(message.messageTimestamp) * 1000
    ).toISOString();

    const rawPayload: Record<string, unknown> = {
      id: providerMessageId,
      remoteJid,
      fromMe: message.key?.fromMe ?? false,
      pushName: message.pushName ?? null,
      bodyText,
      messageType,
      messageTimestamp: this.resolveTimestampSeconds(message.messageTimestamp)
    };

    return {
      sessionId,
      providerMessageId,
      contactPhone,
      contactName: message.pushName ?? null,
      bodyText,
      messageType,
      direction: "inbound",
      occurredAt,
      rawPayload
    };
  }

  private async handleAgentOutgoingMessage(
    workspaceId: string,
    sessionId: string,
    message: WAMessage
  ): Promise<void> {
    if (!this.salesAssistantService) {
      return;
    }

    const remoteJid = message.key?.remoteJid ?? "";
    const contactPhone = this.normalizePhoneFromJid(remoteJid);
    if (!contactPhone) {
      return;
    }

    const { bodyText } = this.extractMessageData(message.message);
    await this.salesAssistantService.handleAgentMessage({
      workspaceId,
      sessionId,
      contactPhone,
      agentMessage: bodyText,
      providerMessageId: message.key?.id ?? null
    });
  }

  private extractMessageData(message: proto.IMessage | null | undefined): {
    bodyText: string | null;
    messageType: string;
  } {
    const current = this.unwrapMessage(message);
    if (!current) {
      return {
        bodyText: null,
        messageType: "unknown"
      };
    }

    const messageType = Object.keys(current)[0] ?? "unknown";
    const messageData = current as {
      conversation?: string | null;
      extendedTextMessage?: { text?: string | null } | null;
      imageMessage?: { caption?: string | null } | null;
      videoMessage?: { caption?: string | null } | null;
      documentMessage?: { caption?: string | null } | null;
    };
    const bodyText =
      messageData.conversation ??
      messageData.extendedTextMessage?.text ??
      messageData.imageMessage?.caption ??
      messageData.videoMessage?.caption ??
      messageData.documentMessage?.caption ??
      null;

    return {
      bodyText,
      messageType
    };
  }

  private unwrapMessage(
    message: proto.IMessage | null | undefined
  ): proto.IMessage | null {
    if (!message) {
      return null;
    }

    if (message.ephemeralMessage?.message) {
      return this.unwrapMessage(message.ephemeralMessage.message);
    }

    if (message.viewOnceMessage?.message) {
      return this.unwrapMessage(message.viewOnceMessage.message);
    }

    if (message.viewOnceMessageV2?.message) {
      return this.unwrapMessage(message.viewOnceMessageV2.message);
    }

    if (message.viewOnceMessageV2Extension?.message) {
      return this.unwrapMessage(message.viewOnceMessageV2Extension.message);
    }

    return message;
  }

  private resolveTimestampSeconds(value: unknown): number {
    const candidate = value == null ? NaN : Number(value);
    if (Number.isFinite(candidate) && candidate > 0) {
      return candidate;
    }
    return Math.floor(Date.now() / 1000);
  }

  private normalizePhone(rawPhone: string): string | null {
    const digits = rawPhone.replace(/[^\d]/g, "");
    if (!digits) {
      return null;
    }

    return `+${digits}`;
  }

  private normalizePhoneFromJid(remoteJid: string): string | null {
    if (!remoteJid.endsWith("@s.whatsapp.net")) {
      return null;
    }

    const rawPhone = remoteJid.split("@")[0] ?? "";
    return this.normalizePhone(rawPhone);
  }
}
