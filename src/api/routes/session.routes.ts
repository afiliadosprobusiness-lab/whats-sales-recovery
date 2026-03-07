import { Router } from "express";
import {
  disconnectSession,
  getSessionQr,
  getSessionStatus,
  startSession
} from "../controllers/session.controller";

export const sessionRoutes = Router();

sessionRoutes.post("/start", startSession);
sessionRoutes.get("/:sessionId/qr", getSessionQr);
sessionRoutes.get("/:sessionId/status", getSessionStatus);
sessionRoutes.post("/:sessionId/disconnect", disconnectSession);
