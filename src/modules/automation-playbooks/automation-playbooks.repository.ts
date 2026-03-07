import { dbPool } from "../../config/database";
import {
  type AutomationPlaybookName,
  type WorkspaceAutomationPlaybook
} from "./automation-playbooks.types";

export class AutomationPlaybooksRepository {
  async getWorkspacePlaybook(input: {
    workspaceId: string;
    playbook: AutomationPlaybookName;
  }): Promise<WorkspaceAutomationPlaybook> {
    await dbPool.query(
      `
      INSERT INTO automation_playbooks (
        workspace_id,
        name,
        enabled
      )
      SELECT $1::uuid, $2, FALSE
      WHERE EXISTS (SELECT 1 FROM workspaces WHERE id = $1::uuid)
      ON CONFLICT (workspace_id, name) DO NOTHING
      `,
      [input.workspaceId, input.playbook]
    );

    const result = await dbPool.query<WorkspaceAutomationPlaybook>(
      `
      SELECT
        workspace_id AS "workspaceId",
        name AS "playbook",
        enabled
      FROM automation_playbooks
      WHERE workspace_id = $1
        AND name = $2
      LIMIT 1
      `,
      [input.workspaceId, input.playbook]
    );

    return (
      result.rows[0] ?? {
        workspaceId: input.workspaceId,
        playbook: input.playbook,
        enabled: false
      }
    );
  }

  async upsertWorkspacePlaybook(input: {
    workspaceId: string;
    playbook: AutomationPlaybookName;
    enabled: boolean;
  }): Promise<WorkspaceAutomationPlaybook> {
    const result = await dbPool.query<WorkspaceAutomationPlaybook>(
      `
      WITH upsert AS (
        INSERT INTO automation_playbooks (
          workspace_id,
          name,
          enabled
        )
        SELECT $1::uuid, $2, $3
        WHERE EXISTS (SELECT 1 FROM workspaces WHERE id = $1::uuid)
        ON CONFLICT (workspace_id, name)
        DO UPDATE SET
          enabled = EXCLUDED.enabled,
          updated_at = NOW()
        RETURNING
          workspace_id AS "workspaceId",
          name AS "playbook",
          enabled
      )
      SELECT * FROM upsert
      `,
      [input.workspaceId, input.playbook, input.enabled]
    );

    return (
      result.rows[0] ?? {
        workspaceId: input.workspaceId,
        playbook: input.playbook,
        enabled: false
      }
    );
  }
}
