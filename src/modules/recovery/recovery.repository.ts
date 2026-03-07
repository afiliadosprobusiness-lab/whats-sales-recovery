import { dbPool } from "../../config/database";

export type IdleConversationCandidate = {
  workspaceId: string;
  conversationId: string;
  contactId: string;
  contactPhone: string;
  contactOptOut: boolean;
  status: "open" | "idle" | "closed";
  lastBusinessMessageAt: string;
  lastCustomerMessageAt: string;
};

export type RecoveryAttemptRecord = {
  id: string;
  workspaceId: string;
  conversationId: string;
  contactId: string;
  status: "scheduled" | "sent" | "replied" | "recovered" | "failed";
  scheduledAt: string;
  sentAt: string | null;
  repliedAt: string | null;
  failedReason: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SaleOutcomeRecord = {
  id: string;
  workspaceId: string;
  conversationId: string;
  recoveryAttemptId: string;
  amount: number;
  currency: string;
  createdAt: string;
};

export class RecoveryRepository {
  async findIdleConversationCandidates(
    idleThresholdHours: number,
    limit: number
  ): Promise<IdleConversationCandidate[]> {
    const result = await dbPool.query<IdleConversationCandidate>(
      `
      SELECT
        c.workspace_id AS "workspaceId",
        c.id AS "conversationId",
        c.contact_id AS "contactId",
        ct.phone_e164 AS "contactPhone",
        ct.opt_out AS "contactOptOut",
        c.status,
        c.last_business_message_at AS "lastBusinessMessageAt",
        c.last_customer_message_at AS "lastCustomerMessageAt"
      FROM conversations c
      INNER JOIN contacts ct ON ct.id = c.contact_id
      WHERE c.status = 'open'
        AND c.last_customer_message_at IS NOT NULL
        AND c.last_business_message_at IS NOT NULL
        AND c.last_business_message_at > c.last_customer_message_at
        AND c.last_business_message_at <= (NOW() - ($1::int * INTERVAL '1 hour'))
      ORDER BY c.last_business_message_at ASC
      LIMIT $2
      `,
      [idleThresholdHours, limit]
    );

    return result.rows;
  }

  async markConversationIdle(conversationId: string): Promise<void> {
    await dbPool.query(
      `
      UPDATE conversations
      SET
        status = 'idle',
        idle_at = NOW(),
        updated_at = NOW()
      WHERE id = $1
      `,
      [conversationId]
    );
  }

  async isConversationClosed(conversationId: string): Promise<boolean> {
    const result = await dbPool.query<{ isClosed: boolean }>(
      `
      SELECT (status = 'closed') AS "isClosed"
      FROM conversations
      WHERE id = $1
      LIMIT 1
      `,
      [conversationId]
    );

    return result.rows[0]?.isClosed ?? true;
  }

  async hasRecentRecoveryAttempt(
    conversationId: string,
    lookbackHours: number
  ): Promise<boolean> {
    const result = await dbPool.query<{ hasRecent: boolean }>(
      `
      SELECT EXISTS (
        SELECT 1
        FROM recovery_attempts
        WHERE conversation_id = $1
          AND created_at >= NOW() - ($2::int * INTERVAL '1 hour')
      ) AS "hasRecent"
      `,
      [conversationId, lookbackHours]
    );

    return result.rows[0]?.hasRecent ?? false;
  }

  async isContactOptedOut(contactId: string): Promise<boolean> {
    const result = await dbPool.query<{ optOut: boolean }>(
      `
      SELECT opt_out AS "optOut"
      FROM contacts
      WHERE id = $1
      LIMIT 1
      `,
      [contactId]
    );

    return result.rows[0]?.optOut ?? true;
  }

  async createRecoveryAttempt(input: {
    workspaceId: string;
    conversationId: string;
    contactId: string;
  }): Promise<RecoveryAttemptRecord> {
    const result = await dbPool.query<RecoveryAttemptRecord>(
      `
      INSERT INTO recovery_attempts (
        workspace_id,
        conversation_id,
        contact_id,
        status,
        scheduled_at
      )
      VALUES ($1, $2, $3, 'scheduled', NOW())
      RETURNING
        id,
        workspace_id AS "workspaceId",
        conversation_id AS "conversationId",
        contact_id AS "contactId",
        status,
        scheduled_at AS "scheduledAt",
        sent_at AS "sentAt",
        replied_at AS "repliedAt",
        failed_reason AS "failedReason",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      `,
      [input.workspaceId, input.conversationId, input.contactId]
    );

    return result.rows[0];
  }

  async listScheduledAttempts(limit: number): Promise<RecoveryAttemptRecord[]> {
    const result = await dbPool.query<RecoveryAttemptRecord>(
      `
      SELECT
        id,
        workspace_id AS "workspaceId",
        conversation_id AS "conversationId",
        contact_id AS "contactId",
        status,
        scheduled_at AS "scheduledAt",
        sent_at AS "sentAt",
        replied_at AS "repliedAt",
        failed_reason AS "failedReason",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM recovery_attempts
      WHERE status = 'scheduled'
      ORDER BY scheduled_at ASC
      LIMIT $1
      `,
      [limit]
    );

    return result.rows;
  }

  async getContactPhone(contactId: string): Promise<string | null> {
    const result = await dbPool.query<{ phone: string }>(
      `
      SELECT phone_e164 AS "phone"
      FROM contacts
      WHERE id = $1
      LIMIT 1
      `,
      [contactId]
    );

    return result.rows[0]?.phone ?? null;
  }

  async markRecoveryAttemptSent(recoveryAttemptId: string): Promise<void> {
    await dbPool.query(
      `
      UPDATE recovery_attempts
      SET
        status = 'sent',
        sent_at = NOW(),
        updated_at = NOW()
      WHERE id = $1
      `,
      [recoveryAttemptId]
    );
  }

  async markRecoveryAttemptFailed(
    recoveryAttemptId: string,
    failedReason: string
  ): Promise<void> {
    await dbPool.query(
      `
      UPDATE recovery_attempts
      SET
        status = 'failed',
        failed_reason = $2,
        updated_at = NOW()
      WHERE id = $1
      `,
      [recoveryAttemptId, failedReason]
    );
  }

  async getLatestSentAttemptForConversation(input: {
    workspaceId: string;
    conversationId: string;
  }): Promise<RecoveryAttemptRecord | null> {
    const result = await dbPool.query<RecoveryAttemptRecord>(
      `
      SELECT
        id,
        workspace_id AS "workspaceId",
        conversation_id AS "conversationId",
        contact_id AS "contactId",
        status,
        scheduled_at AS "scheduledAt",
        sent_at AS "sentAt",
        replied_at AS "repliedAt",
        failed_reason AS "failedReason",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM recovery_attempts
      WHERE workspace_id = $1
        AND conversation_id = $2
        AND status = 'sent'
      ORDER BY sent_at DESC NULLS LAST, created_at DESC
      LIMIT 1
      `,
      [input.workspaceId, input.conversationId]
    );

    return result.rows[0] ?? null;
  }

  async markRecoveryAttemptReplied(recoveryAttemptId: string): Promise<void> {
    await dbPool.query(
      `
      UPDATE recovery_attempts
      SET
        status = 'replied',
        replied_at = NOW(),
        updated_at = NOW()
      WHERE id = $1
      `,
      [recoveryAttemptId]
    );
  }

  async getRecoveryAttemptById(
    recoveryAttemptId: string
  ): Promise<RecoveryAttemptRecord | null> {
    const result = await dbPool.query<RecoveryAttemptRecord>(
      `
      SELECT
        id,
        workspace_id AS "workspaceId",
        conversation_id AS "conversationId",
        contact_id AS "contactId",
        status,
        scheduled_at AS "scheduledAt",
        sent_at AS "sentAt",
        replied_at AS "repliedAt",
        failed_reason AS "failedReason",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM recovery_attempts
      WHERE id = $1
      LIMIT 1
      `,
      [recoveryAttemptId]
    );

    return result.rows[0] ?? null;
  }

  async createSaleOutcome(input: {
    workspaceId: string;
    conversationId: string;
    recoveryAttemptId: string;
    amount: number;
    currency: string;
  }): Promise<SaleOutcomeRecord> {
    const result = await dbPool.query<SaleOutcomeRecord>(
      `
      INSERT INTO sale_outcomes (
        workspace_id,
        conversation_id,
        recovery_attempt_id,
        amount,
        currency
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING
        id,
        workspace_id AS "workspaceId",
        conversation_id AS "conversationId",
        recovery_attempt_id AS "recoveryAttemptId",
        amount,
        currency,
        created_at AS "createdAt"
      `,
      [
        input.workspaceId,
        input.conversationId,
        input.recoveryAttemptId,
        input.amount,
        input.currency
      ]
    );

    return result.rows[0];
  }

  async markRecoveryAttemptRecovered(recoveryAttemptId: string): Promise<void> {
    await dbPool.query(
      `
      UPDATE recovery_attempts
      SET
        status = 'recovered',
        updated_at = NOW()
      WHERE id = $1
      `,
      [recoveryAttemptId]
    );
  }

  async closeConversation(conversationId: string): Promise<void> {
    await dbPool.query(
      `
      UPDATE conversations
      SET
        status = 'closed',
        closed_at = NOW(),
        updated_at = NOW()
      WHERE id = $1
      `,
      [conversationId]
    );
  }

  async logDomainEvent(input: {
    workspaceId: string;
    eventName: string;
    aggregateType: string;
    aggregateId: string;
    correlationId?: string;
    payload: Record<string, unknown>;
  }): Promise<void> {
    await dbPool.query(
      `
      INSERT INTO domain_event_logs (
        workspace_id,
        event_name,
        aggregate_type,
        aggregate_id,
        correlation_id,
        payload
      )
      VALUES ($1, $2, $3, $4::uuid, $5::uuid, $6::jsonb)
      `,
      [
        input.workspaceId,
        input.eventName,
        input.aggregateType,
        input.aggregateId,
        input.correlationId ?? null,
        JSON.stringify(input.payload)
      ]
    );
  }
}
