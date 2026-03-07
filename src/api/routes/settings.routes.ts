import { Router } from "express";
import {
  getAiChatbotSettings,
  getAutomationsSettings,
  updateAiChatbotSettings,
  updateAutomationsSettings
} from "../controllers/settings.controller";

export const settingsRoutes = Router();

settingsRoutes.get("/automations", getAutomationsSettings);
settingsRoutes.post("/automations", updateAutomationsSettings);
settingsRoutes.get("/ai-chatbot", getAiChatbotSettings);
settingsRoutes.post("/ai-chatbot", updateAiChatbotSettings);
