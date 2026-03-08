# RecuperaVentas - System Context (MVP)

## 1) Product objective
Recover lost WhatsApp sales by detecting inactive conversations and sending automated follow-up messages.

## 2) MVP scope
- In scope:
  - Connect WhatsApp account via QR.
  - Ingest incoming messages from session listeners.
  - Track contacts and conversations.
  - Import bulk CSV contact lists for recovery campaigns.
  - Send campaign recovery messages in paced sequential mode.
  - Track replies from campaign contacts.
  - Respond with AI-assisted sales-closing messages on inbound WhatsApp chats.
  - Qualify leads automatically and guide users toward purchase confirmation.
  - Stop bot responses on human takeover, closed conversations, or opt-out contacts.
  - Detect idle conversations and schedule recovery attempts.
  - Send automated recovery message.
- Detect customer replies to sent recovery messages.
- Mark recovered sales and persist recovered amount.
- Analyze conversations and recovery outcomes to classify revenue opportunity states.
- Execute multi-step follow-up sequences for prospects that stop responding.
- Out of scope:
  - Advanced AI.
  - Multi-channel messaging.
  - Enterprise analytics/data warehouse.

## 3) Domain model

### Core entities
- Workspace: tenant owner of all data.
- WhatsAppSession: WhatsApp Web connection state.
- Contact: customer identified by phone.
- Conversation: thread between workspace and contact.
- Message: inbound/outbound message persisted with provider id.
- RecoveryAttempt: automated follow-up attempt after inactivity.
- SaleOutcome: recovered sale record linked to recovery attempt.
- Campaign: bulk recovery execution unit.
- CampaignContact: per-contact delivery/reply status for campaign.
- CampaignMessage: outbound attempt linked to campaign contact.
- WorkspaceSettings: workspace-level chatbot configuration and sales style.
- AutomationSettings: workspace-level n8n webhook endpoints, including AI router webhook URL.
- AutomationPlaybook: workspace-level enablement state for automation bundles.
- ChatbotLog: assistant customer/bot exchange log for audit and metrics.
- OfferEvent: objection detection and optimized offer recommendation record.
- DealProbability: conversation-level purchase probability score and lead state.
- DomainEventLog: immutable event log for audit and tracing.

### Domain events
- Active:
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

## 4) Data model (tables)

### Sprint 1 + Sprint 2 operational tables
- `workspaces`
- `whatsapp_sessions`
- `contacts`
- `conversations`
- `messages`
- `recovery_attempts`
- `domain_event_logs`

### Sprint 3 operational tables
- `sale_outcomes`

### Sprint 4 operational tables
- `campaigns`
- `campaign_contacts`
- `campaign_messages`
- `workspace_settings`
- `chatbot_logs`

### Sprint 6 operational tables
- `customer_revenue_state`

### Sprint 7 operational tables
- `followup_sequences`
- `followup_sequence_steps`

### Sprint 8 operational tables
- `offer_events`

### Sprint 9 operational tables
- `deal_probability`

### Sprint 10 operational tables
- `conversation_stage_metrics`

### Sprint 11 operational tables
- `conversation_playbooks`

### Sprint 12 operational tables
- `revenue_reports`

### Sprint 13 operational tables
- `automation_settings`

### Sprint 14 operational tables
- `automation_playbooks`

### Future sprint tables (already scaffolded)
- `templates`

## 5) Main flows

### Flow Auth: SaaS authentication and session bootstrap
1. User opens dashboard entry route `/`.
2. If auth cookie (`rv_auth_token`) is missing or invalid, system redirects to `/register`.
3. Register flow (`/register`) stores user with bcrypt-hashed password and returns JWT.
4. Login flow (`/login`) validates bcrypt password hash and returns JWT.
5. JWT is persisted in an `httpOnly` cookie for protected dashboard routes.
6. Authenticated users can access `/dashboard`, `/connect-whatsapp`, `/conversations`, `/recovery`, `/automations`, `/analytics`, and `/settings`.
7. Landing CTA (`Connect my WhatsApp`) routes to dashboard entry so redirect logic decides:
   - guest -> `/register`
   - authenticated user -> `/connect-whatsapp`

