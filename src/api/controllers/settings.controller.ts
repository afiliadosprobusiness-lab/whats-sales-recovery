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

const upsertAiChatbotSettingsSchema = z.object({
  ai_router_webhook_url: z
    .string()
    .trim()
    .min(1, "AI Router Webhook URL is required")
    .refine((value) => /^https?:\/\//i.test(value), {
      message: "AI Router Webhook URL must start with http:// or https://"
    })
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

export async function getAiChatbotSettings(
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
      await services.automationSettingsService.getWorkspaceAiChatbotSettings(
        parsedQuery.data.workspaceId
      );

    res.status(200).json({
      data: {
        workspace_id: settings.workspaceId,
        ai_router_webhook_url: settings.aiRouterWebhookUrl
      },
      error: null
    });
  } catch (error) {
    logger.error({ error }, "Failed to load AI chatbot settings");
    res.status(500).json({
      data: null,
      error: {
        code: "INTERNAL_ERROR",
        message: "Could not load AI chatbot settings"
      }
    });
  }
}

export async function updateAiChatbotSettings(
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

  const parsedBody = upsertAiChatbotSettingsSchema.safeParse(req.body);
  if (!parsedBody.success) {
    sendValidationError(
      res,
      parsedBody.error.issues[0]?.message ?? "Invalid body"
    );
    return;
  }

  try {
    const settings =
      await services.automationSettingsService.updateWorkspaceAiChatbotSettings({
        workspaceId: parsedQuery.data.workspaceId,
        aiRouterWebhookUrl: parsedBody.data.ai_router_webhook_url
      });

    res.status(200).json({
      data: {
        workspace_id: settings.workspaceId,
        ai_router_webhook_url: settings.aiRouterWebhookUrl
      },
      error: null
    });
  } catch (error) {
    logger.error({ error }, "Failed to update AI chatbot settings");
    res.status(500).json({
      data: null,
      error: {
        code: "INTERNAL_ERROR",
        message: "Could not update AI chatbot settings"
      }
    });
  }
}
