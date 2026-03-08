import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const defaultRecoveryTemplate = `Hola 👋
Ayer preguntaste por el producto.

¿Te ayudo a terminar tu pedido?`;

const envBooleanSchema = z
  .string()
  .optional()
  .transform((value) => {
    if (!value) {
      return false;
    }

    return ["1", "true", "yes", "on"].includes(value.trim().toLowerCase());
  });

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  WHATSAPP_SESSION_DATA_PATH: z.string().min(1),
  ABANDONED_THRESHOLD_MINUTES: z.coerce.number().int().positive().default(30),
  IDLE_THRESHOLD_HOURS: z.coerce.number().int().positive().default(24),
  RECOVERY_TEMPLATE_TEXT: z.string().min(1).default(defaultRecoveryTemplate),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).default("info"),
  WHATSAPP_INBOUND_DIAGNOSTIC_MODE: envBooleanSchema,
  OPENAI_API_KEY: z.string().min(1).optional(),
  OPENAI_MODEL: z.string().min(1).default("gpt-4o-mini"),
  OPENAI_BASE_URL: z.string().url().default("https://api.openai.com/v1")
});

export const env = envSchema.parse(process.env);