### Flow A: WhatsApp session connection
1. User creates workspace via onboarding endpoint.
2. User requests `startSession(workspaceId)`.
3. System creates or reuses `whatsapp_sessions` record.
4. Baileys socket emits QR.
5. User scans QR and session becomes connected.
6. Session state is persisted and can be restored after restart.

### Flow B: Message ingestion
1. Active Baileys socket receives `messages.upsert`.
2. Message ingestion normalizes payload.
3. Domain event `message_received` is emitted.
4. Conversation tracker consumes event and persists contact/conversation/message.

### Flow C: Conversation tracking
1. Contact is created if phone does not exist.
2. Open conversation is reused or created.
3. Message is inserted idempotently by `provider_message_id`.
4. Conversation timestamp is updated:
   - inbound -> `last_customer_message_at`
   - outbound -> `last_business_message_at`

### Flow D: Idle detection and recovery automation
1. Idle detector worker runs every 5 minutes.
2. Finds conversations where:
   - `status = open`
   - `last_customer_message_at` is not null
   - `last_business_message_at > last_customer_message_at`
   - inactivity over `IDLE_THRESHOLD_HOURS` (default 24h)
3. Marks conversation as `idle`.
4. Emits `conversation_idle`.
5. Recovery engine validates eligibility:
   - conversation is not closed
   - no recovery attempt in last 48h
   - contact is not opted out
6. Creates `recovery_attempts` with `status = scheduled`.
7. Recovery sender worker polls scheduled attempts and sends WhatsApp follow-up.
8. Updates attempt status to `sent` or `failed`.
9. Emits `recovery_triggered`, `recovery_sent`, `recovery_failed`.

### Flow E: Abandoned intent detection and recovery automation
1. Inbound customer message is stored in conversation.
2. Intent classifier checks keywords (`precio`, `cuanto`, `costo`, `delivery`, `envio`, `disponible`, `tiene`, `stock`).
3. If matched, conversation is marked `purchase_intent = true`.
4. Abandoned detector worker runs every 5 minutes.
5. Worker scans conversations where:
   - `purchase_intent = true`
   - `abandoned = false`
   - `status != closed`
   - `last_customer_message_at` exceeds `ABANDONED_THRESHOLD_MINUTES`
   - no `sale_outcomes` exists for conversation
6. Worker marks conversation `abandoned = true`, sets `abandoned_at`, and emits `conversation_abandoned`.
7. Recovery engine consumes `conversation_abandoned` and schedules a recovery attempt using existing eligibility guards.

### Flow F: Reply detection and recovered sale tracking
1. Customer replies after recovery message was sent.
2. System finds latest recovery attempt with `status = sent` for that conversation.
3. System updates attempt to `status = replied`, sets `replied_at = now`.
4. Emits `customer_replied`.
5. Seller confirms sale via `POST /recoveries/{recoveryId}/mark-sale`.
6. System creates `sale_outcomes` record.
7. System updates recovery attempt to `status = recovered`.
8. System marks conversation as `closed`.
9. Emits `sale_recovered`.

### Flow G: Bulk campaign import and sending
1. User imports CSV via `POST /campaigns/import`.
2. System creates `campaigns` record and upserts contacts.
3. System inserts `campaign_contacts` and `campaign_messages` in `scheduled`.
4. Campaign worker claims one scheduled message at a time.
5. Message is sent through existing `whatsappSession.sendMessage`.
6. Worker waits random 5-10 seconds before next send.
7. On inbound `message_received`, matching campaign contact is marked `replied`.
8. Dashboard metrics are aggregated from campaign tables and sale outcomes.

### Flow H: Sales assistant auto-reply
1. Inbound message is received from WhatsApp (`fromMe = false`).
2. Message ingestion publishes `message_received` and invokes sales assistant pipeline.
3. Sales assistant loads workspace settings and conversation context.
4. If chatbot is disabled, conversation is closed, contact opted out, or human takeover exists, assistant stops.
5. Assistant generates a short sales-oriented reply (OpenAI primary path, local fallback).
6. Assistant waits 2-4 seconds to respect anti-spam pacing.
7. Assistant sends reply via `whatsappSession.sendMessage`.
8. Assistant stores interaction in `chatbot_logs`.
9. If agent sends outbound message (`fromMe = true`), assistant marks human takeover and stops replying on that conversation.

