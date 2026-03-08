# PROJECT_CONTEXT - RecuperaVentas

## Project objective
Validate product value quickly by connecting WhatsApp, ingesting messages, detecting inactivity, and sending automated recovery follow-ups.

## Quick system description
Backend modular monolith (Node.js + TypeScript) using Baileys (`@whiskeysockets/baileys`) sessions plus two Next.js frontends:
- `apps/landing` for public marketing
- `apps/dashboard` for authenticated SaaS onboarding and operational tracking
- `apps/landing` uses TailwindCSS with reusable SaaS landing sections.
- `apps/dashboard` uses App Router + TailwindCSS with JWT cookie authentication.

## Current focus (Sprint 4)
- SaaS auth bootstrap: `/register` + `/login` with bcrypt password hashing and JWT session cookie.
- Dashboard root (`/`) redirect logic:
  - guest -> `/register`
  - authenticated user -> `/connect-whatsapp`
- MVP onboarding: workspace creation + WhatsApp connection via QR in dashboard.
- Dashboard connect screen uses `qrcode.react` to render scannable WhatsApp QR images.
- Dashboard sidebar includes a visible `Connect WhatsApp` entry and a small workspace connection indicator (`Connected`/`Not connected`).
- WhatsApp session connection and restore with workspace-level in-memory socket reuse.
- Incoming message ingestion.
- Contact/conversation/message persistence.
- Idle detector every 5 minutes.
- Abandoned detector every 5 minutes for purchase-intent conversations.
- Recovery attempt scheduling and automatic message sending.
- Bulk campaign CSV import (`name,phone`) and campaign scheduling.
- Sequential campaign message sending with randomized 5-10s pacing.
- Campaign reply tracking and campaign metrics.
- Sales-assistant auto-replies focused on lead qualification and closing.
- Workspace chatbot settings (`chatbot_enabled`, style, product context).
- Workspace AI chatbot router webhook setting (`ai_router_webhook_url`).
- Human takeover stop condition and 2-4s assistant pacing.
- Sales assistant dashboard counters.
- Reply detection for sent recovery attempts.
- Recovered sale marking with amount and currency.
- Frontend visibility for recovered sales and conversations.
- Revenue intelligence scoring and customer-state classification every 10 minutes.
- Revenue summary and customer-state listing endpoints.
- Smart follow-up sequencer with 4-step delayed automation and stop conditions.
- Offer optimizer objection detection with recommendation events and conversion tracking.
- Deal probability scoring engine with lead states and orchestration events.
- Conversation heatmap stage analytics with drop-off metrics and insight generation.
- Conversation playbook engine with high-performing strategy detection and recommendations.
- Auto revenue reports with daily/weekly/monthly business performance summaries.
- Workspace automation settings for configurable n8n webhook endpoints.
- Async n8n webhook triggers on inbound lead interactions (quick/follow-up/final recovery).
- Async AI chatbot webhook forwarding on inbound WhatsApp messages.
- Playbook-based automation controls in dashboard (`sales_recovery` enable/disable).

## Architecture summary
- API + session runtime in one service.
- Dashboard app includes local auth route handlers:
  - `POST /api/auth/register`
  - `POST /api/auth/login`
  - `POST /api/auth/logout`
- Dashboard app includes local settings proxy handlers:
  - `GET /api/settings/ai-chatbot`
  - `POST /api/settings/ai-chatbot`
