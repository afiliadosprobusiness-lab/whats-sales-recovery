import { type Request, type Response } from "express";
import { z } from "zod";
import { services } from "../../modules/service-registry";
import { logger } from "../../utils/logger";
import { automationPlaybookNames } from "../../modules/automation-playbooks/automation-playbooks.types";

const workspaceQuerySchema = z.object({
  workspaceId: z.string().uuid()
});

const setPlaybookSchema = z.object({
  playbook: z.enum(automationPlaybookNames),
  enabled: z.boolean()
});

function sendValidationError(res: Response, message: string): void {
  res.status(400).json({
    data: null,
    error: {
      code: "VALIDATION_ERROR",
      message
    }
  });
}

export async function listAutomationPlaybooks(
  req: Request,
  res: Response
): Promise<void> {
  const parsed = workspaceQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    sendValidationError(res, parsed.error.issues[0]?.message ?? "Invalid query");
    return;
  }

  try {
    const items = await services.automationPlaybooksService.listWorkspacePlaybooks(
      parsed.data.workspaceId
    );

    res.status(200).json({
      data: {
        items: items.map((item) => ({
          playbook: item.playbook,
          enabled: item.enabled
        })),
        running: items.filter((item) => item.enabled).map((item) => item.playbook)
      },
      error: null
    });
  } catch (error) {
    logger.error({ error }, "Failed to list automation playbooks");
    res.status(500).json({
      data: null,
      error: {
        code: "INTERNAL_ERROR",
        message: "Could not load automation playbooks"
      }
    });
  }
}

export async function setAutomationPlaybook(
  req: Request,
  res: Response
): Promise<void> {
  const parsedQuery = workspaceQuerySchema.safeParse(req.query);
  if (!parsedQuery.success) {
    sendValidationError(
      res,
      parsedQuery.error.issues[0]?.message ?? "Invalid query"
    );
    return;
  }

  const parsedBody = setPlaybookSchema.safeParse(req.body);
  if (!parsedBody.success) {
    sendValidationError(
      res,
      parsedBody.error.issues[0]?.message ?? "Invalid body"
    );
    return;
  }

  try {
    const record = await services.automationPlaybooksService.setWorkspacePlaybookEnabled(
      {
        workspaceId: parsedQuery.data.workspaceId,
        playbook: parsedBody.data.playbook,
        enabled: parsedBody.data.enabled
      }
    );

    res.status(200).json({
      data: {
        workspace_id: record.workspaceId,
        playbook: record.playbook,
        enabled: record.enabled
      },
      error: null
    });
  } catch (error) {
    logger.error({ error }, "Failed to update automation playbook");
    res.status(500).json({
      data: null,
      error: {
        code: "INTERNAL_ERROR",
        message: "Could not update automation playbook"
      }
    });
  }
}
