import express, {
  type Express,
  type NextFunction,
  type Request,
  type Response
} from "express";
import cors, { type CorsOptions } from "cors";
import pinoHttp from "pino-http";
import { apiRoutes } from "./api/routes";
import { automationPlaybooksRoutes } from "./api/routes/automation-playbooks.routes";
import { settingsRoutes } from "./api/routes/settings.routes";
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
  app.use("/api/settings", settingsRoutes);
  app.use("/api/v1", apiRoutes);
  app.use("/api", (req, res) => {
    res.status(404).json({
      data: null,
      error: {
        code: "NOT_FOUND",
        message: `Route not found: ${req.method} ${req.originalUrl}`
      }
    });
  });
  app.use(
    (
      error: unknown,
      req: Request,
      res: Response,
      next: NextFunction
    ): void => {
      if (res.headersSent) {
        next(error);
        return;
      }

      if (!req.originalUrl.startsWith("/api")) {
        next(error);
        return;
      }

      const isInvalidJson =
        error instanceof SyntaxError &&
        typeof error.message === "string" &&
        error.message.toLowerCase().includes("json");

      if (isInvalidJson) {
        res.status(400).json({
          data: null,
          error: {
            code: "INVALID_JSON",
            message: "Request body must be valid JSON"
          }
        });
        return;
      }

      logger.error({ error, path: req.originalUrl }, "Unhandled API error");
      res.status(500).json({
        data: null,
        error: {
          code: "INTERNAL_ERROR",
          message: "Internal server error"
        }
      });
    }
  );

  return app;
}
