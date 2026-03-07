# RecuperaVentas - Architecture MVP (Fast Validation)

## Goal
Launch the fastest MVP that proves one core value:
recover lost WhatsApp sales by detecting idle conversations and sending follow-up messages.

## MVP constraints
- Keep architecture simple.
- No advanced AI.
- No enterprise orchestration.
- No webhook ingestion from WhatsApp Cloud API.
- Use WhatsApp Web session automation for MVP.

## Integration decision (MVP)
- Transport: WhatsApp Web session automation.
- Suggested library: `whatsapp-web.js` (QR login + persistent local session).
- Alternative accepted: `Baileys`.

## Connection flow (required)
1. User opens "Connect WhatsApp" in app.
2. System creates new WhatsApp Web client session.
3. QR code is generated and shown to user.
4. User scans QR from WhatsApp mobile app.
5. Session is authenticated and stored.
6. Event listeners start receiving messages.
7. Inbound messages are persisted and linked to conversations.

## Simplified runtime architecture
- Single backend service (API + workers in same process for MVP).
- PostgreSQL as source of truth.
- Optional Redis queue for delayed retry/send (can start with DB polling if needed).
- WhatsApp Web client as runtime adapter inside backend.

## Core components

### 1) `whatsapp-session-manager`
Responsibilities:
- Start/stop WhatsApp client per account.
- Generate QR and expose connection state (`pending_qr`, `connected`, `disconnected`).
- Persist and restore session credentials.
- Auto-reconnect on temporary disconnect.

### 2) `message-ingestion`
Responsibilities:
- Subscribe to WhatsApp session events (`message`, `message_ack`, `connection`).
- Normalize payload into internal message format.
- Persist inbound/outbound messages.
- Upsert contacts and conversations.

### 3) `conversation-tracker`
Responsibilities:
- Maintain conversation status (`open`, `idle`, `closed`).
- Update last customer/business activity timestamps.
- Link messages to active recovery attempt when applicable.

### 4) `idle-detector`
Responsibilities:
- Periodically scan open conversations.
- Mark as idle when threshold reached (default 24h).
- Emit domain event `conversation_idle`.

### 5) `recovery-engine`
Responsibilities:
- Consume `conversation_idle`.
- Validate eligibility (not closed, no opt-out, no duplicate recent recovery).
- Create recovery attempt.
- Emit `recovery_triggered`.

### 6) `message-sender`
Responsibilities:
- Send recovery message through active WhatsApp session.
- Persist delivery outcome (`sent`, `failed`).
- Update recovery attempt state.

## Required domain events (kept)
- `conversation_idle`
- `recovery_triggered`
- `recovery_sent`
- `recovery_failed`
- `customer_replied`
- `sale_recovered`

## Minimal data model for this architecture
- `whatsapp_sessions` (session status, auth blob reference, last_seen_at)
- `contacts`
- `conversations`
- `messages`
- `templates` (single active template for MVP)
- `recovery_attempts`
- `sale_outcomes`
- `domain_event_logs`

## Minimal APIs for MVP
- `POST /sessions/whatsapp/start` -> init session and QR generation
- `GET /sessions/whatsapp/{id}/qr` -> fetch current QR
- `GET /sessions/whatsapp/{id}/status` -> connection status
- `POST /sessions/whatsapp/{id}/disconnect`
- `GET /conversations?status=idle|open|closed`
- `GET /conversations/{conversation_id}`
- `POST /recoveries/trigger`
- `POST /recoveries/{recovery_id}/mark-sale`

## Out of scope (MVP)
- Multi-channel messaging.
- AI lead scoring.
- Complex analytics warehouse.
- Billing/subscriptions automation.
- Advanced role hierarchy.
