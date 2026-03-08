import makeWASocket, {
  DisconnectReason,
  fetchLatestBaileysVersion,
  useMultiFileAuthState,
  type ConnectionState,
  type WASocket
} from "@whiskeysockets/baileys";
import fs from "fs";
import path from "path";
import pino from "pino";
import { env } from "../../config/env";
import { logger } from "../../utils/logger";
import { MessageIngestionService } from "../message-ingestion/message-ingestion.service";
import {
  type WorkspaceRecord,
  type SessionStatus,
  WhatsAppSessionRepository,
  type WhatsAppSessionRecord
} from "./whatsapp-session.repository";

const baileysLogger = pino({ level: "silent" });

export class WhatsAppSessionManager {
  private readonly sessionsByWorkspaceId = new Map<string, WASocket>();
  private readonly manualDisconnectWorkspaces = new Set<string>();
  private readonly reconnectingWorkspaces = new Set<string>();

  constructor(
    private readonly repository: WhatsAppSessionRepository,
    private readonly ingestionService: MessageIngestionService
  ) {}

  async restoreSessions(): Promise<void> {
    const sessionsRootPath = this.resolveSessionsRootPath();
    const reconnectableSessions = await this.repository.listForReconnect();
    if (reconnectableSessions.length === 0) {
      logger.info(
        { sessionsRootPath },
        "No WhatsApp sessions found to restore"
      );
      return;
    }

    for (const session of reconnectableSessions) {
      logger.info(
        {
          workspaceId: session.workspaceId,
          sessionId: session.id,
          status: session.status
        },
        "Restoring WhatsApp session for workspace"
      );
      try {
        await this.startSession(session.workspaceId, { isStartupRestore: true });
      } catch (error) {
        logger.error(
          { workspaceId: session.workspaceId, sessionId: session.id, error },
          "Failed restoring WhatsApp session"
        );
      }
    }
  }

  async createWorkspace(name: string): Promise<WorkspaceRecord> {
    return this.repository.createWorkspace(name);
  }

