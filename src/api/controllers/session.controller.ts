import { type Request, type Response } from "express";
import { z } from "zod";
import { services } from "../../modules/service-registry";
import { logger } from "../../utils/logger";

const startSessionSchema = z.object({
  workspaceId: z.string().uuid()
});

const sessionParamsSchema = z.object({
  sessionId: z.string().uuid()
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

export async function startSession(req: Request, res: Response): Promise<void> {
  const parsed = startSessionSchema.safeParse(req.body);
  if (!parsed.success) {
    sendValidationError(res, parsed.error.issues[0]?.message ?? "Invalid input");
    return;
  }

  try {
    const session = await services.whatsappSessionManager.startSession(
      parsed.data.workspaceId
    );

    res.status(202).json({
      data: {
        sessionId: session.id,
        workspaceId: session.workspaceId,
        status: session.status
      },
      error: null
    });
  } catch (error) {
    logger.error({ error }, "Failed to start WhatsApp session");
    res.status(500).json({
      data: null,
      error: {
        code: "INTERNAL_ERROR",
        message: "Could not start WhatsApp session"
      }
    });
  }
}

export async function getSessionQr(req: Request, res: Response): Promise<void> {
  const parsed = sessionParamsSchema.safeParse(req.params);
  if (!parsed.success) {
    sendValidationError(res, parsed.error.issues[0]?.message ?? "Invalid input");
    return;
  }

  const { sessionId } = parsed.data;
  const status = await services.whatsappSessionManager.getSessionStatus(sessionId);
  if (!status) {
    res.status(404).json({
      data: null,
      error: {
        code: "SESSION_NOT_FOUND",
        message: "Session not found"
      }
    });
    return;
  }

  const qr = await services.whatsappSessionManager.getSessionQr(sessionId);

  res.status(200).json({
    data: {
      sessionId,
      qr
    },
    error: null
  });
}

export async function getSessionStatus(
  req: Request,
  res: Response
): Promise<void> {
  const parsed = sessionParamsSchema.safeParse(req.params);
  if (!parsed.success) {
    sendValidationError(res, parsed.error.issues[0]?.message ?? "Invalid input");
    return;
  }

  const { sessionId } = parsed.data;
  const status = await services.whatsappSessionManager.getSessionStatus(sessionId);
  if (!status) {
    res.status(404).json({
      data: null,
      error: {
        code: "SESSION_NOT_FOUND",
        message: "Session not found"
      }
    });
    return;
  }

  res.status(200).json({
    data: {
      sessionId,
      status
    },
    error: null
  });
}

export async function disconnectSession(
  req: Request,
  res: Response
): Promise<void> {
  const parsed = sessionParamsSchema.safeParse(req.params);
  if (!parsed.success) {
    sendValidationError(res, parsed.error.issues[0]?.message ?? "Invalid input");
    return;
  }

  const { sessionId } = parsed.data;
  const session = await services.whatsappSessionManager.disconnectSession(sessionId);
  if (!session) {
    res.status(404).json({
      data: null,
      error: {
        code: "SESSION_NOT_FOUND",
        message: "Session not found"
      }
    });
    return;
  }

  res.status(200).json({
    data: {
      sessionId: session.id,
      status: session.status
    },
    error: null
  });
}
