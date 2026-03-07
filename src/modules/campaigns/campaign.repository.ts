import { dbPool } from "../../config/database";
import { type PoolClient } from "pg";

export type CampaignStatus = "queued" | "running" | "completed" | "failed";
export type CampaignContactStatus =
  | "pending"
  | "sent"
  | "failed"
  | "replied"
  | "recovered";
export type CampaignMessageStatus =
  | "scheduled"
  | "processing"
  | "sent"
  | "failed"
  | "replied";

export type CampaignImportContactInput = {
  name: string | null;
  phoneE164: string;
};

export type CampaignImportResult = {
  campaignId: string;
  workspaceId: string;
  name: string;
  status: CampaignStatus;
  contactsTotal: number;
  messagesScheduled: number;
};

export type QueuedCampaignMessage = {
  messageId: string;
  campaignId: string;
  campaignContactId: string;
  workspaceId: string;
  contactPhone: string;
  messageText: string;
};

export type CampaignMetrics = {
  campaignId: string;
  contactsTotal: number;
  messagesSent: number;
  replies: number;
  recoveredSales: number;
};

export class CampaignRepository {
  async createCampaignWithContacts(input: {
    workspaceId: string;
    campaignName: string;
    messageText: string;
    contacts: CampaignImportContactInput[];
  }): Promise<CampaignImportResult> {
    const client = await dbPool.connect();
    try {
      await client.query("BEGIN");

      const campaignResult = await client.query<{
        id: string;
        workspaceId: string;
        name: string;
        status: CampaignStatus;
      }>(
        `
        INSERT INTO campaigns (workspace_id, name, status)
        VALUES ($1, $2, 'queued')
        RETURNING
          id,
          workspace_id AS "workspaceId",
          name,
          status
        `,
        [input.workspaceId, input.campaignName]
      );

      const campaign = campaignResult.rows[0];
      let importedContacts = 0;

      for (const contact of input.contacts) {
        const contactResult = await client.query<{ id: string }>(
          `
          INSERT INTO contacts (workspace_id, phone_e164, display_name)
          VALUES ($1, $2, $3)
          ON CONFLICT (workspace_id, phone_e164)
          DO UPDATE SET
            display_name = COALESCE(EXCLUDED.display_name, contacts.display_name),
            updated_at = NOW()
          RETURNING id
          `,
          [input.workspaceId, contact.phoneE164, contact.name]
        );

        const contactId = contactResult.rows[0].id;

        const campaignContactResult = await client.query<{ id: string }>(
          `
          INSERT INTO campaign_contacts (
            campaign_id,
            workspace_id,
            contact_id,
            status
          )
          VALUES ($1, $2, $3, 'pending')
          ON CONFLICT (campaign_id, contact_id) DO NOTHING
          RETURNING id
          `,
          [campaign.id, input.workspaceId, contactId]
        );

        const campaignContactId = campaignContactResult.rows[0]?.id;
        if (!campaignContactId) {
          continue;
        }

        await client.query(
          `
          INSERT INTO campaign_messages (
            campaign_id,
            campaign_contact_id,
            workspace_id,
            message_text,
            status,
            scheduled_at
          )
          VALUES ($1, $2, $3, $4, 'scheduled', NOW())
          `,
          [campaign.id, campaignContactId, input.workspaceId, input.messageText]
        );

        importedContacts += 1;
      }

      await client.query(
        `
        UPDATE campaigns
        SET
          contacts_total = $2,
          updated_at = NOW()
        WHERE id = $1
        `,
        [campaign.id, importedContacts]
      );

      await client.query("COMMIT");

      return {
        campaignId: campaign.id,
        workspaceId: campaign.workspaceId,
        name: campaign.name,
        status: campaign.status,
        contactsTotal: importedContacts,
        messagesScheduled: importedContacts
      };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async claimNextScheduledMessage(): Promise<QueuedCampaignMessage | null> {
    const client = await dbPool.connect();
    try {
      await client.query("BEGIN");

      const result = await client.query<QueuedCampaignMessage>(
        `
        WITH next_message AS (
          SELECT
            cm.id AS message_id,
            cm.campaign_id,
            cm.campaign_contact_id,
            cm.workspace_id,
            cm.message_text,
            ct.phone_e164 AS contact_phone
          FROM campaign_messages cm
          INNER JOIN campaign_contacts cc ON cc.id = cm.campaign_contact_id
          INNER JOIN contacts ct ON ct.id = cc.contact_id
          INNER JOIN campaigns c ON c.id = cm.campaign_id
          WHERE cm.status = 'scheduled'
            AND c.status IN ('queued', 'running')
          ORDER BY cm.scheduled_at ASC, cm.created_at ASC
          LIMIT 1
          FOR UPDATE OF cm SKIP LOCKED
        )
        UPDATE campaign_messages cm
        SET
          status = 'processing',
          updated_at = NOW()
        FROM next_message
        WHERE cm.id = next_message.message_id
        RETURNING
          cm.id AS "messageId",
          next_message.campaign_id AS "campaignId",
          next_message.campaign_contact_id AS "campaignContactId",
          next_message.workspace_id AS "workspaceId",
          next_message.contact_phone AS "contactPhone",
          next_message.message_text AS "messageText"
        `
      );

      const claimed = result.rows[0] ?? null;
      if (!claimed) {
        await client.query("COMMIT");
        return null;
      }

      await client.query(
        `
        UPDATE campaigns
        SET
          status = 'running',
          started_at = COALESCE(started_at, NOW()),
          updated_at = NOW()
        WHERE id = $1
        `,
        [claimed.campaignId]
      );

      await client.query("COMMIT");
      return claimed;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async markMessageSent(input: {
    messageId: string;
    campaignId: string;
    campaignContactId: string;
    providerMessageId: string | null;
  }): Promise<void> {
    const client = await dbPool.connect();
    try {
      await client.query("BEGIN");

      await client.query(
        `
        UPDATE campaign_messages
        SET
          status = 'sent',
          provider_message_id = $2,
          sent_at = NOW(),
          failed_reason = NULL,
          updated_at = NOW()
        WHERE id = $1
        `,
        [input.messageId, input.providerMessageId]
      );

      await client.query(
        `
        UPDATE campaign_contacts
        SET
          status = CASE WHEN status = 'replied' THEN status ELSE 'sent' END,
          sent_at = COALESCE(sent_at, NOW()),
          failed_reason = NULL,
          updated_at = NOW()
        WHERE id = $1
        `,
        [input.campaignContactId]
      );

      await this.refreshCampaignStatus(client, input.campaignId);

      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async markMessageFailed(input: {
    messageId: string;
    campaignId: string;
    campaignContactId: string;
    failedReason: string;
  }): Promise<void> {
    const client = await dbPool.connect();
    try {
      await client.query("BEGIN");

      await client.query(
        `
        UPDATE campaign_messages
        SET
          status = 'failed',
          failed_reason = $2,
          updated_at = NOW()
        WHERE id = $1
        `,
        [input.messageId, input.failedReason]
      );

      await client.query(
        `
        UPDATE campaign_contacts
        SET
          status = CASE WHEN status = 'replied' THEN status ELSE 'failed' END,
          failed_reason = $2,
          updated_at = NOW()
        WHERE id = $1
        `,
        [input.campaignContactId, input.failedReason]
      );

      await this.refreshCampaignStatus(client, input.campaignId);

      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async markContactRepliedByPhone(input: {
    workspaceId: string;
    phoneE164: string;
  }): Promise<{ campaignId: string; campaignContactId: string } | null> {
    const client = await dbPool.connect();
    try {
      await client.query("BEGIN");

      const targetResult = await client.query<{
        campaignId: string;
        campaignContactId: string;
        messageId: string;
      }>(
        `
        SELECT
          cc.campaign_id AS "campaignId",
          cc.id AS "campaignContactId",
          cm.id AS "messageId"
        FROM campaign_contacts cc
        INNER JOIN contacts ct ON ct.id = cc.contact_id
        INNER JOIN campaign_messages cm ON cm.campaign_contact_id = cc.id
        WHERE cc.workspace_id = $1
          AND ct.phone_e164 = $2
          AND cc.status IN ('pending', 'sent', 'failed')
          AND cm.status = 'sent'
        ORDER BY cm.sent_at DESC NULLS LAST, cm.created_at DESC
        LIMIT 1
        FOR UPDATE OF cc, cm
        `,
        [input.workspaceId, input.phoneE164]
      );

      const target = targetResult.rows[0] ?? null;
      if (!target) {
        await client.query("COMMIT");
        return null;
      }

      await client.query(
        `
        UPDATE campaign_contacts
        SET
          status = 'replied',
          replied_at = NOW(),
          failed_reason = NULL,
          updated_at = NOW()
        WHERE id = $1
        `,
        [target.campaignContactId]
      );

      await client.query(
        `
        UPDATE campaign_messages
        SET
          status = 'replied',
          updated_at = NOW()
        WHERE id = $1
        `,
        [target.messageId]
      );

      await this.refreshCampaignStatus(client, target.campaignId);

      await client.query("COMMIT");
      return {
        campaignId: target.campaignId,
        campaignContactId: target.campaignContactId
      };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async getCampaignMetrics(input: {
    workspaceId: string;
    campaignId: string;
  }): Promise<CampaignMetrics | null> {
    const result = await dbPool.query<CampaignMetrics>(
      `
      SELECT
        c.id AS "campaignId",
        COALESCE(cc.contacts_total, 0)::int AS "contactsTotal",
        COALESCE(cm.messages_sent, 0)::int AS "messagesSent",
        COALESCE(cr.replies, 0)::int AS "replies",
        COALESCE(rs.recovered_sales, 0)::int AS "recoveredSales"
      FROM campaigns c
      LEFT JOIN (
        SELECT campaign_id, COUNT(*)::int AS contacts_total
        FROM campaign_contacts
        GROUP BY campaign_id
      ) cc ON cc.campaign_id = c.id
      LEFT JOIN (
        SELECT campaign_id, COUNT(*)::int AS messages_sent
        FROM campaign_messages
        WHERE status IN ('sent', 'replied')
        GROUP BY campaign_id
      ) cm ON cm.campaign_id = c.id
      LEFT JOIN (
        SELECT campaign_id, COUNT(*)::int AS replies
        FROM campaign_contacts
        WHERE status = 'replied'
        GROUP BY campaign_id
      ) cr ON cr.campaign_id = c.id
      LEFT JOIN (
        SELECT
          cc.campaign_id,
          COUNT(DISTINCT so.id)::int AS recovered_sales
        FROM campaign_contacts cc
        INNER JOIN recovery_attempts ra
          ON ra.contact_id = cc.contact_id
         AND ra.workspace_id = cc.workspace_id
        INNER JOIN sale_outcomes so
          ON so.recovery_attempt_id = ra.id
         AND so.workspace_id = cc.workspace_id
        GROUP BY cc.campaign_id
      ) rs ON rs.campaign_id = c.id
      WHERE c.workspace_id = $1
        AND c.id = $2
      LIMIT 1
      `,
      [input.workspaceId, input.campaignId]
    );

    return result.rows[0] ?? null;
  }

  private async refreshCampaignStatus(
    client: PoolClient,
    campaignId: string
  ): Promise<void> {
    const pendingResult = await client.query<{ hasPending: boolean }>(
      `
      SELECT EXISTS (
        SELECT 1
        FROM campaign_messages
        WHERE campaign_id = $1
          AND status IN ('scheduled', 'processing')
      ) AS "hasPending"
      `,
      [campaignId]
    );

    const hasPending = pendingResult.rows[0]?.hasPending ?? false;

    if (hasPending) {
      await client.query(
        `
        UPDATE campaigns
        SET
          status = 'running',
          started_at = COALESCE(started_at, NOW()),
          completed_at = NULL,
          updated_at = NOW()
        WHERE id = $1
        `,
        [campaignId]
      );
      return;
    }

    await client.query(
      `
      UPDATE campaigns
      SET
        status = 'completed',
        started_at = COALESCE(started_at, NOW()),
        completed_at = COALESCE(completed_at, NOW()),
        updated_at = NOW()
      WHERE id = $1
      `,
      [campaignId]
    );
  }
}