### Flow I: Revenue intelligence scoring and classification
1. Revenue intelligence worker runs every 10 minutes.
2. Worker scans recent conversations, messages, recovery attempts, campaign outcomes, and sales outcomes.
3. Worker computes `conversion_probability` (0 to 1) using weighted factors.
4. Worker classifies each conversation/customer as:
   - `READY_TO_BUY`
   - `LOST_CUSTOMER`
   - `REACTIVATABLE`
   - `ACTIVE_CONVERSATION`
5. Worker upserts `customer_revenue_state`.
6. Worker emits:
   - `customer_ready_to_buy`
   - `customer_lost`
   - `customer_reactivatable`
7. Sales assistant consumes `customer_ready_to_buy` to send a closing message.
8. Recovery engine consumes `customer_reactivatable` to schedule a recovery attempt.

### Flow J: Smart follow-up sequencing
1. Trigger events (`conversation_abandoned`, `customer_reactivatable`, `manual_followup_trigger`) start a follow-up sequence.
2. Sequence is created with 4 default steps (30m, 4h, 24h, 3d) in pending status.
3. Follow-up worker runs every 2 minutes and checks due pending steps.
4. If delay is reached, sequencer sends the step through sales-assistant -> whatsapp-session pipeline.
5. Step status moves to `sent` and sequence advances current step.
6. Sequence completes after the last step is sent.
7. Sequence is cancelled automatically if:
   - customer replies (`message_received`)
   - conversation is closed
   - sale is recorded (`sale_recovered`)

### Flow K: Offer optimizer and recommendation
1. Inbound customer message is persisted in conversation/message tables.
2. Offer optimizer scans message text with objection keywords:
   - `PRICE_OBJECTION`
   - `DELAY_OBJECTION`
   - `AVAILABILITY_OBJECTION`
   - `DELIVERY_QUESTION`
3. Module maps objection to offer strategy and builds optimized message.
4. Module writes `offer_events` record with objection, offer, and trigger timestamp.
5. Module emits `offer_recommended` domain event.
6. Sales assistant consumes `offer_recommended` and prioritizes optimized reply.
7. On recovered sale (`sale_recovered`), latest open offer record is marked `converted = true`.

### Flow L: Deal probability scoring and lead-state events
1. Deal probability worker runs every 10 minutes.
2. Worker scans active conversations and detects signals:
   - `PRICE_QUERY`
   - `DELIVERY_QUERY`
   - `AVAILABILITY_QUERY`
   - `DISCOUNT_REQUEST`
   - `RETURN_AFTER_FOLLOWUP`
   - `MULTIPLE_MESSAGES`
3. Worker computes probability score (0 to 1) using weighted model.
4. Worker classifies lead state:
   - `READY_TO_CLOSE` when score `> 0.75`
   - `WARM_LEAD` when score `0.40 - 0.75`
   - `COLD_LEAD` when score `< 0.40`
5. Worker upserts score/state into `deal_probability`.
6. Worker emits:
   - `customer_ready_to_close`
   - `customer_warm_lead`
   - `customer_cold_lead`
7. Event consumers:
   - `offer-optimizer` + `sales-assistant` consume `customer_ready_to_close`.
   - `followup-sequencer` consumes `customer_warm_lead`.

### Flow M: Conversation heatmap analytics and drop-off insights
1. Conversation heatmap worker runs every 30 minutes.
2. Worker scans recent inbound customer messages (30-day lookback).
3. Worker classifies each message stage using keyword groups:
   - `GREETING`
   - `PRODUCT_INTEREST`
   - `PRICE_DISCUSSION`
   - `DELIVERY`
   - `NEGOTIATION`
   - `CLOSING`
4. For each stage and workspace, worker computes:
   - `message_count`
   - `unique_customers`
   - `dropoff_count`
   - `dropoff_rate`
5. Drop-off is detected when:
   - customer message has no business reply within threshold window, or
   - conversation is marked `abandoned = true`.
6. Worker upserts metrics into `conversation_stage_metrics`.
7. For stages where `dropoff_rate > 0.40`, module emits `heatmap_insight_generated`.
8. Revenue-intelligence consumes `heatmap_insight_generated` and records the insight in `domain_event_logs`.

