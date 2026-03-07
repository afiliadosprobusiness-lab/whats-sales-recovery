import { AutomationSettingsRepository } from "./automation-settings.repository";
import { type WorkspaceAutomationSettings } from "./automation-settings.types";

export class AutomationSettingsService {
  constructor(private readonly repository: AutomationSettingsRepository) {}

  async getWorkspaceSettings(
    workspaceId: string
  ): Promise<WorkspaceAutomationSettings> {
    return this.repository.getWorkspaceSettings(workspaceId);
  }

  async updateWorkspaceSettings(input: {
    workspaceId: string;
    quickRecoveryWebhook: string | null;
    followupRecoveryWebhook: string | null;
    finalRecoveryWebhook: string | null;
  }): Promise<WorkspaceAutomationSettings> {
    return this.repository.upsertWorkspaceSettings(input);
  }

  async getWorkspaceAiChatbotSettings(
    workspaceId: string
  ): Promise<WorkspaceAutomationSettings> {
    return this.repository.getWorkspaceSettings(workspaceId);
  }

  async updateWorkspaceAiChatbotSettings(input: {
    workspaceId: string;
    aiRouterWebhookUrl: string;
  }): Promise<WorkspaceAutomationSettings> {
    return this.repository.upsertWorkspaceAiChatbotSettings(input);
  }
}
