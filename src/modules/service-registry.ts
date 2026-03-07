import { CampaignRepository } from "./campaigns/campaign.repository";
import { CampaignService } from "./campaigns/campaign.service";
import { ConversationRepository } from "./conversation/conversation.repository";
import { ConversationService } from "./conversation/conversation.service";
import { MessageIngestionService } from "./message-ingestion/message-ingestion.service";
import { RecoveryRepository } from "./recovery/recovery.repository";
import { RecoveryService } from "./recovery/recovery.service";
import { SalesAssistantRepository } from "./sales-assistant/sales-assistant.repository";
import { SalesAssistantService } from "./sales-assistant/sales-assistant.service";
import { WhatsAppSessionManager } from "./whatsapp-session/whatsapp-session.manager";
import { WhatsAppSessionRepository } from "./whatsapp-session/whatsapp-session.repository";

const conversationRepository = new ConversationRepository();
const messageIngestionService = new MessageIngestionService();
const whatsappSessionRepository = new WhatsAppSessionRepository();
const whatsappSessionManager = new WhatsAppSessionManager(
  whatsappSessionRepository,
  messageIngestionService
);
const salesAssistantRepository = new SalesAssistantRepository();
const salesAssistantService = new SalesAssistantService(
  salesAssistantRepository,
  whatsappSessionManager
);
messageIngestionService.setSalesAssistantService(salesAssistantService);
const campaignRepository = new CampaignRepository();
const campaignService = new CampaignService(
  campaignRepository,
  whatsappSessionManager
);
const recoveryRepository = new RecoveryRepository();
const recoveryService = new RecoveryService(
  recoveryRepository,
  whatsappSessionManager
);
const conversationService = new ConversationService(
  conversationRepository,
  recoveryService
);

export const services = {
  campaignService,
  conversationService,
  recoveryService,
  salesAssistantService,
  whatsappSessionManager
};
