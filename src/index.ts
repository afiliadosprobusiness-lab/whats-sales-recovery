import { createServer } from "./server";
import { env } from "./config/env";
import { logger } from "./utils/logger";
import { services } from "./modules/service-registry";

async function bootstrap(): Promise<void> {
  services.conversationService.registerEventHandlers();
  services.recoveryService.registerEventHandlers();
  await services.whatsappSessionManager.restoreSessions();

  const app = createServer();

  app.listen(env.PORT, () => {
    logger.info({ port: env.PORT }, "API server started");
  });
}

bootstrap().catch((error) => {
  logger.error({ error }, "Failed to start application");
  process.exit(1);
});
