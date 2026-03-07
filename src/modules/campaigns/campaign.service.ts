import { env } from "../../config/env";
import {
  domainEvents,
  type MessageReceivedEvent
} from "../../events/domain/domain-events";
import { eventBus } from "../../events/event-bus";
import { logger } from "../../utils/logger";
import { WhatsAppSessionManager } from "../whatsapp-session/whatsapp-session.manager";
import {
  CampaignRepository,
  type CampaignImportResult,
  type CampaignMetrics
} from "./campaign.repository";

const DEFAULT_CAMPAIGN_MESSAGE = `Hola ðŸ‘‹
Ayer preguntaste por el producto.

Â¿Te ayudo a terminar tu pedido?`;

const SEND_DELAY_MIN_MS = 5000;
const SEND_DELAY_MAX_MS = 10000;

export class CampaignValidationError extends Error {}

export class CampaignService {
  private handlersRegistered = false;

  constructor(
    private readonly repository: CampaignRepository,
    private readonly whatsappSessionManager: WhatsAppSessionManager
  ) {}

  registerEventHandlers(): void {
    if (this.handlersRegistered) {
      return;
    }

    this.handlersRegistered = true;
    eventBus.subscribe<MessageReceivedEvent>(
      domainEvents.MESSAGE_RECEIVED,
      async (event) => {
        await this.handleInboundReply(event);
      }
    );
  }

  async importCampaignFromCsv(input: {
    workspaceId: string;
    csv: string;
    campaignName?: string;
  }): Promise<CampaignImportResult> {
    const parsedContacts = this.parseCsv(input.csv);
    if (parsedContacts.length === 0) {
      throw new CampaignValidationError("CSV does not contain valid contacts");
    }

    const campaignName =
      input.campaignName?.trim() || `Campaign ${new Date().toISOString()}`;
    const messageText =
      env.RECOVERY_TEMPLATE_TEXT?.trim() || DEFAULT_CAMPAIGN_MESSAGE;

    return this.repository.createCampaignWithContacts({
      workspaceId: input.workspaceId,
      campaignName,
      messageText,
      contacts: parsedContacts
    });
  }

  async processNextScheduledMessage(): Promise<{
    processed: boolean;
    sent: boolean;
    failed: boolean;
    campaignId: string | null;
  }> {
    const next = await this.repository.claimNextScheduledMessage();
    if (!next) {
      return {
        processed: false,
        sent: false,
        failed: false,
        campaignId: null
      };
    }

    try {
      const sendResult = await this.whatsappSessionManager.sendMessage({
        workspaceId: next.workspaceId,
        contactPhone: next.contactPhone,
        text: next.messageText
      });

      await this.repository.markMessageSent({
        messageId: next.messageId,
        campaignId: next.campaignId,
        campaignContactId: next.campaignContactId,
        providerMessageId: sendResult.providerMessageId
      });

      logger.info(
        {
          campaignId: next.campaignId,
          campaignContactId: next.campaignContactId,
          providerMessageId: sendResult.providerMessageId
        },
        "Campaign message sent"
      );

      return {
        processed: true,
        sent: true,
        failed: false,
        campaignId: next.campaignId
      };
    } catch (error) {
      const failedReason =
        error instanceof Error ? error.message : "Unknown send error";

      await this.repository.markMessageFailed({
        messageId: next.messageId,
        campaignId: next.campaignId,
        campaignContactId: next.campaignContactId,
        failedReason
      });

      logger.warn(
        {
          campaignId: next.campaignId,
          campaignContactId: next.campaignContactId,
          failedReason
        },
        "Campaign message failed"
      );

      return {
        processed: true,
        sent: false,
        failed: true,
        campaignId: next.campaignId
      };
    }
  }

  getNextSendDelayMs(): number {
    return (
      SEND_DELAY_MIN_MS +
      Math.floor(Math.random() * (SEND_DELAY_MAX_MS - SEND_DELAY_MIN_MS + 1))
    );
  }

  async getCampaignMetrics(input: {
    workspaceId: string;
    campaignId: string;
  }): Promise<CampaignMetrics | null> {
    return this.repository.getCampaignMetrics(input);
  }

  private async handleInboundReply(event: MessageReceivedEvent): Promise<void> {
    const contactPhone = event.payload.contactPhone;
    if (!contactPhone) {
      return;
    }

    const marked = await this.repository.markContactRepliedByPhone({
      workspaceId: event.workspaceId,
      phoneE164: contactPhone
    });

    if (!marked) {
      return;
    }

    logger.info(
      {
        workspaceId: event.workspaceId,
        campaignId: marked.campaignId,
        campaignContactId: marked.campaignContactId,
        providerMessageId: event.payload.providerMessageId
      },
      "Campaign contact marked as replied"
    );
  }

  private parseCsv(
    csvContent: string
  ): Array<{ name: string | null; phoneE164: string }> {
    const normalizedCsv = csvContent.replace(/^\uFEFF/, "").trim();
    if (!normalizedCsv) {
      throw new CampaignValidationError("CSV payload is empty");
    }

    const lines = normalizedCsv
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (lines.length < 2) {
      throw new CampaignValidationError(
        "CSV must include header plus at least one contact row"
      );
    }

    const headers = this.parseCsvLine(lines[0]).map((value) =>
      value.trim().toLowerCase()
    );
    const nameIndex = headers.indexOf("name");
    const phoneIndex = headers.indexOf("phone");

    if (nameIndex === -1 || phoneIndex === -1) {
      throw new CampaignValidationError(
        "CSV header must include exactly 'name' and 'phone' columns"
      );
    }

    const dedupByPhone = new Set<string>();
    const parsedRows: Array<{ name: string | null; phoneE164: string }> = [];

    for (let index = 1; index < lines.length; index += 1) {
      const rowNumber = index + 1;
      const fields = this.parseCsvLine(lines[index]);
      const rawName = (fields[nameIndex] ?? "").trim();
      const rawPhone = (fields[phoneIndex] ?? "").trim();

      if (!rawName && !rawPhone) {
        continue;
      }

      const phoneE164 = this.normalizePhone(rawPhone, rowNumber);
      if (dedupByPhone.has(phoneE164)) {
        continue;
      }

      dedupByPhone.add(phoneE164);
      parsedRows.push({
        name: rawName || null,
        phoneE164
      });
    }

    if (parsedRows.length === 0) {
      throw new CampaignValidationError("CSV has no valid rows after normalization");
    }

    return parsedRows;
  }

  private parseCsvLine(line: string): string[] {
    const values: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let index = 0; index < line.length; index += 1) {
      const char = line[index];

      if (char === '"') {
        const nextChar = line[index + 1];
        if (inQuotes && nextChar === '"') {
          current += '"';
          index += 1;
          continue;
        }

        inQuotes = !inQuotes;
        continue;
      }

      if (char === "," && !inQuotes) {
        values.push(current);
        current = "";
        continue;
      }

      current += char;
    }

    if (inQuotes) {
      throw new CampaignValidationError("CSV contains unclosed quoted value");
    }

    values.push(current);
    return values;
  }

  private normalizePhone(rawPhone: string, rowNumber: number): string {
    const digits = rawPhone.replace(/[^\d]/g, "");
    if (!digits) {
      throw new CampaignValidationError(
        `Invalid or empty phone value at row ${rowNumber}`
      );
    }

    return `+${digits}`;
  }
}
