import { services } from "../modules/service-registry";
import { logger } from "../utils/logger";

const EMPTY_QUEUE_WAIT_MS = 1000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runCampaignWorker(): Promise<void> {
  services.campaignService.registerEventHandlers();
  await services.whatsappSessionManager.restoreSessions();

  logger.info("Campaign sender worker started");

  while (true) {
    try {
      const result = await services.campaignService.processNextScheduledMessage();
      if (!result.processed) {
        await sleep(EMPTY_QUEUE_WAIT_MS);
        continue;
      }

      const delayMs = services.campaignService.getNextSendDelayMs();
      logger.info(
        {
          campaignId: result.campaignId,
          delayMs
        },
        "Waiting before next campaign message"
      );
      await sleep(delayMs);
    } catch (error) {
      logger.error({ error }, "Campaign worker cycle failed");
      await sleep(EMPTY_QUEUE_WAIT_MS);
    }
  }
}

runCampaignWorker().catch((error) => {
  logger.error({ error }, "Campaign worker crashed");
  process.exit(1);
});