### Flow N: Conversation playbook detection and high-performance signaling
1. Playbook engine worker runs every 1 hour.
2. Worker scans recent strategy messages from:
   - chatbot responses (`chatbot_logs`)
   - follow-up messages (`followup_sequence_steps`)
   - offer messages (`offer_events`)
3. Worker classifies responses into playbook patterns:
   - `PRICE_RESPONSE`
   - `URGENCY_MESSAGE`
   - `DISCOUNT_MESSAGE`
   - `DELIVERY_INCENTIVE`
   - `RESERVATION_OFFER`
4. Worker computes per-playbook metrics:
   - `message_count`
   - `sales_generated`
   - `conversion_rate`
5. Outcomes are inferred as:
   - `SALE_COMPLETED`
   - `CONVERSATION_ABANDONED`
   - `NO_RESPONSE`
6. Worker upserts metrics into `conversation_playbooks`.
7. Worker detects top playbooks (`conversion_rate > workspace average`) and emits `playbook_high_performance`.
8. Sales assistant consumes `playbook_high_performance` and prioritizes that strategy in generated responses.

### Flow O: Automated revenue report generation and insights
1. Revenue reports worker runs every 24 hours.
2. Worker scans operational data sources:
   - conversations
   - sale outcomes and recovery attempts
   - follow-up sequences and sent steps
   - offer events
   - deal probability snapshots
3. Worker computes report metrics for:
   - `DAILY`
   - `WEEKLY`
   - `MONTHLY`
4. Stored fields per report:
   - `total_leads`
   - `active_conversations`
   - `total_sales`
   - `revenue_generated`
   - `revenue_recovered`
   - `conversion_rate`
5. Worker also calculates source influence metrics:
   - direct sales
   - sales after follow-ups
   - sales after offer optimizer
   - sales after recovery
6. Worker upserts rows in `revenue_reports`.
7. Worker emits `revenue_report_generated`.
8. If insight conditions are met (for example recovered revenue > 20% of total), worker emits `revenue_report_insight_generated`.

### Flow P: Workspace n8n automation webhooks on lead interaction
1. Workspace user enables/disables playbooks via `Dashboard -> Automations`.
2. Dashboard toggles playbook status through `POST /automations/playbooks?workspaceId={uuid}`.
3. On each inbound lead interaction (`message_received`), conversation module builds normalized lead payload.
4. n8n automation service loads `sales_recovery` playbook status from `automation_playbooks`.
5. If playbook is enabled, service dispatches async POST requests to:
   - quick recovery (2h)
   - follow-up recovery (12h)
   - final recovery (48h)
6. If playbook is disabled, webhook dispatch is skipped.
7. Webhook errors are logged and never break the main ingestion flow.

### Flow Q: Workspace AI chatbot webhook forwarding on inbound messages
1. Workspace user configures AI Router Webhook URL in `Dashboard -> Settings -> AI Chatbot`.
2. Dashboard reads/persists value via `GET/POST /api/settings/ai-chatbot?workspaceId={uuid}`.
3. On each inbound lead interaction (`message_received`), conversation module builds chatbot payload:
   - `workspace_id`
   - `phone`
   - `lead_name`
   - `message`
   - `lead_status`
   - `conversation_id`
   - `timestamp`
4. n8n chatbot service loads `ai_router_webhook_url` from `automation_settings`.
5. If webhook URL is configured, service dispatches async `POST` to the configured URL.
6. If webhook URL is empty/not configured, forwarding is skipped.
7. Webhook errors are logged and never break main ingestion flow.

## 6) Runtime architecture
- Modular monolith (single backend service).
- Separate frontend apps built with Next.js + TypeScript:
  - `apps/dashboard` for operational management
  - `apps/landing` for public marketing and onboarding entrypoint
  - `apps/landing` uses TailwindCSS and reusable section components based on the public SaaS landing design system.
  - `apps/dashboard` uses App Router + TailwindCSS for authenticated SaaS operations.
  - Dashboard authentication is handled by Next.js route handlers (`/api/auth/register`, `/api/auth/login`, `/api/auth/logout`) with JWT + `httpOnly` cookie session.
  - User credentials are stored in JSON persistence for MVP (`apps/dashboard/.data/users.json` in local dev, `/tmp/recuperaventas-dashboard/users.json` in production serverless by default) with bcrypt hashing.
  - Dashboard onboarding UI renders WhatsApp QR as SVG using `qrcode.react` for scanner compatibility.
  - Dashboard sidebar exposes a direct `Connect WhatsApp` navigation entry and shows workspace connection indicator (`Connected` / `Not connected`).
