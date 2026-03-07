import { dbPool } from "../../config/database";
import { type WorkspaceAutomationSettings } from "./automation-settings.types";

export class AutomationSettingsRepository {
  async getWorkspaceSettings(
    workspaceId: string
  ): Promise<WorkspaceAutomationSettings> {
    await dbPool.query(
      `
      INSERT INTO automation_settings (
        workspace_id,
        quick_recovery_webhook,
        followup_recovery_webhook,
        final_recovery_webhook
      )
      SELECT $1::uuid, NULL, NULL, NULL
      WHERE EXISTS (SELECT 1 FROM workspaces WHERE id = $1::uuid)
      ON CONFLICT (workspace_id) DO NOTHING
      `,
      [workspaceId]
    );

    const result = await dbPool.query<WorkspaceAutomationSettings>(
      `
      SELECT
        workspace_id AS "workspaceId",
        quick_recovery_webhook AS "quickRecoveryWebhook",
        followup_recovery_webhook AS "followupRecoveryWebhook",
        final_recovery_webhook AS "finalRecoveryWebhook",
        ai_router_webhook_url AS "aiRouterWebhookUrl"
      FROM automation_settings
      WHERE workspace_id = $1
      LIMIT 1
      `,
      [workspaceId]
    );

    return (
      result.rows[0] ?? {
        workspaceId,
        quickRecoveryWebhook: null,
        followupRecoveryWebhook: null,
        finalRecoveryWebhook: null,
        aiRouterWebhookUrl: null
      }
    );
  }

  async upsertWorkspaceSettings(input: {
    workspaceId: string;
    quickRecoveryWebhook: string | null;
    followupRecoveryWebhook: string | null;
    finalRecoveryWebhook: string | null;
  }): Promise<WorkspaceAutomationSettings> {
    const result = await dbPool.query<WorkspaceAutomationSettings>(
      `
      WITH upsert AS (
        INSERT INTO automation_settings (
          workspace_id,
          quick_recovery_webhook,
          followup_recovery_webhook,
          final_recovery_webhook
        )
        SELECT $1::uuid, $2, $3, $4
        WHERE EXISTS (SELECT 1 FROM workspaces WHERE id = $1::uuid)
        ON CONFLICT (workspace_id)
        DO UPDATE SET
          quick_recovery_webhook = EXCLUDED.quick_recovery_webhook,
          followup_recovery_webhook = EXCLUDED.followup_recovery_webhook,
          final_recovery_webhook = EXCLUDED.final_recovery_webhook,
          updated_at = NOW()
        RETURNING
          workspace_id AS "workspaceId",
          quick_recovery_webhook AS "quickRecoveryWebhook",
          followup_recovery_webhook AS "followupRecoveryWebhook",
          final_recovery_webhook AS "finalRecoveryWebhook",
          ai_router_webhook_url AS "aiRouterWebhookUrl"
      )
      SELECT * FROM upsert
      `,
      [
        input.workspaceId,
        input.quickRecoveryWebhook,
        input.followupRecoveryWebhook,
        input.finalRecoveryWebhook
      ]
    );

    return (
      result.rows[0] ?? {
        workspaceId: input.workspaceId,
        quickRecoveryWebhook: null,
        followupRecoveryWebhook: null,
        finalRecoveryWebhook: null,
        aiRouterWebhookUrl: null
      }
    );
  }

  async upsertWorkspaceAiChatbotSettings(input: {
    workspaceId: string;
    aiRouterWebhookUrl: string;
  }): Promise<WorkspaceAutomationSettings> {
    const result = await dbPool.query<WorkspaceAutomationSettings>(
      `
      WITH upsert AS (
        INSERT INTO automation_settings (
          workspace_id,
          quick_recovery_webhook,
          followup_recovery_webhook,
          final_recovery_webhook,
          ai_router_webhook_url
        )
        SELECT $1::uuid, NULL, NULL, NULL, $2
        WHERE EXISTS (SELECT 1 FROM workspaces WHERE id = $1::uuid)
        ON CONFLICT (workspace_id)
        DO UPDATE SET
          ai_router_webhook_url = EXCLUDED.ai_router_webhook_url,
          updated_at = NOW()
        RETURNING
          workspace_id AS "workspaceId",
          quick_recovery_webhook AS "quickRecoveryWebhook",
          followup_recovery_webhook AS "followupRecoveryWebhook",
          final_recovery_webhook AS "finalRecoveryWebhook",
          ai_router_webhook_url AS "aiRouterWebhookUrl"
      )
      SELECT * FROM upsert
      `,
      [input.workspaceId, input.aiRouterWebhookUrl]
    );

    return (
      result.rows[0] ?? {
        workspaceId: input.workspaceId,
        quickRecoveryWebhook: null,
        followupRecoveryWebhook: null,
        finalRecoveryWebhook: null,
        aiRouterWebhookUrl: null
      }
    );
  }
}
