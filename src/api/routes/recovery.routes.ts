import { Router } from "express";
import {
  markRecoveredSale,
  triggerRecovery
} from "../controllers/recovery.controller";

export const recoveryRoutes = Router();

recoveryRoutes.post("/trigger", triggerRecovery);
recoveryRoutes.post("/:recoveryId/mark-sale", markRecoveredSale);
