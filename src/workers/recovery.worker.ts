import { services } from "../modules/service-registry";
import { logger } from "../utils/logger";

const RECOVERY_POLL_INTERVAL_MS = 60 * 1000;

async function runRecoveryWorker(): Promise<void> {
  services.recoveryService.registerEventHandlers();
  await services.whatsappSessionManager.restoreSessions();

  logger.info("Recovery sender worker started");

  let running = false;

  const processScheduled = async (): Promise<void> => {
    if (running) {
      return;
    }

    running = true;
    try {
      const result = await services.recoveryService.processScheduledAttempts(100);
      if (result.processed > 0) {
        logger.info(result, "Processed scheduled recovery attempts");
      }
    } catch (error) {
      logger.error({ error }, "Recovery sender cycle failed");
    } finally {
      running = false;
    }
  };

  await processScheduled();
  setInterval(() => {
    void processScheduled();
  }, RECOVERY_POLL_INTERVAL_MS);
}

runRecoveryWorker().catch((error) => {
  logger.error({ error }, "Recovery worker crashed");
  process.exit(1);
});
