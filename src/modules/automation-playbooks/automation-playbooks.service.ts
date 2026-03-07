import { AutomationPlaybooksRepository } from "./automation-playbooks.repository";
import {
  automationPlaybookNames,
  type AutomationPlaybookName,
  type WorkspaceAutomationPlaybook
} from "./automation-playbooks.types";

export class AutomationPlaybooksService {
  constructor(private readonly repository: AutomationPlaybooksRepository) {}

  async listWorkspacePlaybooks(
    workspaceId: string
  ): Promise<WorkspaceAutomationPlaybook[]> {
    const records = await Promise.all(
      automationPlaybookNames.map((playbook) =>
        this.repository.getWorkspacePlaybook({
          workspaceId,
          playbook
        })
      )
    );

    return records;
  }

  async getWorkspacePlaybook(input: {
    workspaceId: string;
    playbook: AutomationPlaybookName;
  }): Promise<WorkspaceAutomationPlaybook> {
    return this.repository.getWorkspacePlaybook(input);
  }

  async setWorkspacePlaybookEnabled(input: {
    workspaceId: string;
    playbook: AutomationPlaybookName;
    enabled: boolean;
  }): Promise<WorkspaceAutomationPlaybook> {
    return this.repository.upsertWorkspacePlaybook(input);
  }
}
