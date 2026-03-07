import { Client, LocalAuth, type ClientOptions } from "whatsapp-web.js";
import { env } from "../../config/env";
import { logger } from "../../utils/logger";
import { MessageIngestionService } from "../message-ingestion/message-ingestion.service";
import {
  type WorkspaceRecord,
  type SessionStatus,
  WhatsAppSessionRepository,
  type WhatsAppSessionRecord
} from "./whatsapp-session.repository";

export class WhatsAppSessionManager {
  private readonly clientsBySessionId = new Map<string, Client>();
  private readonly manualDisconnect = new Set<string>();

  constructor(
    private readonly repository: WhatsAppSessionRepository,
    private readonly ingestionService: MessageIngestionService
  ) {}

  async restoreSessions(): Promise<void> {
    const sessions = await this.repository.listForReconnect();
    for (const session of sessions) {
      await this.initializeClient(session);
    }
  }

  async createWorkspace(name: string): Promise<WorkspaceRecord> {
    return this.repository.createWorkspace(name);
  }

  async startSession(workspaceId: string): Promise<WhatsAppSessionRecord> {
    await this.repository.upsertWorkspace(workspaceId);

    const existing = await this.repository.findByWorkspaceId(workspaceId);
    const session = existing ?? (await this.repository.create(workspaceId));

    if (!this.clientsBySessionId.has(session.id)) {
      await this.initializeClient(session);
    }

    const latest = await this.repository.findById(session.id);
    if (!latest) {
      throw new Error("Session was not found after startup");
    }

    return latest;
  }

  async startSessionAndGetQr(workspaceId: string): Promise<string | null> {
    const session = await this.startSession(workspaceId);
    return this.waitForSessionQr(session.id);
  }

  async disconnectSession(sessionId: string): Promise<WhatsAppSessionRecord | null> {
    const client = this.clientsBySessionId.get(sessionId);
    this.manualDisconnect.add(sessionId);

    if (client) {
      await client.destroy();
      this.clientsBySessionId.delete(sessionId);
    }

    await this.repository.setStatus(sessionId, "disconnected");
    return this.repository.findById(sessionId);
  }

  async getSessionStatus(sessionId: string): Promise<SessionStatus | null> {
    const session = await this.repository.findById(sessionId);
    return session?.status ?? null;
  }

  async getSessionQr(sessionId: string): Promise<string | null> {
    const session = await this.repository.findById(sessionId);
    return session?.qrCode ?? null;
  }

  async isWorkspaceConnected(workspaceId: string): Promise<boolean> {
    const session = await this.repository.findByWorkspaceId(workspaceId);
    return session?.status === "connected";
  }

  async sendMessage(input: {
    workspaceId: string;
    contactPhone: string;
    text: string;
  }): Promise<{ providerMessageId: string | null }> {
    const session = await this.repository.findByWorkspaceId(input.workspaceId);
    if (!session) {
      throw new Error("WhatsApp session not found for workspace");
    }

    let client = this.clientsBySessionId.get(session.id);
    if (!client) {
      await this.initializeClient(session);
      client = this.clientsBySessionId.get(session.id);
    }

    if (!client) {
      throw new Error("WhatsApp client is not initialized");
    }

    const chatId = this.phoneToChatId(input.contactPhone);
    const sentMessage = await client.sendMessage(chatId, input.text);
    await this.repository.touchLastSeen(session.id);

    return {
      providerMessageId: sentMessage.id?._serialized ?? null
    };
  }

  private async initializeClient(session: WhatsAppSessionRecord): Promise<void> {
    const existingClient = this.clientsBySessionId.get(session.id);
    if (existingClient) {
      return;
    }

    const options: ClientOptions = {
      authStrategy: new LocalAuth({
        clientId: session.id,
        dataPath: env.WHATSAPP_SESSION_DATA_PATH
      }),
      puppeteer: {
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"]
      }
    };

    const client = new Client(options);
    this.clientsBySessionId.set(session.id, client);

    this.attachClientLifecycle({
      client,
      sessionId: session.id,
      workspaceId: session.workspaceId
    });

    this.ingestionService.attachSessionListeners({
      client,
      sessionId: session.id,
      workspaceId: session.workspaceId
    });

    await client.initialize();
  }

  private attachClientLifecycle(input: {
    client: Client;
    sessionId: string;
    workspaceId: string;
  }): void {
    const { client, sessionId, workspaceId } = input;

    client.on("qr", (qr) => {
      void this.repository.setQr(sessionId, qr);
      logger.info({ workspaceId, sessionId }, "WhatsApp QR generated");
    });

    client.on("ready", () => {
      void this.repository.setStatus(sessionId, "connected");
      void this.repository.touchLastSeen(sessionId);
      logger.info({ workspaceId, sessionId }, "WhatsApp session ready");
    });

    client.on("authenticated", () => {
      void this.repository.setStatus(sessionId, "connected");
      void this.repository.touchLastSeen(sessionId);
      logger.info({ workspaceId, sessionId }, "WhatsApp session authenticated");
    });

    client.on("disconnected", (reason) => {
      this.clientsBySessionId.delete(sessionId);
      void this.repository.setStatus(sessionId, "disconnected");
      logger.warn({ workspaceId, sessionId, reason }, "WhatsApp session disconnected");

      if (this.manualDisconnect.has(sessionId)) {
        this.manualDisconnect.delete(sessionId);
        return;
      }

      setTimeout(() => {
        void this.reconnectSession(sessionId, workspaceId);
      }, 3000);
    });
  }

  private async reconnectSession(
    sessionId: string,
    workspaceId: string
  ): Promise<void> {
    const session = await this.repository.findById(sessionId);
    if (!session) {
      return;
    }

    if (this.clientsBySessionId.has(sessionId)) {
      return;
    }

    logger.info({ workspaceId, sessionId }, "Attempting WhatsApp session reconnect");
    await this.initializeClient(session);
  }

  private async waitForSessionQr(
    sessionId: string,
    timeoutMs = 15000,
    intervalMs = 500
  ): Promise<string | null> {
    const startedAt = Date.now();

    while (Date.now() - startedAt < timeoutMs) {
      const session = await this.repository.findById(sessionId);
      if (!session) {
        return null;
      }

      if (session.qrCode) {
        return session.qrCode;
      }

      if (session.status === "connected") {
        return null;
      }

      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }

    const latest = await this.repository.findById(sessionId);
    return latest?.qrCode ?? null;
  }

  private phoneToChatId(contactPhone: string): string {
    const digits = contactPhone.replace(/[^\d]/g, "");
    if (!digits) {
      throw new Error("Invalid contact phone for WhatsApp send");
    }
    return `${digits}@c.us`;
  }
}
