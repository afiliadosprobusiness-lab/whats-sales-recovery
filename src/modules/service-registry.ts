import { ConversationRepository } from "./conversation/conversation.repository";
import { ConversationService } from "./conversation/conversation.service";
import { MessageIngestionService } from "./message-ingestion/message-ingestion.service";
import { RecoveryRepository } from "./recovery/recovery.repository";
import { RecoveryService } from "./recovery/recovery.service";
import { WhatsAppSessionManager } from "./whatsapp-session/whatsapp-session.manager";
import { WhatsAppSessionRepository } from "./whatsapp-session/whatsapp-session.repository";

const conversationRepository = new ConversationRepository();
const messageIngestionService = new MessageIngestionService();
const whatsappSessionRepository = new WhatsAppSessionRepository();
const whatsappSessionManager = new WhatsAppSessionManager(
  whatsappSessionRepository,
  messageIngestionService
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
  conversationService,
  recoveryService,
  whatsappSessionManager
};
