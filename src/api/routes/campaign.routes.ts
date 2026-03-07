import express, { Router } from "express";
import {
  getCampaignMetrics,
  importCampaignCsv
} from "../controllers/campaign.controller";

export const campaignRoutes = Router();

campaignRoutes.post(
  "/import",
  express.text({
    type: ["text/csv", "text/plain", "application/csv"]
  }),
  importCampaignCsv
);
campaignRoutes.get("/:campaignId/metrics", getCampaignMetrics);
