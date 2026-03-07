import { type Request, type Response } from "express";
import { z } from "zod";
import { services } from "../../modules/service-registry";
import { logger } from "../../utils/logger";

const workspaceQuerySchema = z.object({
  workspaceId: z.string().uuid()
});

const webhookSchema = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((value) => {
    if (typeof value !== "string") {
      return null;
    }

    const normalized = value.trim();
    if (!normalized) {
      return null;
    }

    return normalized;
  })
  .refine((value) => value === null || /^https?:\/\//i.test(value), {
    message: "Webhook URL must start with http:// or https://"
  });

const upsertAutomationsSettingsSchema = z.object({
  quick_recovery_webhook: webhookSchema,
  followup_recovery_webhook: webhookSchema,
  final_recovery_webhook: webhookSchema
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

export async function getAutomationsSettings(
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

  try {
    const settings =
      await services.automationSettingsService.getWorkspaceSettings(
        parsedQuery.data.workspaceId
      );

    res.status(200).json({
      data: {
        workspace_id: settings.workspaceId,
        quick_recovery_webhook: settings.quickRecoveryWebhook,
        followup_recovery_webhook: settings.followupRecoveryWebhook,
        final_recovery_webhook: settings.finalRecoveryWebhook
      },
      error: null
    });
  } catch (error) {
    logger.error({ error }, "Failed to load automations settings");
    res.status(500).json({
      data: null,
      error: {
        code: "INTERNAL_ERROR",
        message: "Could not load automations settings"
      }
    });
  }
}

export async function updateAutomationsSettings(
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

  const parsedBody = upsertAutomationsSettingsSchema.safeParse(req.body);
  if (!parsedBody.success) {
    sendValidationError(
      res,
      parsedBody.error.issues[0]?.message ?? "Invalid body"
    );
    return;
  }

  try {
    const settings =
      await services.automationSettingsService.updateWorkspaceSettings({
        workspaceId: parsedQuery.data.workspaceId,
        quickRecoveryWebhook: parsedBody.data.quick_recovery_webhook,
        followupRecoveryWebhook: parsedBody.data.followup_recovery_webhook,
        finalRecoveryWebhook: parsedBody.data.final_recovery_webhook
      });

    res.status(200).json({
      data: {
        workspace_id: settings.workspaceId,
        quick_recovery_webhook: settings.quickRecoveryWebhook,
        followup_recovery_webhook: settings.followupRecoveryWebhook,
        final_recovery_webhook: settings.finalRecoveryWebhook
      },
      error: null
    });
  } catch (error) {
    logger.error({ error }, "Failed to update automations settings");
    res.status(500).json({
      data: null,
      error: {
        code: "INTERNAL_ERROR",
        message: "Could not update automations settings"
      }
    });
  }
}
