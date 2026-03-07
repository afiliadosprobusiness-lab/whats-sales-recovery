import { Router } from "express";
import {
  getAutomationsSettings,
  updateAutomationsSettings
} from "../controllers/settings.controller";

export const settingsRoutes = Router();

settingsRoutes.get("/automations", getAutomationsSettings);
settingsRoutes.post("/automations", updateAutomationsSettings);