- In-process WhatsApp session sockets (`@whiskeysockets/baileys`).
  - Session auth state is persisted under `sessions/{workspace_id}` using `useMultiFileAuthState`.
  - Socket startup fetches latest WhatsApp Web protocol version via `fetchLatestBaileysVersion` and passes it to `makeWASocket`.
  - In-memory sockets are keyed by `workspace_id` and reused (one socket per workspace).
  - No Chromium/Puppeteer runtime dependency.
  - On `connection.update.close`, sockets reconnect automatically unless disconnect reason is `loggedOut`.
  - Lifecycle observability logs include `qr`, `authenticated`, `connected`, `disconnected`, and last disconnect reason/status code.
  - Incoming message observability logs are emitted from `messages.upsert`.
- PostgreSQL as source of truth.
- Redis + BullMQ available for async jobs (idle/recovery in next sprint).
- Idle detector, abandoned detector, and recovery sender workers run on polling intervals.
- Revenue intelligence worker runs every 10 minutes and publishes customer-state events.
- Follow-up sequencer worker runs every 2 minutes to send scheduled sequence steps.
- Offer optimizer worker runs every 2 minutes to analyze recent inbound messages and emit `offer_recommended`.
- Deal probability worker runs every 10 minutes to compute lead probability and emit lead-state events.
- Conversation heatmap worker runs every 30 minutes to compute stage drop-off metrics and high-dropoff insights.
- Playbook engine worker runs every 1 hour to detect high-performing conversation strategies.
- Revenue reports worker runs every 24 hours to persist daily/weekly/monthly revenue reports and insights.
- Campaign sender worker runs continuously and enforces 5-10s delay between campaign sends.
- Sales assistant uses in-process immediate handling on inbound events with 2-4s response pacing.
- n8n automation webhooks run asynchronously on inbound lead interactions, gated by playbook enablement, and do not block conversation processing.
- AI chatbot webhook forwarding runs asynchronously on inbound messages and does not block conversation processing.
- In-memory event bus for intra-process domain events.
- Express API includes CORS allowlist for:
  - `https://recuperaventas-dashboard.vercel.app`
  - `https://recuperaventas-landing.vercel.app`
  - `http://localhost:3000`
- API-level not-found and unhandled failures under `/api/*` return JSON envelopes (`{ data: null, error }`) to avoid HTML error pages in clients.

## 7) Modules and responsibilities
- `whatsapp-session`
  - Start/stop Baileys sockets.
  - QR generation and status transitions.
  - Session restore with workspace-level socket reuse and credential persistence on disk.
- `message-ingestion`
  - Attach listeners to Baileys socket (`messages.upsert`).
  - Normalize raw payload.
  - Emit `message_received`.
- `conversation`
  - Upsert contact.
  - Create/reuse conversation.
  - Persist messages and activity timestamps.
- `recovery`
  - Consumes `conversation_idle` and `conversation_abandoned` and creates scheduled attempts.
  - Sends recovery messages and updates attempt status.
  - Tracks replies after sent recovery.
  - Marks sale outcomes and recovered status.
- `abandoned-detector`
  - Classifies purchase intent from inbound customer text.
  - Marks conversations as abandoned after configured threshold.
  - Emits `conversation_abandoned`.
  - Exposes abandonment dashboard metrics.
- `campaigns`
  - Imports CSV contacts into campaign entities.
  - Schedules and sends outbound campaign messages sequentially.
  - Tracks reply status by contact phone on inbound events.
  - Exposes campaign-level dashboard metrics.
