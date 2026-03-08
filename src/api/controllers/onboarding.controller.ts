import { type Request, type Response } from "express";
import { z } from "zod";
import { services } from "../../modules/service-registry";
import { logger } from "../../utils/logger";

const createWorkspaceBodySchema = z.object({
  name: z.string().trim().min(1).max(120)
});

const workspaceIdBodySchema = z.object({
  workspace_id: z.string().uuid()
});

const workspaceIdQuerySchema = z.object({
  workspace_id: z.string().uuid()
});

function sendValidationError(res: Response, message: string): void {
  res.status(400).json({
    error: {
      code: "VALIDATION_ERROR",
      message
    }
  });
}

export async function createWorkspace(
  req: Request,
  res: Response
): Promise<void> {
  const parsed = createWorkspaceBodySchema.safeParse(req.body);
  if (!parsed.success) {
    sendValidationError(res, parsed.error.issues[0]?.message ?? "Invalid input");
    return;
  }

  try {
    const workspace = await services.whatsappSessionManager.createWorkspace(
      parsed.data.name
    );

    res.status(201).json({
      workspace_id: workspace.id
    });
  } catch (error) {
    logger.error({ error }, "Failed to create workspace");
    res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: "Could not create workspace"
      }
    });
  }
}

export async function startWhatsappSession(
  req: Request,
  res: Response
): Promise<void> {
  const parsed = workspaceIdBodySchema.safeParse(req.body);
  if (!parsed.success) {
    sendValidationError(res, parsed.error.issues[0]?.message ?? "Invalid input");
    return;
  }

  const workspaceId = parsed.data.workspace_id;

  try {
    const qr = await services.whatsappSessionManager.startSessionAndGetQr(
      workspaceId
    );

    res.status(200).json({
      qr: qr ?? ""
    });
  } catch (error) {
    logger.error({ error, workspaceId }, "Failed to start WhatsApp session");
    res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: "Could not start WhatsApp session"
      }
    });
  }
}

export async function getWhatsappSessionStatus(
  req: Request,
  res: Response
): Promise<void> {
  const parsed = workspaceIdQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    sendValidationError(res, parsed.error.issues[0]?.message ?? "Invalid query");
    return;
  }

  const workspaceId = parsed.data.workspace_id;

  try {
    const connected = await services.whatsappSessionManager.isWorkspaceConnected(
      workspaceId
    );

    res.status(200).json({
      connected
    });
  } catch (error) {
    logger.error({ error, workspaceId }, "Failed to get WhatsApp session status");
    res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: "Could not get session status"
      }
    });
  }
}

export async function disconnectWhatsappSession(
  req: Request,
  res: Response
): Promise<void> {
  const parsed = workspaceIdBodySchema.safeParse(req.body);
  if (!parsed.success) {
    sendValidationError(res, parsed.error.issues[0]?.message ?? "Invalid input");
    return;
  }

  const workspaceId = parsed.data.workspace_id;

  try {
    logger.info({ workspaceId }, "WhatsApp disconnect requested");

    const session =
      await services.whatsappSessionManager.disconnectWorkspaceSession(
        workspaceId
      );

    if (!session) {
      res.status(404).json({
        error: {
          code: "SESSION_NOT_FOUND",
          message: "No WhatsApp session found for workspace"
        }
      });
      return;
    }

    res.status(200).json({
      success: true,
      workspace_id: session.workspaceId,
      session_id: session.id,
      status: session.status,
      auth_session_files: "preserved"
    });
  } catch (error) {
    logger.error({ error, workspaceId }, "Failed to disconnect WhatsApp session");
    res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: "Could not disconnect WhatsApp session"
      }
    });
  }
}
