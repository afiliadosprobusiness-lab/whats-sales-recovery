import { Router } from "express";
import {
  getConversationById,
  listConversations
} from "../controllers/conversation.controller";

export const conversationRoutes = Router();

conversationRoutes.get("/", listConversations);
conversationRoutes.get("/:conversationId", getConversationById);
