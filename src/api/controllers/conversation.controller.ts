import { type Request, type Response } from "express";
import { z } from "zod";
import { services } from "../../modules/service-registry";
import { logger } from "../../utils/logger";

const statusSchema = z.enum(["open", "idle", "closed"]);

const listQuerySchema = z.object({
  workspaceId: z.string().uuid(),
  status: statusSchema.optional(),
  limit: z.coerce.number().int().positive().max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0)
});

const detailParamsSchema = z.object({
  conversationId: z.string().uuid()
});

const detailQuerySchema = z.object({
  workspaceId: z.string().uuid(),
  messageLimit: z.coerce.number().int().positive().max(200).default(100)
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

export async function listConversations(
  req: Request,
  res: Response
): Promise<void> {
  const parsed = listQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    sendValidationError(res, parsed.error.issues[0]?.message ?? "Invalid input");
    return;
  }

  try {
    const { workspaceId, status, limit, offset } = parsed.data;
    const items = await services.conversationService.listConversations({
      workspaceId,
      status: status ?? null,
      limit,
      offset
    });

    res.status(200).json({
      data: {
        items,
        pagination: {
          limit,
          offset
        }
      },
      error: null
    });
  } catch (error) {
    logger.error({ error }, "Failed to list conversations");
    res.status(500).json({
      data: null,
      error: {
        code: "INTERNAL_ERROR",
        message: "Could not list conversations"
      }
    });
  }
}

export async function getConversationById(
  req: Request,
  res: Response
): Promise<void> {
  const parsedParams = detailParamsSchema.safeParse(req.params);
  if (!parsedParams.success) {
    sendValidationError(
      res,
      parsedParams.error.issues[0]?.message ?? "Invalid params"
    );
    return;
  }

  const parsedQuery = detailQuerySchema.safeParse(req.query);
  if (!parsedQuery.success) {
    sendValidationError(
      res,
      parsedQuery.error.issues[0]?.message ?? "Invalid query"
    );
    return;
  }

  const { conversationId } = parsedParams.data;
  const { workspaceId, messageLimit } = parsedQuery.data;

  try {
    const result = await services.conversationService.getConversationById({
      workspaceId,
      conversationId,
      messageLimit
    });

    if (!result) {
      res.status(404).json({
        data: null,
        error: {
          code: "CONVERSATION_NOT_FOUND",
          message: "Conversation not found"
        }
      });
      return;
    }

    res.status(200).json({
      data: result,
      error: null
    });
  } catch (error) {
    logger.error({ error }, "Failed to get conversation by id");
    res.status(500).json({
      data: null,
      error: {
        code: "INTERNAL_ERROR",
        message: "Could not load conversation"
      }
    });
  }
}
