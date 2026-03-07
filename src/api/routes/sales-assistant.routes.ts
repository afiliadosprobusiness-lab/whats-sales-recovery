import { Router } from "express";
import {
  getSalesAssistantMetrics,
  getSalesAssistantSettings,
  updateSalesAssistantSettings
} from "../controllers/sales-assistant.controller";

export const salesAssistantRoutes = Router();

salesAssistantRoutes.get("/settings", getSalesAssistantSettings);
salesAssistantRoutes.patch("/settings", updateSalesAssistantSettings);
salesAssistantRoutes.get("/metrics", getSalesAssistantMetrics);
