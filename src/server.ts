import express, { type Express } from "express";
import cors, { type CorsOptions } from "cors";
import pinoHttp from "pino-http";
import { apiRoutes } from "./api/routes";
import { automationPlaybooksRoutes } from "./api/routes/automation-playbooks.routes";
import { logger } from "./utils/logger";

const corsOptions: CorsOptions = {
  origin: [
    "https://recuperaventas-dashboard.vercel.app",
    "https://recuperaventas-landing.vercel.app",
    "http://localhost:3000"
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true
};

export function createServer(): Express {
  const app = express();

  app.use(cors(corsOptions));
  app.options("*", cors(corsOptions));
  app.use(express.json());
  app.use(pinoHttp({ logger }));

  app.get("/health", (_req, res) => {
    res.status(200).json({ ok: true });
  });

  app.use("/api/automations", automationPlaybooksRoutes);
  app.use("/api/v1", apiRoutes);

  return app;
}
