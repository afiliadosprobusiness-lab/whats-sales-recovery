export type WorkspaceAutomationSettings = {
  workspaceId: string;
  quickRecoveryWebhook: string | null;
  followupRecoveryWebhook: string | null;
  finalRecoveryWebhook: string | null;
  aiRouterWebhookUrl: string | null;
};
