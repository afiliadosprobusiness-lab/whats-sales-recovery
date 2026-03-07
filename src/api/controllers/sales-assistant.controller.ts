import { type Request, type Response } from "express";
import { z } from "zod";
import { services } from "../../modules/service-registry";
import { logger } from "../../utils/logger";

const workspaceQuerySchema = z.object({
  workspaceId: z.string().uuid()
});

const updateSettingsSchema = z.object({
  workspaceId: z.string().uuid(),
  chatbotEnabled: z.boolean(),
  chatbotStyle: z.string().trim().min(1).max(120).nullable().optional(),
  chatbotProductContext: z.string().trim().min(1).max(1000).nullable().optional()
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

export async function getSalesAssistantSettings(
  req: Request,
  res: Response
): Promise<void> {
  const parsed = workspaceQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    sendValidationError(res, parsed.error.issues[0]?.message ?? "Invalid query");
    return;
  }

  try {
    const settings = await services.salesAssistantService.getWorkspaceSettings(
      parsed.data.workspaceId
    );

    res.status(200).json({
      data: {
        workspace_id: settings.workspaceId,
        chatbot_enabled: settings.chatbotEnabled,
        chatbot_style: settings.chatbotStyle,
        chatbot_product_context: settings.chatbotProductContext
      },
      error: null
    });
  } catch (error) {
    logger.error({ error }, "Failed to get sales assistant settings");
    res.status(500).json({
      data: null,
      error: {
        code: "INTERNAL_ERROR",
        message: "Could not load sales assistant settings"
      }
    });
  }
}

export async function updateSalesAssistantSettings(
  req: Request,
  res: Response
): Promise<void> {
  const parsed = updateSettingsSchema.safeParse(req.body);
  if (!parsed.success) {
    sendValidationError(res, parsed.error.issues[0]?.message ?? "Invalid body");
    return;
  }

  try {
    const settings = await services.salesAssistantService.updateWorkspaceSettings({
      workspaceId: parsed.data.workspaceId,
      chatbotEnabled: parsed.data.chatbotEnabled,
      chatbotStyle: parsed.data.chatbotStyle ?? null,
      chatbotProductContext: parsed.data.chatbotProductContext ?? null
    });

    res.status(200).json({
      data: {
        workspace_id: settings.workspaceId,
        chatbot_enabled: settings.chatbotEnabled,
        chatbot_style: settings.chatbotStyle,
        chatbot_product_context: settings.chatbotProductContext
      },
      error: null
    });
  } catch (error) {
    logger.error({ error }, "Failed to update sales assistant settings");
    res.status(500).json({
      data: null,
      error: {
        code: "INTERNAL_ERROR",
        message: "Could not update sales assistant settings"
      }
    });
  }
}

export async function getSalesAssistantMetrics(
  req: Request,
  res: Response
): Promise<void> {
  const parsed = workspaceQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    sendValidationError(res, parsed.error.issues[0]?.message ?? "Invalid query");
    return;
  }

  try {
    const metrics = await services.salesAssistantService.getDashboardMetrics(
      parsed.data.workspaceId
    );

    res.status(200).json({
      data: {
        chatbot_messages_sent: metrics.chatbotMessagesSent,
        chatbot_conversations_handled: metrics.chatbotConversationsHandled,
        chatbot_sales_closed: metrics.chatbotSalesClosed
      },
      error: null
    });
  } catch (error) {
    logger.error({ error }, "Failed to load sales assistant metrics");
    res.status(500).json({
      data: null,
      error: {
        code: "INTERNAL_ERROR",
        message: "Could not load sales assistant metrics"
      }
    });
  }
}