- `sales-assistant`
  - Generates sales-closing chatbot replies from inbound messages.
  - Applies workspace settings (`chatbot_enabled`, style, product context).
  - Stops on human takeover, closed conversation, or opt-out contact.
  - Persists chatbot interactions and dashboard counters.
  - Consumes `customer_ready_to_buy` to send proactive closing messages.
  - Consumes `offer_recommended` to send objection-aware optimized offers.
- `automation-settings`
  - Stores workspace-level n8n webhook endpoints including `ai_router_webhook_url`.
  - Exposes get/update use cases for dashboard configuration.
- `automation-playbooks`
  - Stores workspace-level playbook enablement (`sales_recovery`).
  - Exposes list/toggle use cases for dashboard automation cards.
- `n8n-automations`
  - Loads workspace automation webhooks from `automation_settings`.
  - Checks playbook state from `automation_playbooks` before dispatching webhooks.
  - Triggers quick/follow-up/final webhook calls on inbound lead interactions.
  - Handles webhook failures with non-blocking logging.
- `n8n-chatbot`
  - Loads workspace AI router webhook URL from `automation_settings`.
  - Forwards inbound WhatsApp lead payloads to configured AI router webhook URL.
  - Handles forwarding failures with non-blocking logging.
- `offer-optimizer`
  - Detects objection keywords from inbound customer messages.
  - Maps objection categories to offer strategies (discount, urgency, bonus, delivery incentive, reservation).
  - Emits `offer_recommended` and persists recommendation events in `offer_events`.
  - Tracks recommendation metrics (`offers_triggered`, `offers_accepted`, `conversion_after_offer`).
  - Marks offer conversion on `sale_recovered`.
- `deal-probability`
  - Calculates purchase probability score (0 to 1) per active conversation.
  - Detects conversion signals from message content and follow-up returns.
  - Classifies lead states (`READY_TO_CLOSE`, `WARM_LEAD`, `COLD_LEAD`).
  - Persists scores in `deal_probability`.
  - Emits lead-state events used by offer optimizer, sales assistant, and follow-up sequencer.
- `conversation-heatmap`
  - Classifies inbound customer messages into sales stages for analytics.
  - Detects conversation drop-off by reply-threshold and abandoned status.
  - Persists stage metrics in `conversation_stage_metrics`.
  - Generates high drop-off insights and logs them through revenue-intelligence.
- `playbook-engine`
  - Analyzes chatbot, follow-up, and offer responses against conversation outcomes.
  - Detects high-performing response playbooks and computes conversion metrics.
  - Persists playbook metrics in `conversation_playbooks`.
  - Emits `playbook_high_performance` for sales-assistant prioritization.
- `revenue-reports`
  - Aggregates revenue and conversion metrics across conversations, recovery, offers, follow-ups, and deal probability data.
  - Persists periodic reports (`DAILY`, `WEEKLY`, `MONTHLY`) in `revenue_reports`.
  - Emits `revenue_report_generated` and `revenue_report_insight_generated`.
  - Exposes latest and historical report endpoints.
- `revenue-intelligence`
  - Computes conversion probability per conversation.
  - Classifies customer states (`READY_TO_BUY`, `LOST_CUSTOMER`, `REACTIVATABLE`, `ACTIVE_CONVERSATION`).
  - Persists `customer_revenue_state`.
  - Emits customer-state domain events.
  - Consumes `heatmap_insight_generated` and records operational insights.
  - Exposes summary and customer listing metrics endpoints.
- `followup-sequencer`
  - Starts multi-step sequences from abandonment/reactivation/manual triggers.
  - Schedules and sends follow-up messages by step delays.
  - Cancels sequences on reply, closed conversation, or recovered sale.
  - Exposes sequence stats endpoint for dashboard.

