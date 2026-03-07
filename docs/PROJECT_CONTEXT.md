# PROJECT_CONTEXT - RecuperaVentas

## Project objective
Validate product value quickly by connecting WhatsApp, ingesting messages, detecting inactivity, and sending automated recovery follow-ups.

## Quick system description
Backend modular monolith (Node.js + TypeScript) using Baileys (`@whiskeysockets/baileys`) sessions plus two Next.js frontends:
- `apps/landing` for public marketing
- `apps/dashboard` for onboarding and operational tracking

## Current focus (Sprint 4)
- MVP onboarding: workspace creation + WhatsApp connection via QR in dashboard.
- Dashboard connect screen uses `qrcode.react` to render scannable WhatsApp QR images.
- WhatsApp session connection and restore with workspace-level in-memory socket reuse.
- Incoming message ingestion.
- Contact/conversation/message persistence.
- Idle detector every 5 minutes.
- Recovery attempt scheduling and automatic message sending.
- Bulk campaign CSV import (`name,phone`) and campaign scheduling.
- Sequential campaign message sending with randomized 5-10s pacing.
- Campaign reply tracking and campaign metrics.
- Sales-assistant auto-replies focused on lead qualification and closing.
- Workspace chatbot settings (`chatbot_enabled`, style, product context).
- Human takeover stop condition and 2-4s assistant pacing.
- Sales assistant dashboard counters.
- Reply detection for sent recovery attempts.
- Recovered sale marking with amount and currency.
- Frontend visibility for recovered sales and conversations.

## Architecture summary
- API + session runtime in one service.
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

## Backlog events preserved
- `message_received`
- `conversation_idle`
- `recovery_triggered`
- `recovery_sent`
- `recovery_failed`
- `customer_replied`
- `sale_recovered`

## Scope guardrails
- Keep WhatsApp-only integration.
- Keep implementation simple and modular.
- Keep AI usage limited to sales-assistant reply generation for conversion-oriented chats.
- Keep onboarding unauthenticated and single-workspace-oriented for MVP.

## Frontend routes
- `/` (landing marketing page)
- `/connect-whatsapp`
- `/dashboard`
- `/conversations`
- `/conversations/:id`
