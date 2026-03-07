import express, { type Express } from "express";
import pinoHttp from "pino-http";
import { apiRoutes } from "./api/routes";
import { logger } from "./utils/logger";

export function createServer(): Express {
  const app = express();

  app.use(express.json());
  app.use(pinoHttp({ logger }));

  app.get("/health", (_req, res) => {
    res.status(200).json({ ok: true });
  });

  app.use("/api/v1", apiRoutes);

  return app;
}
