import { AutomationPlaybooksService } from "../modules/automation-playbooks/automation-playbooks.service";
import { AutomationSettingsService } from "../modules/automation-settings/automation-settings.service";
import { logger } from "../utils/logger";

const WEBHOOK_REQUEST_TIMEOUT_MS = 8000;

export type N8nAutomationLead = {
  name: string | null;
  phone: string;
  lastMessage: string | null;
  lastMessageTime: string;
  status: string;
  workspaceId: string;
  conversationId: string;
};

export class N8nAutomationsService {
  constructor(
    private readonly automationSettingsService: AutomationSettingsService,
    private readonly automationPlaybooksService: AutomationPlaybooksService
  ) {}

  async triggerSalesRecoveryPlaybook(lead: N8nAutomationLead): Promise<void> {
    try {
      const playbook =
        await this.automationPlaybooksService.getWorkspacePlaybook({
          workspaceId: lead.workspaceId,
          playbook: "sales_recovery"
        });

      if (!playbook.enabled) {
        return;
      }

      await Promise.allSettled([
        this.triggerQuickRecovery(lead),
        this.triggerFollowupRecovery(lead),
        this.triggerFinalRecovery(lead)
      ]);
    } catch (error) {
      logger.error(
        { error, workspaceId: lead.workspaceId, conversationId: lead.conversationId },
        "Failed to trigger sales recovery playbook automations"
      );
    }
  }

  async triggerQuickRecovery(lead: N8nAutomationLead): Promise<void> {
    try {
      const settings = await this.automationSettingsService.getWorkspaceSettings(
        lead.workspaceId
      );

      if (!settings.quickRecoveryWebhook) {
        return;
      }

      await this.postWebhook(settings.quickRecoveryWebhook, "quick_recovery_2h", lead);
    } catch (error) {
      logger.error(
        { error, workspaceId: lead.workspaceId, conversationId: lead.conversationId },
        "Failed to trigger n8n quick recovery webhook"
      );
    }
  }

  async triggerFollowupRecovery(lead: N8nAutomationLead): Promise<void> {
    try {
      const settings = await this.automationSettingsService.getWorkspaceSettings(
        lead.workspaceId
      );

      if (!settings.followupRecoveryWebhook) {
        return;
      }

      await this.postWebhook(
        settings.followupRecoveryWebhook,
        "followup_recovery_12h",
        lead
      );
    } catch (error) {
      logger.error(
        { error, workspaceId: lead.workspaceId, conversationId: lead.conversationId },
        "Failed to trigger n8n follow-up recovery webhook"
      );
    }
  }

  async triggerFinalRecovery(lead: N8nAutomationLead): Promise<void> {
    try {
      const settings = await this.automationSettingsService.getWorkspaceSettings(
        lead.workspaceId
      );

      if (!settings.finalRecoveryWebhook) {
        return;
      }

      await this.postWebhook(settings.finalRecoveryWebhook, "final_recovery_48h", lead);
    } catch (error) {
      logger.error(
        { error, workspaceId: lead.workspaceId, conversationId: lead.conversationId },
        "Failed to trigger n8n final recovery webhook"
      );
    }
  }

  private async postWebhook(
    webhookUrl: string,
    automationStage: string,
    lead: N8nAutomationLead
  ): Promise<void> {
    const abortController = new AbortController();
    const timeout = setTimeout(() => {
      abortController.abort();
    }, WEBHOOK_REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          lead_name: lead.name,
          phone: lead.phone,
          last_message: lead.lastMessage,
          last_message_time: lead.lastMessageTime,
          lead_status: lead.status,
          workspace_id: lead.workspaceId,
          conversation_id: lead.conversationId,
          automation_stage: automationStage
        }),
        signal: abortController.signal
      });

      if (!response.ok) {
        logger.warn(
          {
            webhookUrl,
            workspaceId: lead.workspaceId,
            conversationId: lead.conversationId,
            statusCode: response.status
          },
          "n8n webhook responded with non-success status"
        );
      }
    } finally {
      clearTimeout(timeout);
    }
  }
}