  async startSession(
    workspaceId: string,
    options: { isStartupRestore?: boolean } = {}
  ): Promise<WhatsAppSessionRecord> {
    await this.repository.upsertWorkspace(workspaceId);

    const existing = await this.repository.findByWorkspaceId(workspaceId);
    const session = existing ?? (await this.repository.create(workspaceId));

    if (this.sessionsByWorkspaceId.has(session.workspaceId)) {
      logger.info(
        { workspaceId: session.workspaceId, sessionId: session.id },
        "WhatsApp session initialized"
      );
      const latest = await this.repository.findById(session.id);
      if (!latest) {
        throw new Error("Session was not found after startup");
      }
      return latest;
    }

    await this.initializeSession(session, options);

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
    const session = await this.repository.findById(sessionId);
    if (!session) {
      return null;
    }

    const socket = this.sessionsByWorkspaceId.get(session.workspaceId);
    if (socket) {
      try {
        this.manualDisconnectWorkspaces.add(session.workspaceId);
        socket.end(new Error("Manual disconnect"));
      } finally {
        this.manualDisconnectWorkspaces.delete(session.workspaceId);
        this.sessionsByWorkspaceId.delete(session.workspaceId);
      }
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
    if (!session || session.status !== "connected") {
      return false;
    }

    const hasSocket = this.sessionsByWorkspaceId.has(workspaceId);
    if (!hasSocket) {
      logger.warn(
        { workspaceId, sessionId: session.id },
        "Session marked connected but no active socket found in memory"
      );
      void this.reconnectSession(workspaceId);
      return false;
    }

    return true;
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

    let socket = this.sessionsByWorkspaceId.get(session.workspaceId);
    if (!socket) {
      await this.initializeSession(session);
      socket = this.sessionsByWorkspaceId.get(session.workspaceId);
    }

    if (!socket) {
      throw new Error("WhatsApp socket is not initialized");
    }

    const chatId = this.phoneToChatId(input.contactPhone);
    const sentMessage = await socket.sendMessage(chatId, { text: input.text });
    await this.repository.touchLastSeen(session.id);

    return {
      providerMessageId: sentMessage?.key?.id ?? null
    };
  }

  private async initializeSession(
    session: WhatsAppSessionRecord,
    options: { isStartupRestore?: boolean } = {}
  ): Promise<void> {
    const existingSocket = this.sessionsByWorkspaceId.get(session.workspaceId);
    if (existingSocket) {
      return;
    }

    const sessionDataPath = this.resolveSessionDataPath(session.workspaceId);
    const { state, saveCreds } = await useMultiFileAuthState(sessionDataPath);
    const { version, isLatest } = await fetchLatestBaileysVersion();
    logger.info(
      { workspaceId: session.workspaceId, sessionId: session.id, version, isLatest },
      "Resolved Baileys WhatsApp Web version"
    );

    const socket = makeWASocket({
      version,
      auth: state,
      printQRInTerminal: false,
      browser: ["RecuperaVentas", "Chrome", "1.0"],
      syncFullHistory: false,
      logger: baileysLogger
    });

    this.sessionsByWorkspaceId.set(session.workspaceId, socket);
    logger.info(
      {
        workspaceId: session.workspaceId,
        sessionId: session.id,
        sessionDataPath
      },
      "WhatsApp session initialized"
    );

    this.attachSessionLifecycle({
      socket,
      sessionId: session.id,
      workspaceId: session.workspaceId,
      saveCreds,
      isStartupRestore: options.isStartupRestore ?? false
    });

    this.ingestionService.attachSessionListeners({
      socket,
      sessionId: session.id,
      workspaceId: session.workspaceId
    });
  }

  private attachSessionLifecycle(input: {
    socket: WASocket;
    sessionId: string;
    workspaceId: string;
    saveCreds: () => Promise<void>;
    isStartupRestore: boolean;
  }): void {
    const { socket, sessionId, workspaceId, saveCreds, isStartupRestore } = input;
    let authenticatedLogged = false;

    socket.ev.on("creds.update", saveCreds);
    socket.ev.on("creds.update", () => {
      if (!authenticatedLogged) {
        authenticatedLogged = true;
        logger.info({ workspaceId, sessionId }, "WhatsApp authenticated");
      }
    });

    socket.ev.on("connection.update", (update: Partial<ConnectionState>) => {
      const { connection, qr, lastDisconnect } = update;

      if (qr) {
        void this.repository.setQr(sessionId, qr);
        logger.info(
          { workspaceId, sessionId, qrLength: qr.length },
          "WhatsApp QR generated"
        );
      }

      if (connection === "open") {
        if (isStartupRestore) {
          logger.info(
            { workspaceId, sessionId },
            "WhatsApp session restored successfully"
          );
        }
        logger.info({ workspaceId, sessionId }, "WhatsApp session connected");
        void this.repository.setStatus(sessionId, "connected");
        void this.repository.touchLastSeen(sessionId);
        return;
      }

      if (connection !== "close") {
        return;
      }

      this.sessionsByWorkspaceId.delete(workspaceId);
      void this.repository.setStatus(sessionId, "disconnected");

      if (this.manualDisconnectWorkspaces.has(workspaceId)) {
        this.manualDisconnectWorkspaces.delete(workspaceId);
        logger.info({ workspaceId, sessionId }, "WhatsApp session disconnected");
        return;
      }

      const statusCode = this.extractDisconnectStatusCode(lastDisconnect);
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
      logger.warn(
        {
          workspaceId,
          sessionId,
          reason: this.extractDisconnectReason(lastDisconnect),
          statusCode,
          shouldReconnect
        },
        "WhatsApp session disconnected"
      );

      if (shouldReconnect) {
        void this.reconnectSession(workspaceId);
      }
    });
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
    return `${digits}@s.whatsapp.net`;
  }

  private resolveSessionDataPath(workspaceId: string): string {
    const sessionsRootPath = this.resolveSessionsRootPath();
    const preferredPath = path.join(sessionsRootPath, workspaceId);
    const legacyPath = path.resolve("sessions", workspaceId);

    if (!fs.existsSync(preferredPath) && fs.existsSync(legacyPath)) {
      logger.warn(
        { workspaceId, legacyPath, preferredPath },
        "Using legacy WhatsApp session path"
      );
      fs.mkdirSync(legacyPath, { recursive: true });
      return legacyPath;
    }

    fs.mkdirSync(preferredPath, { recursive: true });
    return preferredPath;
  }

  private resolveSessionsRootPath(): string {
    const configuredRoot = env.WHATSAPP_SESSION_DATA_PATH.trim();
    const absoluteRoot = path.isAbsolute(configuredRoot)
      ? configuredRoot
      : path.resolve(configuredRoot);
    fs.mkdirSync(absoluteRoot, { recursive: true });
    return absoluteRoot;
  }

  private extractDisconnectReason(
    lastDisconnect: ConnectionState["lastDisconnect"] | undefined
  ): string {
    const error = lastDisconnect?.error;
    if (!error) {
      return "unknown";
    }
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === "object" && error !== null && "message" in error) {
      return String((error as { message: unknown }).message);
    }
    return String(error);
  }

  private extractDisconnectStatusCode(
    lastDisconnect: ConnectionState["lastDisconnect"] | undefined
  ): number | null {
    const error = lastDisconnect?.error as
      | { output?: { statusCode?: number } }
      | undefined;
    const statusCode = error?.output?.statusCode;
    return typeof statusCode === "number" ? statusCode : null;
  }

  private async reconnectSession(workspaceId: string): Promise<void> {
    if (this.sessionsByWorkspaceId.has(workspaceId)) {
      return;
    }
    if (this.reconnectingWorkspaces.has(workspaceId)) {
      return;
    }

    this.reconnectingWorkspaces.add(workspaceId);
    try {
      await this.startSession(workspaceId);
    } catch (error) {
      logger.error(
        { workspaceId, error },
        "Failed to reconnect WhatsApp session"
      );
    } finally {
      this.reconnectingWorkspaces.delete(workspaceId);
    }
  }
}
