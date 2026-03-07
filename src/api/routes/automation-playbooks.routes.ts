import { Router } from "express";
import {
  listAutomationPlaybooks,
  setAutomationPlaybook
} from "../controllers/automation-playbooks.controller";

export const automationPlaybooksRoutes = Router();

automationPlaybooksRoutes.get("/playbooks", listAutomationPlaybooks);
automationPlaybooksRoutes.post("/playbooks", setAutomationPlaybook);
