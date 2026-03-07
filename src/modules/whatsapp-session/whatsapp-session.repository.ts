import { dbPool } from "../../config/database";

export type SessionStatus = "pending_qr" | "connected" | "disconnected";

export type WhatsAppSessionRecord = {
  id: string;
  workspaceId: string;
  status: SessionStatus;
  qrCode: string | null;
  lastSeenAt: Date | null;
};

export type WorkspaceRecord = {
  id: string;
  name: string;
  timezone: string;
};

const sessionSelect = `
  SELECT
    id,
    workspace_id AS "workspaceId",
    status,
    qr_code AS "qrCode",
    last_seen_at AS "lastSeenAt"
  FROM whatsapp_sessions
`;

export class WhatsAppSessionRepository {
  async createWorkspace(name: string): Promise<WorkspaceRecord> {
    const result = await dbPool.query<WorkspaceRecord>(
      `
      INSERT INTO workspaces (name, timezone)
      VALUES ($1, 'UTC')
      RETURNING
        id,
        name,
        timezone
      `,
      [name]
    );

    return result.rows[0];
  }

  async upsertWorkspace(workspaceId: string): Promise<void> {
    await dbPool.query(
      `
      INSERT INTO workspaces (id, name, timezone)
      VALUES ($1, $2, 'UTC')
      ON CONFLICT (id) DO NOTHING
      `,
      [workspaceId, `Workspace ${workspaceId.slice(0, 8)}`]
    );
  }

  async findByWorkspaceId(
    workspaceId: string
  ): Promise<WhatsAppSessionRecord | null> {
    const result = await dbPool.query<WhatsAppSessionRecord>(
      `${sessionSelect} WHERE workspace_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [workspaceId]
    );

    return result.rows[0] ?? null;
  }

  async findById(sessionId: string): Promise<WhatsAppSessionRecord | null> {
    const result = await dbPool.query<WhatsAppSessionRecord>(
      `${sessionSelect} WHERE id = $1 LIMIT 1`,
      [sessionId]
    );

    return result.rows[0] ?? null;
  }

  async listForReconnect(): Promise<WhatsAppSessionRecord[]> {
    const result = await dbPool.query<WhatsAppSessionRecord>(
      `
      ${sessionSelect}
      WHERE status IN ('connected', 'pending_qr')
      ORDER BY created_at ASC
      `
    );

    return result.rows;
  }

  async create(workspaceId: string): Promise<WhatsAppSessionRecord> {
    const result = await dbPool.query<WhatsAppSessionRecord>(
      `
      INSERT INTO whatsapp_sessions (workspace_id, status)
      VALUES ($1, 'pending_qr')
      RETURNING
        id,
        workspace_id AS "workspaceId",
        status,
        qr_code AS "qrCode",
        last_seen_at AS "lastSeenAt"
      `,
      [workspaceId]
    );

    return result.rows[0];
  }

  async setQr(sessionId: string, qr: string): Promise<void> {
    await dbPool.query(
      `
      UPDATE whatsapp_sessions
      SET
        qr_code = $2,
        status = 'pending_qr',
        updated_at = NOW()
      WHERE id = $1
      `,
      [sessionId, qr]
    );
  }

  async setStatus(sessionId: string, status: SessionStatus): Promise<void> {
    await dbPool.query(
      `
      UPDATE whatsapp_sessions
      SET
        status = $2,
        qr_code = CASE WHEN $2 = 'connected' THEN NULL ELSE qr_code END,
        updated_at = NOW()
      WHERE id = $1
      `,
      [sessionId, status]
    );
  }

  async touchLastSeen(sessionId: string): Promise<void> {
    await dbPool.query(
      `
      UPDATE whatsapp_sessions
      SET
        last_seen_at = NOW(),
        updated_at = NOW()
      WHERE id = $1
      `,
      [sessionId]
    );
  }
}
