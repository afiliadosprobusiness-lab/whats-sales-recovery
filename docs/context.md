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
- ChatbotLog: assistant customer/bot exchange log for audit and metrics.
- DomainEventLog: immutable event log for audit and tracing.

### Domain events
- Active:
  - `message_received`
  - `conversation_idle`
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

### Future sprint tables (already scaffolded)
- `templates`

## 5) Main flows

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

### Flow E: Reply detection and recovered sale tracking
1. Customer replies after recovery message was sent.
2. System finds latest recovery attempt with `status = sent` for that conversation.
3. System updates attempt to `status = replied`, sets `replied_at = now`.
4. Emits `customer_replied`.
5. Seller confirms sale via `POST /recoveries/{recoveryId}/mark-sale`.
6. System creates `sale_outcomes` record.
7. System updates recovery attempt to `status = recovered`.
8. System marks conversation as `closed`.
9. Emits `sale_recovered`.

### Flow F: Bulk campaign import and sending
1. User imports CSV via `POST /campaigns/import`.
2. System creates `campaigns` record and upserts contacts.
3. System inserts `campaign_contacts` and `campaign_messages` in `scheduled`.
4. Campaign worker claims one scheduled message at a time.
5. Message is sent through existing `whatsappSession.sendMessage`.
6. Worker waits random 5-10 seconds before next send.
7. On inbound `message_received`, matching campaign contact is marked `replied`.
8. Dashboard metrics are aggregated from campaign tables and sale outcomes.

### Flow G: Sales assistant auto-reply
1. Inbound message is received from WhatsApp (`fromMe = false`).
2. Message ingestion publishes `message_received` and invokes sales assistant pipeline.
3. Sales assistant loads workspace settings and conversation context.
4. If chatbot is disabled, conversation is closed, contact opted out, or human takeover exists, assistant stops.
5. Assistant generates a short sales-oriented reply (OpenAI primary path, local fallback).
6. Assistant waits 2-4 seconds to respect anti-spam pacing.
7. Assistant sends reply via `whatsappSession.sendMessage`.
8. Assistant stores interaction in `chatbot_logs`.
9. If agent sends outbound message (`fromMe = true`), assistant marks human takeover and stops replying on that conversation.

## 6) Runtime architecture
- Modular monolith (single backend service).
- Separate frontend apps built with Next.js + TypeScript:
  - `apps/dashboard` for operational management
  - `apps/landing` for public marketing and onboarding entrypoint
  - Dashboard onboarding UI renders WhatsApp QR as SVG using `qrcode.react` for scanner compatibility.
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
- Idle detector and recovery sender workers run on polling intervals.
- Campaign sender worker runs continuously and enforces 5-10s delay between campaign sends.
- Sales assistant uses in-process immediate handling on inbound events with 2-4s response pacing.
- In-memory event bus for intra-process domain events.
- Express API includes CORS allowlist for:
  - `https://recuperaventas-dashboard.vercel.app`
  - `https://recuperaventas-landing.vercel.app`
  - `http://localhost:3000`

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
  - Consumes `conversation_idle` and creates scheduled attempts.
  - Sends recovery messages and updates attempt status.
  - Tracks replies after sent recovery.
  - Marks sale outcomes and recovered status.
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

## 8) API surface (current)
- `POST /api/v1/workspaces`
- `POST /api/v1/whatsapp/session/start`
- `GET /api/v1/whatsapp/session/status`
- `POST /api/v1/sessions/whatsapp/start`
- `GET /api/v1/sessions/whatsapp/:sessionId/qr`
- `GET /api/v1/sessions/whatsapp/:sessionId/status`
- `POST /api/v1/sessions/whatsapp/:sessionId/disconnect`
- `GET /api/v1/conversations`
- `GET /api/v1/conversations/:conversationId`
- `POST /api/v1/recoveries/:recoveryId/mark-sale`
- `POST /api/v1/campaigns/import`
- `GET /api/v1/campaigns/:campaignId/metrics`
- `GET /api/v1/sales-assistant/settings`
- `PATCH /api/v1/sales-assistant/settings`
- `GET /api/v1/sales-assistant/metrics`

## 9) Frontend routes (dashboard app)
- Landing app (`apps/landing`):
  - `/`
    - Public marketing page explaining product, problem/solution flow, metrics, and CTA to connect WhatsApp.
- `/connect-whatsapp`
  - Onboarding flow: create workspace, start WhatsApp session, render scannable QR SVG, poll connected status.
- `/dashboard`
  - Metrics: total conversations, idle, recovery sent, recovered sales, recovered revenue.
- `/conversations`
  - Table: contact phone, last message, recovery status, recovered flag, recovered amount.
- `/conversations/:id`
  - Message timeline, latest recovery status, action `Mark sale recovered`.

## 10) Environment variables
- `NODE_ENV`
- `PORT`
- `DATABASE_URL`
- `REDIS_URL`
- `WHATSAPP_SESSION_DATA_PATH`
- `IDLE_THRESHOLD_HOURS`
- `RECOVERY_TEMPLATE_TEXT`
- `LOG_LEVEL`
- `OPENAI_API_KEY` (optional)
- `OPENAI_MODEL`
- `OPENAI_BASE_URL`
- Frontend (`apps/dashboard`):
  - `NEXT_PUBLIC_API_BASE_URL`
  - `NEXT_PUBLIC_WORKSPACE_ID` (optional for onboarding; if missing, created from UI flow)

## 11) Non-functional requirements
- Tenant isolation by `workspace_id`.
- Input validation at controller boundary.
- SQL injection prevention via parameterized queries only.
- Idempotent message persistence.
- Structured logs without secrets.
- CORS preflight (`OPTIONS`) enabled for allowed frontend origins only.
