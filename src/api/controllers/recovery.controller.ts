import { type Request, type Response } from "express";
import { z } from "zod";
import { services } from "../../modules/service-registry";
import { logger } from "../../utils/logger";

const markSaleParamsSchema = z.object({
  recoveryId: z.string().uuid()
});

const markSaleBodySchema = z.object({
  amount: z.coerce.number().positive(),
  currency: z.string().min(3).max(3)
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

export function triggerRecovery(_req: Request, res: Response): void {
  res.status(501).json({
    data: null,
    error: {
      code: "NOT_IMPLEMENTED",
      message: "Recovery logic is not implemented in Sprint 1"
    }
  });
}

export function markRecoveredSale(req: Request, res: Response): void {
  const parsedParams = markSaleParamsSchema.safeParse(req.params);
  if (!parsedParams.success) {
    sendValidationError(
      res,
      parsedParams.error.issues[0]?.message ?? "Invalid params"
    );
    return;
  }

  const parsedBody = markSaleBodySchema.safeParse(req.body);
  if (!parsedBody.success) {
    sendValidationError(res, parsedBody.error.issues[0]?.message ?? "Invalid body");
    return;
  }

  const { recoveryId } = parsedParams.data;
  const { amount, currency } = parsedBody.data;

  services.recoveryService
    .markSaleRecovered({
      recoveryId,
      amount,
      currency
    })
    .then((result) => {
      if (!result) {
        res.status(404).json({
          data: null,
          error: {
            code: "RECOVERY_NOT_FOUND",
            message: "Recovery attempt not found"
          }
        });
        return;
      }

      res.status(200).json({
        data: result,
        error: null
      });
    })
    .catch((error) => {
      logger.error({ error, recoveryId }, "Failed to mark recovered sale");
      res.status(500).json({
        data: null,
        error: {
          code: "INTERNAL_ERROR",
          message: "Could not mark sale as recovered"
        }
      });
    });
}
