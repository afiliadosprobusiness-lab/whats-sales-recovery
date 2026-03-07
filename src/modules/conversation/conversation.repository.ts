import { dbPool } from "../../config/database";
import { type MessageDirection } from "../../events/domain/domain-events";

export type ContactRecord = {
  id: string;
  workspaceId: string;
  phoneE164: string;
  displayName: string | null;
};

export type ConversationRecord = {
  id: string;
  workspaceId: string;
  contactId: string;
  contactPhone: string | null;
  whatsappSessionId: string;
  status: "open" | "idle" | "closed";
  lastCustomerMessageAt: string | null;
  lastBusinessMessageAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type RecoverySummaryRecord = {
  id: string;
  status: "scheduled" | "sent" | "replied" | "recovered" | "failed";
  scheduledAt: string;
  sentAt: string | null;
  repliedAt: string | null;
};

export type SaleOutcomeSummaryRecord = {
  id: string;
  amount: number;
  currency: string;
  createdAt: string;
};

export type MessageInsertInput = {
  workspaceId: string;
  conversationId: string;
  providerMessageId: string;
  direction: MessageDirection;
  messageType: string;
  bodyText: string | null;
  providerStatus: string | null;
  occurredAt: string;
  rawPayload: Record<string, unknown>;
};

export class ConversationRepository {
  async upsertContact(
    workspaceId: string,
    phoneE164: string,
    displayName: string | null
  ): Promise<ContactRecord> {
    const result = await dbPool.query<ContactRecord>(
      `
      INSERT INTO contacts (workspace_id, phone_e164, display_name)
      VALUES ($1, $2, $3)
      ON CONFLICT (workspace_id, phone_e164)
      DO UPDATE SET
        display_name = COALESCE(EXCLUDED.display_name, contacts.display_name),
        updated_at = NOW()
      RETURNING
        id,
        workspace_id AS "workspaceId",
        phone_e164 AS "phoneE164",
        display_name AS "displayName"
      `,
      [workspaceId, phoneE164, displayName]
    );

    return result.rows[0];
  }

  async findActiveConversation(
    workspaceId: string,
    contactId: string,
    whatsappSessionId: string
  ): Promise<ConversationRecord | null> {
    const result = await dbPool.query<ConversationRecord>(
      `
      SELECT
        id,
        workspace_id AS "workspaceId",
        contact_id AS "contactId",
        NULL::text AS "contactPhone",
        whatsapp_session_id AS "whatsappSessionId",
        status,
        last_customer_message_at AS "lastCustomerMessageAt",
        last_business_message_at AS "lastBusinessMessageAt",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM conversations
      WHERE workspace_id = $1
        AND contact_id = $2
        AND whatsapp_session_id = $3
        AND status IN ('open', 'idle')
      ORDER BY updated_at DESC
      LIMIT 1
      `,
      [workspaceId, contactId, whatsappSessionId]
    );

    return result.rows[0] ?? null;
  }

  async createConversation(
    workspaceId: string,
    contactId: string,
    whatsappSessionId: string
  ): Promise<ConversationRecord> {
    const result = await dbPool.query<ConversationRecord>(
      `
      INSERT INTO conversations (workspace_id, contact_id, whatsapp_session_id, status)
      VALUES ($1, $2, $3, 'open')
      RETURNING
        id,
        workspace_id AS "workspaceId",
        contact_id AS "contactId",
        NULL::text AS "contactPhone",
        whatsapp_session_id AS "whatsappSessionId",
        status,
        last_customer_message_at AS "lastCustomerMessageAt",
        last_business_message_at AS "lastBusinessMessageAt",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      `,
      [workspaceId, contactId, whatsappSessionId]
    );

    return result.rows[0];
  }

  async insertMessage(input: MessageInsertInput): Promise<boolean> {
    const result = await dbPool.query(
      `
      INSERT INTO messages (
        workspace_id,
        conversation_id,
        provider_message_id,
        direction,
        message_type,
        body_text,
        provider_status,
        sent_at,
        received_at,
        raw_payload
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7,
        CASE WHEN $4 = 'outbound' THEN $8::timestamptz ELSE NULL END,
        CASE WHEN $4 = 'inbound' THEN $8::timestamptz ELSE NULL END,
        $9::jsonb
      )
      ON CONFLICT (provider_message_id) DO NOTHING
      RETURNING id
      `,
      [
        input.workspaceId,
        input.conversationId,
        input.providerMessageId,
        input.direction,
        input.messageType,
        input.bodyText,
        input.providerStatus,
        input.occurredAt,
        JSON.stringify(input.rawPayload)
      ]
    );

    return (result.rowCount ?? 0) > 0;
  }

  async updateConversationActivity(
    conversationId: string,
    direction: MessageDirection,
    occurredAt: string
  ): Promise<void> {
    if (direction === "inbound") {
      await dbPool.query(
        `
        UPDATE conversations
        SET
          status = 'open',
          last_customer_message_at = $2::timestamptz,
          updated_at = NOW()
        WHERE id = $1
        `,
        [conversationId, occurredAt]
      );
      return;
    }

    await dbPool.query(
      `
      UPDATE conversations
      SET
        status = 'open',
        last_business_message_at = $2::timestamptz,
        updated_at = NOW()
      WHERE id = $1
      `,
      [conversationId, occurredAt]
    );
  }

  async logDomainEvent(
    workspaceId: string,
    eventName: string,
    aggregateType: string,
    aggregateId: string,
    payload: Record<string, unknown>
  ): Promise<void> {
    await dbPool.query(
      `
      INSERT INTO domain_event_logs (
        workspace_id,
        event_name,
        aggregate_type,
        aggregate_id,
        payload
      )
      VALUES ($1, $2, $3, $4::uuid, $5::jsonb)
      `,
      [workspaceId, eventName, aggregateType, aggregateId, JSON.stringify(payload)]
    );
  }

  async listConversations(
    workspaceId: string,
    status: "open" | "idle" | "closed" | null,
    limit: number,
    offset: number
  ): Promise<ConversationRecord[]> {
    const params: Array<string | number> = [workspaceId];
    const statusFilter =
      status === null ? "" : `AND c.status = $${params.push(status)}`;
    const limitRef = `$${params.push(limit)}`;
    const offsetRef = `$${params.push(offset)}`;

    const result = await dbPool.query<ConversationRecord>(
      `
      SELECT
        c.id,
        c.workspace_id AS "workspaceId",
        c.contact_id AS "contactId",
        ct.phone_e164 AS "contactPhone",
        c.whatsapp_session_id AS "whatsappSessionId",
        c.status,
        c.last_customer_message_at AS "lastCustomerMessageAt",
        c.last_business_message_at AS "lastBusinessMessageAt",
        c.created_at AS "createdAt",
        c.updated_at AS "updatedAt"
      FROM conversations c
      INNER JOIN contacts ct ON ct.id = c.contact_id
      WHERE c.workspace_id = $1
      ${statusFilter}
      ORDER BY c.updated_at DESC
      LIMIT ${limitRef}
      OFFSET ${offsetRef}
      `,
      params
    );

    return result.rows;
  }

  async getConversationById(
    workspaceId: string,
    conversationId: string
  ): Promise<ConversationRecord | null> {
    const result = await dbPool.query<ConversationRecord>(
      `
      SELECT
        c.id,
        c.workspace_id AS "workspaceId",
        c.contact_id AS "contactId",
        ct.phone_e164 AS "contactPhone",
        c.whatsapp_session_id AS "whatsappSessionId",
        c.status,
        c.last_customer_message_at AS "lastCustomerMessageAt",
        c.last_business_message_at AS "lastBusinessMessageAt",
        c.created_at AS "createdAt",
        c.updated_at AS "updatedAt"
      FROM conversations c
      INNER JOIN contacts ct ON ct.id = c.contact_id
      WHERE c.workspace_id = $1 AND c.id = $2
      LIMIT 1
      `,
      [workspaceId, conversationId]
    );

    return result.rows[0] ?? null;
  }

  async listMessagesForConversation(
    workspaceId: string,
    conversationId: string,
    limit: number
  ): Promise<
    Array<{
      id: string;
      providerMessageId: string;
      direction: MessageDirection;
      messageType: string;
      bodyText: string | null;
      sentAt: string | null;
      receivedAt: string | null;
      createdAt: string;
    }>
  > {
    const result = await dbPool.query<{
      id: string;
      providerMessageId: string;
      direction: MessageDirection;
      messageType: string;
      bodyText: string | null;
      sentAt: string | null;
      receivedAt: string | null;
      createdAt: string;
    }>(
      `
      SELECT
        id,
        provider_message_id AS "providerMessageId",
        direction,
        message_type AS "messageType",
        body_text AS "bodyText",
        sent_at AS "sentAt",
        received_at AS "receivedAt",
        created_at AS "createdAt"
      FROM messages
      WHERE workspace_id = $1
        AND conversation_id = $2
      ORDER BY created_at DESC
      LIMIT $3
      `,
      [workspaceId, conversationId, limit]
    );

    return result.rows.reverse();
  }

  async getLatestRecoveryForConversation(
    workspaceId: string,
    conversationId: string
  ): Promise<RecoverySummaryRecord | null> {
    const result = await dbPool.query<RecoverySummaryRecord>(
      `
      SELECT
        id,
        status,
        scheduled_at AS "scheduledAt",
        sent_at AS "sentAt",
        replied_at AS "repliedAt"
      FROM recovery_attempts
      WHERE workspace_id = $1
        AND conversation_id = $2
      ORDER BY created_at DESC
      LIMIT 1
      `,
      [workspaceId, conversationId]
    );

    return result.rows[0] ?? null;
  }

  async getLatestSaleOutcomeForConversation(
    workspaceId: string,
    conversationId: string
  ): Promise<SaleOutcomeSummaryRecord | null> {
    const result = await dbPool.query<SaleOutcomeSummaryRecord>(
      `
      SELECT
        id,
        amount,
        currency,
        created_at AS "createdAt"
      FROM sale_outcomes
      WHERE workspace_id = $1
        AND conversation_id = $2
      ORDER BY created_at DESC
      LIMIT 1
      `,
      [workspaceId, conversationId]
    );

    return result.rows[0] ?? null;
  }
}