- Dashboard auth uses signed JWT in `httpOnly` cookie (`rv_auth_token`).
- Dashboard user credentials are persisted for MVP in JSON auth storage (`apps/dashboard/.data/users.json` in local dev, `/tmp/recuperaventas-dashboard/users.json` by default in production serverless) with bcrypt hashes.
- PostgreSQL for domain data.
- BullMQ/Redis scaffolded for later async jobs.
- In-process event bus for module communication.
- Backend CORS allowlist enabled for Vercel dashboard/landing and local development origin.
- Baileys session startup uses per-workspace auth folders under `sessions/{workspace_id}`.
- Baileys startup resolves and uses the latest WhatsApp Web protocol version (`fetchLatestBaileysVersion`) plus explicit browser metadata.
- WhatsApp socket instances are keyed by workspace and reused across repeated start requests (one socket per workspace).
- No Chromium/Puppeteer dependency in runtime.
- WhatsApp session reconnects automatically after `connection.update.close` unless reason is `DisconnectReason.loggedOut`.
- WhatsApp session lifecycle logs `authenticated`, QR generation, `connected`, `disconnected`, last disconnect reason/status code, and incoming messages for diagnostics.
- Campaign worker sends one scheduled campaign message at a time and waits 5-10 seconds before the next send.
- Sales assistant executes in-process on `message_received` pipeline and can use OpenAI API with fallback templates.
- Sales assistant API surface includes settings management and dashboard counters by workspace.
- Abandoned detector marks `purchase_intent` and `abandoned` states and emits `conversation_abandoned`.
- Conversation metrics endpoint exposes abandonment recovery counters.
- Revenue intelligence module computes conversion probability and publishes customer-state events.
- Follow-up sequencer starts from abandonment/reactivation/manual triggers and sends delayed steps.
- Offer optimizer detects objections from inbound text and emits `offer_recommended` for sales-assistant responses.
- Deal probability engine computes 0-1 purchase score and emits lead-state events for assistant, offer optimizer, and follow-up flows.
- Conversation heatmap worker computes stage-level drop-off analytics every 30 minutes and emits `heatmap_insight_generated`.
- Revenue-intelligence consumes `heatmap_insight_generated` and records high drop-off insights in `domain_event_logs`.
- Playbook engine worker computes conversion rates by response strategy every 1 hour and emits `playbook_high_performance`.
- Sales assistant consumes `playbook_high_performance` and prioritizes high-performing playbooks.
- Revenue reports worker computes period revenue metrics every 24 hours and emits report + insight events.
- Settings API exposes workspace-level n8n webhook configuration through `/settings/automations`.
- Settings API exposes AI chatbot webhook configuration through `/settings/ai-chatbot` (dashboard uses `/api/settings/ai-chatbot` compatibility alias).
- n8n webhook dispatch is async/non-blocking and logs failures without breaking ingestion flow.
- AI chatbot webhook dispatch is async/non-blocking and logs failures without breaking ingestion flow.
- Automation playbook API controls webhook execution through `/automations/playbooks`.
- API not-found/unhandled failures under `/api/*` are normalized to JSON error envelopes.

## Main entities (active now)
- `workspaces`
- `whatsapp_sessions`
- `contacts`
- `conversations`
- `messages`
- `recovery_attempts`
- `sale_outcomes`
- `domain_event_logs`
- `campaigns`
- `campaign_contacts`
- `campaign_messages`
- `workspace_settings`
- `chatbot_logs`
- `customer_revenue_state`
- `followup_sequences`
- `followup_sequence_steps`
- `offer_events`
- `deal_probability`
- `conversation_stage_metrics`
- `conversation_playbooks`
- `revenue_reports`
- `automation_settings`
- `automation_playbooks`

## Backlog events preserved
- `message_received`
- `offer_recommended`
- `conversation_idle`
- `conversation_abandoned`
- `manual_followup_trigger`
- `customer_ready_to_buy`
- `customer_lost`
- `customer_reactivatable`
- `customer_ready_to_close`
- `customer_warm_lead`
- `customer_cold_lead`
- `heatmap_insight_generated`
- `playbook_high_performance`
- `revenue_report_generated`
- `revenue_report_insight_generated`
- `recovery_triggered`
- `recovery_sent`
- `recovery_failed`
- `customer_replied`
- `sale_recovered`

## Scope guardrails
- Keep WhatsApp-only integration.
- Keep implementation simple and modular.
- Keep AI usage limited to sales-assistant reply generation for conversion-oriented chats.
- Keep onboarding single-workspace-oriented for MVP.

## Frontend routes
- Landing (`apps/landing`)
  - `/` (marketing page)
  - `Navbar`
  - `HeroSection`
  - `ProblemSection`
  - `SolutionSection`
  - `ResultsSection`
  - `ProductPreview`
  - `HowItWorks`
  - `CTASection`
  - `Footer`
- Dashboard (`apps/dashboard`)
  - `/`
    - Auth-aware entrypoint (guest -> `/register`, authenticated -> `/connect-whatsapp`)
  - `/register`
  - `/login`
  - `/dashboard`
  - `/connect-whatsapp`
    - Existing onboarding flow with QR scan, status labels (`Disconnected`, `Waiting for QR scan`, `Connected`), and reconnect action.
  - `/conversations`
  - `/conversations/:id`
  - `/recovery`
  - `/automations`
    - Enable/disable automation playbooks and monitor running automations.
  - `/analytics`
  - `/settings`
    - Workspace settings including AI chatbot webhook URL.
