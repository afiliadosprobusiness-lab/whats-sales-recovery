# PROJECT_CONTEXT - RecuperaVentas

## Project objective
Validate product value quickly by connecting WhatsApp, ingesting messages, detecting inactivity, and sending automated recovery follow-ups.

## Quick system description
Backend modular monolith (Node.js + TypeScript) using `whatsapp-web.js` sessions plus two Next.js frontends:
- `apps/landing` for public marketing
- `apps/dashboard` for onboarding and operational tracking

## Current focus (Sprint 3)
- MVP onboarding: workspace creation + WhatsApp connection via QR in dashboard.
- WhatsApp session connection and restore.
- Incoming message ingestion.
- Contact/conversation/message persistence.
- Idle detector every 5 minutes.
- Recovery attempt scheduling and automatic message sending.
- Reply detection for sent recovery attempts.
- Recovered sale marking with amount and currency.
- Frontend visibility for recovered sales and conversations.

## Architecture summary
- API + session runtime in one service.
- PostgreSQL for domain data.
- BullMQ/Redis scaffolded for later async jobs.
- In-process event bus for module communication.

## Main entities (active now)
- `workspaces`
- `whatsapp_sessions`
- `contacts`
- `conversations`
- `messages`
- `recovery_attempts`
- `sale_outcomes`
- `domain_event_logs`

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
- Do not add AI or advanced analytics beyond recovery automation.
- Keep onboarding unauthenticated and single-workspace-oriented for MVP.

## Frontend routes
- `/` (landing marketing page)
- `/connect-whatsapp`
- `/dashboard`
- `/conversations`
- `/conversations/:id`
