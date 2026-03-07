import { AutomationSettingsService } from "../modules/automation-settings/automation-settings.service";

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
      console.log("Inbound message detected for AI router forwarding", {
        workspaceId: payload.workspace_id,
        phone: payload.phone,
        conversationId: payload.conversation_id
      });

      const settings =
        await this.automationSettingsService.getWorkspaceAiChatbotSettings(
          payload.workspace_id
        );
      const webhookUrl = settings.aiRouterWebhookUrl?.trim() ?? "";
      if (!webhookUrl) {
        return;
      }

      console.log("AI router webhook found", {
        workspaceId: payload.workspace_id,
        conversationId: payload.conversation_id,
        webhookUrl
      });

      const abortController = new AbortController();
      const timeout = setTimeout(() => {
        abortController.abort();
      }, WEBHOOK_REQUEST_TIMEOUT_MS);

      try {
        console.log("AI router forwarding started", {
          workspaceId: payload.workspace_id,
          conversationId: payload.conversation_id
        });

        const response = await fetch(webhookUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload),
          signal: abortController.signal
        });

        if (!response.ok) {
          console.error("AI chatbot webhook responded with non-success status", {
            workspaceId: payload.workspace_id,
            conversationId: payload.conversation_id,
            statusCode: response.status
          });
          return;
        }

        console.log("AI router forwarding success", {
          workspaceId: payload.workspace_id,
          conversationId: payload.conversation_id
        });
      } finally {
        clearTimeout(timeout);
      }
    } catch (error) {
      console.error("AI router forwarding failure", {
        error,
        workspaceId: payload.workspace_id,
        conversationId: payload.conversation_id
      });
    }
  }
}
