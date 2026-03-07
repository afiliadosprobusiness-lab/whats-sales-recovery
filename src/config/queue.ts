import { Queue } from "bullmq";
import { env } from "./env";

export const queueConnection = {
  url: env.REDIS_URL
};

export const idleDetectorQueue = new Queue("idle-detector", {
  connection: queueConnection
});

export const recoveryQueue = new Queue("recovery", {
  connection: queueConnection
});
