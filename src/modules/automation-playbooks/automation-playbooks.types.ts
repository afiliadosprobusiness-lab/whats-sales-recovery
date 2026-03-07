export const automationPlaybookNames = ["sales_recovery"] as const;

export type AutomationPlaybookName = (typeof automationPlaybookNames)[number];

export type WorkspaceAutomationPlaybook = {
  workspaceId: string;
  playbook: AutomationPlaybookName;
  enabled: boolean;
};
