import { env } from "../config/env";
import { services } from "../modules/service-registry";
import { logger } from "../utils/logger";

const IDLE_SCAN_INTERVAL_MS = 5 * 60 * 1000;

async function runIdleDetectorWorker(): Promise<void> {
  services.recoveryService.registerEventHandlers();

  logger.info(
    { idleThresholdHours: env.IDLE_THRESHOLD_HOURS },
    "Idle detector worker started"
  );

  let running = false;

  const scan = async (): Promise<void> => {
    if (running) {
      return;
    }

    running = true;
    try {
      const detected = await services.recoveryService.detectAndEmitIdleConversations({
        idleThresholdHours: env.IDLE_THRESHOLD_HOURS,
        limit: 100
      });

      if (detected > 0) {
        logger.info({ detected }, "Idle conversations detected");
      }
    } catch (error) {
      logger.error({ error }, "Idle detector cycle failed");
    } finally {
      running = false;
    }
  };

  await scan();
  setInterval(() => {
    void scan();
  }, IDLE_SCAN_INTERVAL_MS);
}

runIdleDetectorWorker().catch((error) => {
  logger.error({ error }, "Idle detector worker crashed");
  process.exit(1);
});
