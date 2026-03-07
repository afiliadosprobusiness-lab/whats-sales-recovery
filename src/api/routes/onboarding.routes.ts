import { Router } from "express";
import {
  createWorkspace,
  getWhatsappSessionStatus,
  startWhatsappSession
} from "../controllers/onboarding.controller";

export const onboardingRoutes = Router();

onboardingRoutes.post("/workspaces", createWorkspace);
onboardingRoutes.post("/whatsapp/session/start", startWhatsappSession);
onboardingRoutes.get("/whatsapp/session/status", getWhatsappSessionStatus);
