import { AutomationSettingsService } from "../modules/automation-settings/automation-settings.service";
import { logger } from "../utils/logger";

const WEBHOOK_REQUEST_TIMEOUT_MS = 8000;

export type N8nChatbotInboundPayload = {
  workspace_id: string;
  phone: string;
  lead_name: string;
  message: string;
  lead_status: string;
  conversation_id: string;
  timestamp: string;
};

export class N8nChatbotService {
  constructor(
    private readonly automationSettingsService: AutomationSettingsService
  ) {}

  async forwardIncomingMessageToAiRouter(
    payload: N8nChatbotInboundPayload
  ): Promise<void> {
    try {
      const settings =
        await this.automationSettingsService.getWorkspaceAiChatbotSettings(
          payload.workspace_id
        );

      if (settings.workspaceId !== payload.workspace_id) {
        logger.error(
          {
            requestedWorkspaceId: payload.workspace_id,
            resolvedWorkspaceId: settings.workspaceId,
            conversationId: payload.conversation_id
          },
          "inbound message ignored (and why)"
        );
        return;
      }

      const webhookUrl = settings.aiRouterWebhookUrl?.trim() ?? "";
      if (!webhookUrl) {
        logger.info(
          {
            workspaceId: payload.workspace_id,
            conversationId: payload.conversation_id,
            reason: "missing_ai_router_webhook_url"
          },
          "inbound message ignored (and why)"
        );
        return;
      }

      const abortController = new AbortController();
      const timeout = setTimeout(() => {
        abortController.abort();
      }, WEBHOOK_REQUEST_TIMEOUT_MS);

      try {
        logger.info(
          {
            workspaceId: payload.workspace_id,
            conversationId: payload.conversation_id,
            webhookTarget: this.toSafeWebhookTarget(webhookUrl)
          },
          "forwarding to AI router started"
        );

        const response = await fetch(webhookUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload),
          signal: abortController.signal
        });

        if (!response.ok) {
          logger.error(
            {
              workspaceId: payload.workspace_id,
              conversationId: payload.conversation_id,
              statusCode: response.status,
              webhookTarget: this.toSafeWebhookTarget(webhookUrl)
            },
            "forwarding to AI router failed"
          );
          return;
        }

        logger.info(
          {
            workspaceId: payload.workspace_id,
            conversationId: payload.conversation_id
          },
          "forwarding to AI router success"
        );
      } finally {
        clearTimeout(timeout);
      }
    } catch (error) {
      logger.error(
        {
          error,
          workspaceId: payload.workspace_id,
          conversationId: payload.conversation_id
        },
        "forwarding to AI router failed"
      );
    }
  }

  private toSafeWebhookTarget(webhookUrl: string): string {
    try {
      const parsed = new URL(webhookUrl);
      return `${parsed.origin}${parsed.pathname}`;
    } catch {
      return "invalid_webhook_url";
    }
  }
}
