import { type WASocket, type WAMessage, type proto } from "@whiskeysockets/baileys";
import { env } from "../../config/env";
import {
  createMessageReceivedEvent,
  type MessageReceivedPayload
} from "../../events/domain/domain-events";
import { eventBus } from "../../events/event-bus";
import { logger } from "../../utils/logger";
import { type SalesAssistantService } from "../sales-assistant/sales-assistant.service";

const SUPPORTED_UPSERT_TYPES = new Set(["notify", "append"]);

type AttachSessionInput = {
  workspaceId: string;
  sessionId: string;
  socket: WASocket;
};

type NormalizedIncomingMessage = {
  payload: MessageReceivedPayload;
  reason: null;
  details: Record<string, unknown>;
} | {
  payload: null;
  reason:
    | "missing_remote_jid"
    | "group_message"
    | "broadcast_message"
    | "invalid_contact_phone"
    | "missing_provider_message_id";
  details: Record<string, unknown>;
};

export class MessageIngestionService {
  private salesAssistantService: SalesAssistantService | null = null;
  private readonly diagnosticModeEnabled = env.WHATSAPP_INBOUND_DIAGNOSTIC_MODE;

  setSalesAssistantService(service: SalesAssistantService): void {
    this.salesAssistantService = service;
  }

  attachSessionListeners(input: AttachSessionInput): void {
    const { socket, workspaceId, sessionId } = input;

    logger.info(
      { workspaceId, sessionId, eventSource: "messages.upsert" },
      "WhatsApp inbound listener registered"
    );

    socket.ev.on("messages.upsert", (event) => {
      logger.info(
        {
          workspaceId,
          sessionId,
          eventSource: "messages.upsert",
          upsertType: event.type,
          messageCount: event.messages.length
        },
        "inbound event received"
      );

      if (this.diagnosticModeEnabled) {
        logger.info(
          {
            workspaceId,
            sessionId,
            diagnosticMode: true,
            eventSource: "messages.upsert",
            eventShape: this.sanitizeUpsertEvent(event.type, event.messages)
          },
          "WhatsApp inbound diagnostic event"
        );
      }

      if (!SUPPORTED_UPSERT_TYPES.has(event.type)) {
        logger.info(
          {
            workspaceId,
            sessionId,
            eventSource: "messages.upsert",
            reason: "unsupported_upsert_type",
            upsertType: event.type
          },
          "inbound message ignored (and why)"
        );
        return;
      }

      if (event.messages.length === 0) {
        logger.info(
          {
            workspaceId,
            sessionId,
            eventSource: "messages.upsert",
            reason: "empty_event_messages"
          },
          "inbound message ignored (and why)"
        );
        return;
      }

      for (const message of event.messages) {
        if (message.key?.fromMe) {
          logger.info(
            {
              workspaceId,
              sessionId,
              providerMessageId: message.key?.id ?? null,
              reason: "self_message"
            },
            "inbound message ignored (and why)"
          );
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
    if (!normalized.payload) {
      logger.info(
        {
          workspaceId,
          sessionId,
          reason: normalized.reason,
          ...normalized.details
        },
        "inbound message ignored (and why)"
      );
      return;
    }

    logger.info(
      {
        workspaceId,
        sessionId,
        providerMessageId: normalized.payload.providerMessageId,
        contactPhone: normalized.payload.contactPhone,
        messageType: normalized.payload.messageType
      },
      "inbound message parsed"
    );

    eventBus.publish(createMessageReceivedEvent(workspaceId, normalized.payload));

    if (this.salesAssistantService) {
      void this.salesAssistantService.handleIncomingMessage({
        workspaceId,
        sessionId,
        contactPhone: normalized.payload.contactPhone,
        customerMessage: normalized.payload.bodyText,
        providerMessageId: normalized.payload.providerMessageId
      });
    }
  }

  private normalizeIncomingMessage(
    sessionId: string,
    message: WAMessage
  ): NormalizedIncomingMessage {
    const remoteJid = message.key?.remoteJid ?? "";
    if (!remoteJid) {
      return {
        payload: null,
        reason: "missing_remote_jid",
        details: {
          providerMessageId: message.key?.id ?? null
        }
      };
    }

    if (remoteJid.endsWith("@g.us")) {
      return {
        payload: null,
        reason: "group_message",
        details: {
          remoteJid,
          providerMessageId: message.key?.id ?? null
        }
      };
    }

    if (remoteJid.endsWith("@broadcast")) {
      return {
        payload: null,
        reason: "broadcast_message",
        details: {
          remoteJid,
          providerMessageId: message.key?.id ?? null
        }
      };
    }

    const contactPhone = this.normalizePhoneFromJid(remoteJid);
    if (!contactPhone) {
      return {
        payload: null,
        reason: "invalid_contact_phone",
        details: {
          remoteJid,
          providerMessageId: message.key?.id ?? null
        }
      };
    }

    const providerMessageId = message.key?.id ?? "";
    if (!providerMessageId) {
      return {
        payload: null,
        reason: "missing_provider_message_id",
        details: {
          remoteJid,
          contactPhone
        }
      };
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
      payload: {
        sessionId,
        providerMessageId,
        contactPhone,
        contactName: message.pushName ?? null,
        bodyText,
        messageType,
        direction: "inbound",
        occurredAt,
        rawPayload
      },
      reason: null,
      details: {}
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
      buttonsResponseMessage?: { selectedDisplayText?: string | null } | null;
      templateButtonReplyMessage?: { selectedDisplayText?: string | null } | null;
      listResponseMessage?:
        | {
            title?: string | null;
            description?: string | null;
            singleSelectReply?: { selectedRowId?: string | null } | null;
          }
        | null;
      interactiveResponseMessage?:
        | {
            body?: { text?: string | null } | null;
            nativeFlowResponseMessage?: { paramsJson?: string | null } | null;
          }
        | null;
    };

    const bodyText =
      messageData.conversation ??
      messageData.extendedTextMessage?.text ??
      messageData.imageMessage?.caption ??
      messageData.videoMessage?.caption ??
      messageData.documentMessage?.caption ??
      messageData.buttonsResponseMessage?.selectedDisplayText ??
      messageData.templateButtonReplyMessage?.selectedDisplayText ??
      messageData.listResponseMessage?.title ??
      messageData.listResponseMessage?.description ??
      messageData.listResponseMessage?.singleSelectReply?.selectedRowId ??
      messageData.interactiveResponseMessage?.body?.text ??
      messageData.interactiveResponseMessage?.nativeFlowResponseMessage?.paramsJson ??
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
    const rawPhone = remoteJid.split("@")[0] ?? "";
    return this.normalizePhone(rawPhone);
  }

  private sanitizeUpsertEvent(
    upsertType: string,
    messages: WAMessage[]
  ): Record<string, unknown> {
    return {
      type: upsertType,
      messageCount: messages.length,
      messages: messages.slice(0, 10).map((message) => {
        const extracted = this.extractMessageData(message.message);
        return {
          id: message.key?.id ?? null,
          remoteJid: message.key?.remoteJid ?? null,
          participant: message.key?.participant ?? null,
          fromMe: message.key?.fromMe ?? false,
          messageType: extracted.messageType,
          hasBodyText: Boolean(extracted.bodyText?.trim()),
          bodyPreview: this.truncateForLogs(extracted.bodyText),
          messageTimestamp: this.resolveTimestampSeconds(message.messageTimestamp)
        };
      })
    };
  }

  private truncateForLogs(value: string | null | undefined): string | null {
    const text = value?.trim();
    if (!text) {
      return null;
    }
    if (text.length <= 160) {
      return text;
    }
    return `${text.slice(0, 160)}...`;
  }
}
