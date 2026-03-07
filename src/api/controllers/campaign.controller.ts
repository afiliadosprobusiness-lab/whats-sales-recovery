import { type Request, type Response } from "express";
import { z } from "zod";
import { services } from "../../modules/service-registry";
import { logger } from "../../utils/logger";
import { CampaignValidationError } from "../../modules/campaigns/campaign.service";

const importQuerySchema = z.object({
  workspaceId: z.string().uuid(),
  campaignName: z.string().trim().min(1).max(120).optional()
});

const metricsParamsSchema = z.object({
  campaignId: z.string().uuid()
});

const metricsQuerySchema = z.object({
  workspaceId: z.string().uuid()
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

export async function importCampaignCsv(
  req: Request,
  res: Response
): Promise<void> {
  const parsedQuery = importQuerySchema.safeParse(req.query);
  if (!parsedQuery.success) {
    sendValidationError(
      res,
      parsedQuery.error.issues[0]?.message ?? "Invalid query params"
    );
    return;
  }

  if (typeof req.body !== "string" || req.body.trim().length === 0) {
    sendValidationError(res, "CSV body is required");
    return;
  }

  try {
    const result = await services.campaignService.importCampaignFromCsv({
      workspaceId: parsedQuery.data.workspaceId,
      campaignName: parsedQuery.data.campaignName,
      csv: req.body
    });

    res.status(201).json({
      data: {
        campaignId: result.campaignId,
        workspaceId: result.workspaceId,
        name: result.name,
        status: result.status,
        contactsTotal: result.contactsTotal,
        messagesScheduled: result.messagesScheduled
      },
      error: null
    });
  } catch (error) {
    if (error instanceof CampaignValidationError) {
      res.status(400).json({
        data: null,
        error: {
          code: "CAMPAIGN_IMPORT_INVALID_CSV",
          message: error.message
        }
      });
      return;
    }

    logger.error(
      { error, workspaceId: parsedQuery.data.workspaceId },
      "Failed to import campaign CSV"
    );
    res.status(500).json({
      data: null,
      error: {
        code: "INTERNAL_ERROR",
        message: "Could not import campaign CSV"
      }
    });
  }
}

export async function getCampaignMetrics(
  req: Request,
  res: Response
): Promise<void> {
  const parsedParams = metricsParamsSchema.safeParse(req.params);
  if (!parsedParams.success) {
    sendValidationError(
      res,
      parsedParams.error.issues[0]?.message ?? "Invalid params"
    );
    return;
  }

  const parsedQuery = metricsQuerySchema.safeParse(req.query);
  if (!parsedQuery.success) {
    sendValidationError(
      res,
      parsedQuery.error.issues[0]?.message ?? "Invalid query params"
    );
    return;
  }

  try {
    const metrics = await services.campaignService.getCampaignMetrics({
      workspaceId: parsedQuery.data.workspaceId,
      campaignId: parsedParams.data.campaignId
    });

    if (!metrics) {
      res.status(404).json({
        data: null,
        error: {
          code: "CAMPAIGN_NOT_FOUND",
          message: "Campaign not found"
        }
      });
      return;
    }

    res.status(200).json({
      data: {
        campaignId: metrics.campaignId,
        contacts_total: metrics.contactsTotal,
        messages_sent: metrics.messagesSent,
        replies: metrics.replies,
        recovered_sales: metrics.recoveredSales
      },
      error: null
    });
  } catch (error) {
    logger.error(
      { error, campaignId: parsedParams.data.campaignId },
      "Failed to load campaign metrics"
    );
    res.status(500).json({
      data: null,
      error: {
        code: "INTERNAL_ERROR",
        message: "Could not load campaign metrics"
      }
    });
  }
}
