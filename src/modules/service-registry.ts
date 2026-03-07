import { AbandonedDetectorRepository } from "./abandoned-detector/abandoned-detector.repository";
import { AbandonedDetectorService } from "./abandoned-detector/abandoned-detector.service";
import { AutomationPlaybooksRepository } from "./automation-playbooks/automation-playbooks.repository";
import { AutomationPlaybooksService } from "./automation-playbooks/automation-playbooks.service";
import { AutomationSettingsRepository } from "./automation-settings/automation-settings.repository";
import { AutomationSettingsService } from "./automation-settings/automation-settings.service";
import { CampaignRepository } from "./campaigns/campaign.repository";
import { CampaignService } from "./campaigns/campaign.service";
import { ConversationRepository } from "./conversation/conversation.repository";
import { ConversationService } from "./conversation/conversation.service";
import { ConversationHeatmapRepository } from "./conversation-heatmap/conversation-heatmap.repository";
import { ConversationHeatmapService } from "./conversation-heatmap/conversation-heatmap.service";
import { DealProbabilityRepository } from "./deal-probability/deal-probability.repository";
import { DealProbabilityService } from "./deal-probability/deal-probability.service";
import { FollowupSequencerRepository } from "./followup-sequencer/followup-sequencer.repository";
import { FollowupSequencerService } from "./followup-sequencer/followup-sequencer.service";
import { MessageIngestionService } from "./message-ingestion/message-ingestion.service";
import { OfferOptimizerRepository } from "./offer-optimizer/offer-optimizer.repository";
import { OfferOptimizerService } from "./offer-optimizer/offer-optimizer.service";
import { PlaybookEngineRepository } from "./playbook-engine/playbook-engine.repository";
import { PlaybookEngineService } from "./playbook-engine/playbook-engine.service";
import { RecoveryRepository } from "./recovery/recovery.repository";
import { RecoveryService } from "./recovery/recovery.service";
import { RevenueReportsRepository } from "./revenue-reports/revenue-reports.repository";
import { RevenueReportsService } from "./revenue-reports/revenue-reports.service";
import { RevenueIntelligenceRepository } from "./revenue-intelligence/revenue-intelligence.repository";
import { RevenueIntelligenceService } from "./revenue-intelligence/revenue-intelligence.service";
import { SalesAssistantRepository } from "./sales-assistant/sales-assistant.repository";
import { SalesAssistantService } from "./sales-assistant/sales-assistant.service";
import { WhatsAppSessionManager } from "./whatsapp-session/whatsapp-session.manager";
import { WhatsAppSessionRepository } from "./whatsapp-session/whatsapp-session.repository";
import { N8nAutomationsService } from "../services/n8n-automations";
import { N8nChatbotService } from "../services/n8n-chatbot";

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
const abandonedDetectorRepository = new AbandonedDetectorRepository();
const abandonedDetectorService = new AbandonedDetectorService(
  abandonedDetectorRepository
);
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
const followupSequencerRepository = new FollowupSequencerRepository();
const followupSequencerService = new FollowupSequencerService(
  followupSequencerRepository,
  salesAssistantService
);
const automationSettingsRepository = new AutomationSettingsRepository();
const automationSettingsService = new AutomationSettingsService(
  automationSettingsRepository
);
const automationPlaybooksRepository = new AutomationPlaybooksRepository();
const automationPlaybooksService = new AutomationPlaybooksService(
  automationPlaybooksRepository
);
const n8nAutomationsService = new N8nAutomationsService(
  automationSettingsService,
  automationPlaybooksService
);
const n8nChatbotService = new N8nChatbotService(automationSettingsService);
const offerOptimizerRepository = new OfferOptimizerRepository();
const offerOptimizerService = new OfferOptimizerService(offerOptimizerRepository);
const dealProbabilityRepository = new DealProbabilityRepository();
const dealProbabilityService = new DealProbabilityService(dealProbabilityRepository);
const revenueIntelligenceRepository = new RevenueIntelligenceRepository();
const revenueIntelligenceService = new RevenueIntelligenceService(
  revenueIntelligenceRepository
);
const conversationHeatmapRepository = new ConversationHeatmapRepository();
const conversationHeatmapService = new ConversationHeatmapService(
  conversationHeatmapRepository
);
const playbookEngineRepository = new PlaybookEngineRepository();
const playbookEngineService = new PlaybookEngineService(playbookEngineRepository);
const revenueReportsRepository = new RevenueReportsRepository();
const revenueReportsService = new RevenueReportsService(revenueReportsRepository);
const conversationService = new ConversationService(
  conversationRepository,
  recoveryService,
  abandonedDetectorService,
  n8nAutomationsService,
  n8nChatbotService
);

export const services = {
  abandonedDetectorService,
  automationPlaybooksService,
  automationSettingsService,
  campaignService,
  conversationService,
  conversationHeatmapService,
  dealProbabilityService,
  followupSequencerService,
  offerOptimizerService,
  playbookEngineService,
  recoveryService,
  revenueReportsService,
  revenueIntelligenceService,
  salesAssistantService,
  n8nAutomationsService,
  n8nChatbotService,
  whatsappSessionManager
};
