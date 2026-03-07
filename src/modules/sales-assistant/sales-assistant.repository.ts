import { dbPool } from "../../config/database";
import {
  type SalesAssistantConversationContext,
  type SalesAssistantDashboardMetrics,
  type SalesAssistantLogRecord,
  type WorkspaceChatbotSettings
} from "./sales-assistant.types";

export class SalesAssistantRepository {
  async getWorkspaceSettings(workspaceId: string): Promise<WorkspaceChatbotSettings> {
    await dbPool.query(
      `
      INSERT INTO workspace_settings (
        workspace_id,
        chatbot_enabled,
        chatbot_style,
        chatbot_product_context
      )
      SELECT $1::uuid, FALSE, NULL, NULL
      WHERE EXISTS (SELECT 1 FROM workspaces WHERE id = $1::uuid)
      ON CONFLICT (workspace_id) DO NOTHING
      `,
      [workspaceId]
    );

    const result = await dbPool.query<WorkspaceChatbotSettings>(
      `
      SELECT
        workspace_id AS "workspaceId",
        chatbot_enabled AS "chatbotEnabled",
        chatbot_style AS "chatbotStyle",
        chatbot_product_context AS "chatbotProductContext"
      FROM workspace_settings
      WHERE workspace_id = $1
      LIMIT 1
      `,
      [workspaceId]
    );

    return (
      result.rows[0] ?? {
        workspaceId,
        chatbotEnabled: false,
        chatbotStyle: null,
        chatbotProductContext: null
      }
    );
  }

  async upsertWorkspaceSettings(input: {
    workspaceId: string;
    chatbotEnabled: boolean;
    chatbotStyle: string | null;
    chatbotProductContext: string | null;
  }): Promise<WorkspaceChatbotSettings> {
    const result = await dbPool.query<WorkspaceChatbotSettings>(
      `
      INSERT INTO workspace_settings (
        workspace_id,
        chatbot_enabled,
        chatbot_style,
        chatbot_product_context
      )
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (workspace_id)
      DO UPDATE SET
        chatbot_enabled = EXCLUDED.chatbot_enabled,
        chatbot_style = EXCLUDED.chatbot_style,
        chatbot_product_context = EXCLUDED.chatbot_product_context,
        updated_at = NOW()
      RETURNING
        workspace_id AS "workspaceId",
        chatbot_enabled AS "chatbotEnabled",
        chatbot_style AS "chatbotStyle",
        chatbot_product_context AS "chatbotProductContext"
      `,
      [
        input.workspaceId,
        input.chatbotEnabled,
        input.chatbotStyle,
        input.chatbotProductContext
      ]
    );

    return result.rows[0];
  }

  async findConversationContext(input: {
    workspaceId: string;
    sessionId: string;
    contactPhone: string;
  }): Promise<SalesAssistantConversationContext> {
    const result = await dbPool.query<SalesAssistantConversationContext>(
      `
      SELECT
        ct.id AS "contactId",
        conv.id AS "conversationId",
        conv.status AS "conversationStatus",
        ct.opt_out AS "contactOptOut"
      FROM contacts ct
      LEFT JOIN LATERAL (
        SELECT
          c.id,
          c.status
        FROM conversations c
        WHERE c.workspace_id = $1
          AND c.contact_id = ct.id
        ORDER BY
          CASE WHEN c.whatsapp_session_id = $2 THEN 0 ELSE 1 END,
          c.updated_at DESC
        LIMIT 1
      ) conv ON TRUE
      WHERE ct.workspace_id = $1
        AND ct.phone_e164 = $3
      LIMIT 1
      `,
      [input.workspaceId, input.sessionId, input.contactPhone]
    );

    return (
      result.rows[0] ?? {
        contactId: null,
        conversationId: null,
        conversationStatus: null,
        contactOptOut: false
      }
    );
  }

  async insertChatbotLog(input: {
    workspaceId: string;
    conversationId: string;
    customerMessage: string;
    botResponse: string;
  }): Promise<void> {
    await dbPool.query(
      `
      INSERT INTO chatbot_logs (
        workspace_id,
        conversation_id,
        customer_message,
        bot_response
      )
      VALUES ($1, $2, $3, $4)
      `,
      [
        input.workspaceId,
        input.conversationId,
        input.customerMessage,
        input.botResponse
      ]
    );
  }

  async listRecentChatbotLogs(input: {
    workspaceId: string;
    conversationId: string;
    limit: number;
  }): Promise<SalesAssistantLogRecord[]> {
    const result = await dbPool.query<SalesAssistantLogRecord>(
      `
      SELECT
        customer_message AS "customerMessage",
        bot_response AS "botResponse",
        created_at AS "createdAt"
      FROM chatbot_logs
      WHERE workspace_id = $1
        AND conversation_id = $2
      ORDER BY created_at DESC
      LIMIT $3
      `,
      [input.workspaceId, input.conversationId, input.limit]
    );

    return result.rows.reverse();
  }

  async getDashboardMetrics(
    workspaceId: string
  ): Promise<SalesAssistantDashboardMetrics> {
    const result = await dbPool.query<SalesAssistantDashboardMetrics>(
      `
      SELECT
        COALESCE(metrics.messages_sent, 0)::int AS "chatbotMessagesSent",
        COALESCE(metrics.conversations_handled, 0)::int AS "chatbotConversationsHandled",
        COALESCE(sales.sales_closed, 0)::int AS "chatbotSalesClosed"
      FROM (
        SELECT
          COUNT(*) AS messages_sent,
          COUNT(DISTINCT conversation_id) AS conversations_handled
        FROM chatbot_logs
        WHERE workspace_id = $1
      ) metrics
      CROSS JOIN (
        SELECT
          COUNT(DISTINCT so.id) AS sales_closed
        FROM sale_outcomes so
        WHERE so.workspace_id = $1
          AND EXISTS (
            SELECT 1
            FROM chatbot_logs cl
            WHERE cl.workspace_id = so.workspace_id
              AND cl.conversation_id = so.conversation_id
          )
      ) sales
      `,
      [workspaceId]
    );

    return (
      result.rows[0] ?? {
        chatbotMessagesSent: 0,
        chatbotConversationsHandled: 0,
        chatbotSalesClosed: 0
      }
    );
  }
}
