# RecuperaVentas - System Context (MVP)

## 1) Product objective
Recover lost WhatsApp sales by detecting inactive conversations and sending automated follow-up messages.

## 2) MVP scope
- In scope:
  - Connect WhatsApp account via QR.
  - Ingest incoming messages from session listeners.
  - Track contacts and conversations.
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

### Future sprint tables (already scaffolded)
- `templates`

## 5) Main flows

### Flow A: WhatsApp session connection
1. User creates workspace via onboarding endpoint.
2. User requests `startSession(workspaceId)`.
3. System creates or reuses `whatsapp_sessions` record.
4. `whatsapp-web.js` client emits QR.
5. User scans QR and session becomes connected.
6. Session state is persisted and can be restored after restart.

### Flow B: Message ingestion
1. Active WhatsApp client receives incoming message event.
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

## 6) Runtime architecture
- Modular monolith (single backend service).
- Separate frontend apps built with Next.js + TypeScript:
  - `apps/dashboard` for operational management
  - `apps/landing` for public marketing and onboarding entrypoint
- In-process WhatsApp session clients (`whatsapp-web.js`).
- PostgreSQL as source of truth.
- Redis + BullMQ available for async jobs (idle/recovery in next sprint).
- Idle detector and recovery sender workers run on polling intervals.
- In-memory event bus for intra-process domain events.

## 7) Modules and responsibilities
- `whatsapp-session`
  - Start/stop session clients.
  - QR generation and status transitions.
  - Session restore/autoreconnect.
- `message-ingestion`
  - Attach listeners to WhatsApp client.
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

## 9) Frontend routes (dashboard app)
- Landing app (`apps/landing`):
  - `/`
    - Public marketing page explaining product, problem/solution flow, metrics, and CTA to connect WhatsApp.
- `/connect-whatsapp`
  - Onboarding flow: create workspace, start WhatsApp session, display QR, poll connected status.
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
- Frontend (`apps/dashboard`):
  - `NEXT_PUBLIC_API_BASE_URL`
  - `NEXT_PUBLIC_WORKSPACE_ID` (optional for onboarding; if missing, created from UI flow)

## 11) Non-functional requirements
- Tenant isolation by `workspace_id`.
- Input validation at controller boundary.
- SQL injection prevention via parameterized queries only.
- Idempotent message persistence.
- Structured logs without secrets.