## 8) API surface (current)
- `POST /api/v1/workspaces`
- `POST /api/v1/whatsapp/session/start`
- `GET /api/v1/whatsapp/session/status`
- `POST /api/v1/sessions/whatsapp/start`
- `GET /api/v1/sessions/whatsapp/:sessionId/qr`
- `GET /api/v1/sessions/whatsapp/:sessionId/status`
- `POST /api/v1/sessions/whatsapp/:sessionId/disconnect`
- `GET /api/v1/conversations`
- `GET /api/v1/conversations/metrics`
- `GET /api/v1/conversations/:conversationId`
- `POST /api/v1/recoveries/:recoveryId/mark-sale`
- `POST /api/v1/campaigns/import`
- `GET /api/v1/campaigns/:campaignId/metrics`
- `GET /api/v1/sales-assistant/settings`
- `PATCH /api/v1/sales-assistant/settings`
- `GET /api/v1/sales-assistant/metrics`
- `GET /api/v1/revenue-intelligence/summary`
- `GET /api/v1/revenue-intelligence/customers`
- `GET /api/v1/followup-sequencer/stats`
- `GET /api/v1/deal-probability/summary`
- `GET /api/v1/conversation-heatmap`
- `GET /api/v1/playbook-engine/top`
- `GET /api/v1/revenue-reports/latest`
- `GET /api/v1/revenue-reports/history`
- `GET /api/v1/settings/automations`
- `POST /api/v1/settings/automations`
- `GET /api/v1/settings/ai-chatbot`
- `POST /api/v1/settings/ai-chatbot`
- `GET /api/v1/automations/playbooks`
- `POST /api/v1/automations/playbooks`
- `POST /api/automations/playbooks` (compatibility alias)
- `GET /api/settings/ai-chatbot` (compatibility alias)
- `POST /api/settings/ai-chatbot` (compatibility alias)

## 9) Frontend routes
- Landing app (`apps/landing`):
  - `/`
    - Public marketing page with section architecture:
      - `Navbar`
      - `HeroSection`
      - `ProblemSection`
      - `SolutionSection`
      - `ResultsSection`
      - `ProductPreview`
      - `HowItWorks`
      - `CTASection`
      - `Footer`
- Dashboard app (`apps/dashboard`):
  - `/`
    - Auth-aware entrypoint:
      - guest -> `/register`
      - authenticated -> `/connect-whatsapp`
  - `/register`
    - Name/email/password registration with bcrypt hash + JWT cookie issuance.
  - `/login`
    - Email/password login with hash validation + JWT cookie issuance.
  - `/dashboard`
    - SaaS metrics cards (placeholder integrations).
  - `/connect-whatsapp`
    - Shows QR area, explicit connection status (`Disconnected`, `Waiting for QR scan`, `Connected`), and reconnect CTA.
    - Workspace creation + WhatsApp QR connection flow.
  - `/conversations`
    - CRM layout with conversation list, chat window, and customer info panel.
  - `/recovery`
    - Abandoned/reactivatable/ready-to-close lead queues.
  - `/automations`
    - Playbook cards with enable/disable toggles and running automation status.
  - `/analytics`
    - Recovered revenue, follow-up performance, and conversion chart placeholders.
  - `/settings`
    - Workspace settings route including AI Chatbot webhook URL configuration.
  - `/conversations/:id`
    - Message timeline, latest recovery status, action `Mark sale recovered`.

## 10) Environment variables
- `NODE_ENV`
- `PORT`
- `DATABASE_URL`
- `REDIS_URL`
- `WHATSAPP_SESSION_DATA_PATH`
- `ABANDONED_THRESHOLD_MINUTES`
- `IDLE_THRESHOLD_HOURS`
- `RECOVERY_TEMPLATE_TEXT`
- `LOG_LEVEL`
- `OPENAI_API_KEY` (optional)
- `OPENAI_MODEL`
- `OPENAI_BASE_URL`
- Frontend (`apps/dashboard`):
  - `NEXT_PUBLIC_API_BASE_URL`
  - `NEXT_PUBLIC_WORKSPACE_ID` (optional for onboarding; if missing, created from UI flow)
  - `JWT_SECRET` (server-side JWT signing secret for dashboard auth)
  - `AUTH_USERS_FILE_PATH` (optional custom auth users JSON path)
- Frontend (`apps/landing`):
  - `NEXT_PUBLIC_DASHBOARD_URL` (optional; defaults to `http://localhost:3001` for CTA routing)

## 11) Non-functional requirements
- Tenant isolation by `workspace_id`.
- Input validation at controller boundary.
- SQL injection prevention via parameterized queries only.
- Idempotent message persistence.
- Structured logs without secrets.
- CORS preflight (`OPTIONS`) enabled for allowed frontend origins only.
