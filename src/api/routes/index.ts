import { Router } from "express";
import { sessionRoutes } from "./session.routes";
import { conversationRoutes } from "./conversation.routes";
import { recoveryRoutes } from "./recovery.routes";
import { onboardingRoutes } from "./onboarding.routes";
import { campaignRoutes } from "./campaign.routes";
import { salesAssistantRoutes } from "./sales-assistant.routes";

export const apiRoutes = Router();

apiRoutes.use("/", onboardingRoutes);
apiRoutes.use("/sessions/whatsapp", sessionRoutes);
apiRoutes.use("/conversations", conversationRoutes);
apiRoutes.use("/recoveries", recoveryRoutes);
apiRoutes.use("/campaigns", campaignRoutes);
apiRoutes.use("/sales-assistant", salesAssistantRoutes);
