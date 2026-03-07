import { createServer } from "./server";
import { env } from "./config/env";
import { logger } from "./utils/logger";
import { services } from "./modules/service-registry";

async function startApiServer(): Promise<void> {
  const app = createServer();

  await new Promise<void>((resolve, reject) => {
    const server = app.listen(env.PORT, () => {
      logger.info({ port: env.PORT }, "API server started");
      resolve();
    });

    server.on("error", reject);
  });
}

async function bootstrap(): Promise<void> {
  services.campaignService.registerEventHandlers();
  services.conversationService.registerEventHandlers();
  services.recoveryService.registerEventHandlers();
  await startApiServer();
  await services.whatsappSessionManager.restoreSessions();
}

bootstrap().catch((error) => {
  logger.error({ error }, "Failed to start application");
  process.exit(1);
});
