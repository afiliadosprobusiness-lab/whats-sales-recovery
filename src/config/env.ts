import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const defaultRecoveryTemplate = `Hola 👋
Ayer preguntaste por el producto.

¿Te ayudo a terminar tu pedido?`;

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  WHATSAPP_SESSION_DATA_PATH: z.string().min(1),
  IDLE_THRESHOLD_HOURS: z.coerce.number().int().positive().default(24),
  RECOVERY_TEMPLATE_TEXT: z.string().min(1).default(defaultRecoveryTemplate),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).default("info")
});

export const env = envSchema.parse(process.env);
