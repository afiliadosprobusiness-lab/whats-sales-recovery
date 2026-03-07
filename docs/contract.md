# RecuperaVentas - API Contract (Sprint 2)

## 1) Conventions
- Base URL: `/api/v1`
- Content-Type: `application/json`
- Time format: ISO-8601 UTC
- Onboarding MVP endpoints (`/workspaces`, `/whatsapp/session/*`) return simplified JSON payloads without `{ data, error }` envelope.

## 2) Response format

Success:
```json
{
  "data": {},
  "error": null
}
```

Error:
```json
{
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "workspaceId must be a valid UUID"
  }
}
```

## 3) Endpoints

## 3.0 Onboarding MVP

### `POST /workspaces`
Creates a workspace for initial onboarding.

Request:
```json
{
  "name": "Business Name"
}
```

Response `201`:
```json
{
  "workspace_id": "6a327bb8-f9e4-4f0d-8f72-b0c39b3ef8ea"
}
```

### `POST /whatsapp/session/start`
Starts a WhatsApp session using workspace id and returns QR data for scan.

Request:
```json
{
  "workspace_id": "6a327bb8-f9e4-4f0d-8f72-b0c39b3ef8ea"
}
```

Response `200`:
```json
{
  "qr": "raw-qr-value-or-empty-string"
}
```

### `GET /whatsapp/session/status?workspace_id={uuid}`
Returns whether workspace WhatsApp session is connected.

Response `200`:
```json
{
  "connected": true
}
```

## 3.1 WhatsApp sessions

### `POST /sessions/whatsapp/start`
Starts (or reuses) a WhatsApp session for workspace.

Request:
```json
{
  "workspaceId": "6a327bb8-f9e4-4f0d-8f72-b0c39b3ef8ea"
}
```

Response `202`:
```json
{
  "data": {
    "sessionId": "a4bb04f2-5d53-454f-87db-84ff01a49bd4",
    "workspaceId": "6a327bb8-f9e4-4f0d-8f72-b0c39b3ef8ea",
    "status": "pending_qr"
  },
  "error": null
}
```

### `GET /sessions/whatsapp/{sessionId}/qr`
Returns current QR (if pending).

Response `200`:
```json
{
  "data": {
    "sessionId": "a4bb04f2-5d53-454f-87db-84ff01a49bd4",
    "qr": "raw-qr-value-or-null"
  },
  "error": null
}
```

### `GET /sessions/whatsapp/{sessionId}/status`
Returns connection status.

Response `200`:
```json
{
  "data": {
    "sessionId": "a4bb04f2-5d53-454f-87db-84ff01a49bd4",
    "status": "connected"
  },
  "error": null
}
```

### `POST /sessions/whatsapp/{sessionId}/disconnect`
Disconnects active session.

Response `200`:
```json
{
  "data": {
    "sessionId": "a4bb04f2-5d53-454f-87db-84ff01a49bd4",
    "status": "disconnected"
  },
  "error": null
}
```

## 3.2 Conversations

### `GET /conversations?workspaceId={uuid}&status=open|idle|closed&limit=50&offset=0`
List conversations for workspace.

Response `200`:
```json
{
  "data": {
    "items": [
      {
        "id": "fe7b7169-9b84-4d5f-949a-ed517a7cc702",
        "contactId": "02e0a2f8-0ea7-4f5b-9f46-0477f664fe4a",
        "contactPhone": "+51999999999",
        "status": "idle"
      }
    ],
    "pagination": {
      "limit": 50,
      "offset": 0
    }
  },
  "error": null
}
```

### `GET /conversations/{conversationId}?workspaceId={uuid}`
Returns conversation detail, recent messages, and recovery status fields.

Response `200`:
```json
{
  "data": {
    "conversation": {},
    "messages": [],
    "latest_recovery": null,
    "is_recovered": false,
    "recovery_status": "sent",
    "sale_recovered": false,
    "recovered_amount": null
  },
  "error": null
}
```

## 3.3 Recovery outcomes

### `POST /recoveries/{recoveryId}/mark-sale`
Marks a sent/replied recovery as recovered sale.

Request:
```json
{
  "amount": 120.5,
  "currency": "PEN"
}
```

Response `200`:
```json
{
  "data": {
    "recoveryId": "5f8c2af5-7cda-468b-a4f0-41e3f4088d53",
    "conversationId": "fe7b7169-9b84-4d5f-949a-ed517a7cc702",
    "amount": 120.5,
    "currency": "PEN"
  },
  "error": null
}
```

## 3.4 Campaigns (bulk recovery)

### `POST /campaigns/import?workspaceId={uuid}&campaignName={optional}`
Imports a CSV contact list and creates a bulk recovery campaign.

Headers:
```text
Content-Type: text/csv
```

Body (CSV):
```csv
name,phone
John,51999911111
```

Response `201`:
```json
{
  "data": {
    "campaignId": "f4de2c0d-4207-4fef-9693-0357f0954e7f",
    "workspaceId": "6a327bb8-f9e4-4f0d-8f72-b0c39b3ef8ea",
    "name": "Campaign 2026-03-07T18:30:00.000Z",
    "status": "queued",
    "contactsTotal": 1,
    "messagesScheduled": 1
  },
  "error": null
}
```

### `GET /campaigns/{campaignId}/metrics?workspaceId={uuid}`
Returns dashboard metrics for a campaign.

Response `200`:
```json
{
  "data": {
    "campaignId": "f4de2c0d-4207-4fef-9693-0357f0954e7f",
    "contacts_total": 120,
    "messages_sent": 115,
    "replies": 18,
    "recovered_sales": 7
  },
  "error": null
}
```

## 3.5 Sales assistant

### `GET /sales-assistant/settings?workspaceId={uuid}`
Returns workspace-level sales assistant configuration.

Response `200`:
```json
{
  "data": {
    "workspace_id": "6a327bb8-f9e4-4f0d-8f72-b0c39b3ef8ea",
    "chatbot_enabled": true,
    "chatbot_style": "consultivo",
    "chatbot_product_context": "Vendemos zapatillas con delivery en Lima."
  },
  "error": null
}
```

### `PATCH /sales-assistant/settings`
Upserts workspace-level sales assistant configuration.

Request:
```json
{
  "workspaceId": "6a327bb8-f9e4-4f0d-8f72-b0c39b3ef8ea",
  "chatbotEnabled": true,
  "chatbotStyle": "consultivo",
  "chatbotProductContext": "Vendemos zapatillas con delivery en Lima."
}
```

Response `200`:
```json
{
  "data": {
    "workspace_id": "6a327bb8-f9e4-4f0d-8f72-b0c39b3ef8ea",
    "chatbot_enabled": true,
    "chatbot_style": "consultivo",
    "chatbot_product_context": "Vendemos zapatillas con delivery en Lima."
  },
  "error": null
}
```

### `GET /sales-assistant/metrics?workspaceId={uuid}`
Returns dashboard counters for sales assistant performance.

Response `200`:
```json
{
  "data": {
    "chatbot_messages_sent": 42,
    "chatbot_conversations_handled": 18,
    "chatbot_sales_closed": 5
  },
  "error": null
}
```

## 4) Domain event contract (Sprint 2)

### `message_received`
```json
{
  "event_id": "evt_01J...",
  "event_name": "message_received",
  "workspace_id": "6a327bb8-f9e4-4f0d-8f72-b0c39b3ef8ea",
  "occurred_at": "2026-03-07T18:00:00Z",
  "payload": {
    "session_id": "a4bb04f2-5d53-454f-87db-84ff01a49bd4",
    "provider_message_id": "true_551122334455@c.us_3EB0...",
    "contact_phone": "+551122334455",
    "body_text": "Cuanto cuesta?",
    "direction": "inbound"
  }
}
```

### `conversation_idle`
```json
{
  "event_id": "evt_01J...",
  "event_name": "conversation_idle",
  "workspace_id": "6a327bb8-f9e4-4f0d-8f72-b0c39b3ef8ea",
  "occurred_at": "2026-03-08T18:00:00Z",
  "payload": {
    "conversation_id": "fe7b7169-9b84-4d5f-949a-ed517a7cc702",
    "contact_id": "02e0a2f8-0ea7-4f5b-9f46-0477f664fe4a",
    "idle_hours": 24
  }
}
```

### `recovery_triggered`
```json
{
  "event_id": "evt_01J...",
  "event_name": "recovery_triggered",
  "workspace_id": "6a327bb8-f9e4-4f0d-8f72-b0c39b3ef8ea",
  "occurred_at": "2026-03-08T18:01:00Z",
  "payload": {
    "recovery_attempt_id": "5f8c2af5-7cda-468b-a4f0-41e3f4088d53",
    "conversation_id": "fe7b7169-9b84-4d5f-949a-ed517a7cc702",
    "contact_id": "02e0a2f8-0ea7-4f5b-9f46-0477f664fe4a"
  }
}
```

### `recovery_sent`
```json
{
  "event_id": "evt_01J...",
  "event_name": "recovery_sent",
  "workspace_id": "6a327bb8-f9e4-4f0d-8f72-b0c39b3ef8ea",
  "occurred_at": "2026-03-08T18:01:05Z",
  "payload": {
    "recovery_attempt_id": "5f8c2af5-7cda-468b-a4f0-41e3f4088d53",
    "conversation_id": "fe7b7169-9b84-4d5f-949a-ed517a7cc702"
  }
}
```

### `recovery_failed`
```json
{
  "event_id": "evt_01J...",
  "event_name": "recovery_failed",
  "workspace_id": "6a327bb8-f9e4-4f0d-8f72-b0c39b3ef8ea",
  "occurred_at": "2026-03-08T18:01:05Z",
  "payload": {
    "recovery_attempt_id": "5f8c2af5-7cda-468b-a4f0-41e3f4088d53",
    "conversation_id": "fe7b7169-9b84-4d5f-949a-ed517a7cc702",
    "failed_reason": "WhatsApp session not connected"
  }
}
```

### `customer_replied`
```json
{
  "event_id": "evt_01J...",
  "event_name": "customer_replied",
  "workspace_id": "6a327bb8-f9e4-4f0d-8f72-b0c39b3ef8ea",
  "occurred_at": "2026-03-09T18:10:00Z",
  "payload": {
    "recovery_attempt_id": "5f8c2af5-7cda-468b-a4f0-41e3f4088d53",
    "conversation_id": "fe7b7169-9b84-4d5f-949a-ed517a7cc702",
    "provider_message_id": "true_51999999999@c.us_3EB0..."
  }
}
```

### `sale_recovered`
```json
{
  "event_id": "evt_01J...",
  "event_name": "sale_recovered",
  "workspace_id": "6a327bb8-f9e4-4f0d-8f72-b0c39b3ef8ea",
  "occurred_at": "2026-03-09T18:20:00Z",
  "payload": {
    "recovery_attempt_id": "5f8c2af5-7cda-468b-a4f0-41e3f4088d53",
    "conversation_id": "fe7b7169-9b84-4d5f-949a-ed517a7cc702",
    "amount": 120.5,
    "currency": "PEN"
  }
}
```

## 5) Changelog
- Date: 2026-03-06
- Change: Added simple onboarding MVP endpoints for workspace creation and WhatsApp connection flow.
- Type: Non-breaking (new endpoints).
- Impact:
  - Added `POST /workspaces`.
  - Added `POST /whatsapp/session/start`.
  - Added `GET /whatsapp/session/status`.
- Date: 2026-03-07
- Change: Replaced webhook/cloud endpoints with WhatsApp Web session endpoints for Sprint 1.
- Type: Breaking (pre-MVP, no production clients impacted).
- Impact:
  - Removed `GET/POST /webhooks/whatsapp` from active contract.
  - Added session lifecycle endpoints and `message_received` domain event.
- Date: 2026-03-07
- Change: Added Sprint 2 domain events and automated recovery flow contracts.
- Type: Non-breaking for current API endpoints.
- Impact:
  - Added `conversation_idle`, `recovery_triggered`, `recovery_sent`, `recovery_failed` contracts.
- Date: 2026-03-07
- Change: Added Sprint 3 sale-marking endpoint and recovery outcome fields in conversation detail.
- Type: Non-breaking (new endpoint + response extension).
- Impact:
  - Added `POST /recoveries/{recoveryId}/mark-sale`.
  - Extended `GET /conversations/{conversationId}` response with recovery outcome fields.
  - Added `customer_replied` and `sale_recovered` event contracts.
- Date: 2026-03-07
- Change: Added `contactPhone` in conversation list items for dashboard table rendering.
- Type: Non-breaking (response field extension).
- Impact:
  - `GET /conversations` now includes optional `contactPhone`.
- Date: 2026-03-07
- Change: Added campaigns bulk import and campaign metrics endpoints.
- Type: Non-breaking (new endpoints).
- Impact:
  - Added `POST /campaigns/import`.
  - Added `GET /campaigns/{campaignId}/metrics`.
- Date: 2026-03-07
- Change: Added sales-closing assistant settings and dashboard metrics endpoints.
- Type: Non-breaking (new endpoints + runtime automation).
- Impact:
  - Added `GET /sales-assistant/settings`.
  - Added `PATCH /sales-assistant/settings`.
  - Added `GET /sales-assistant/metrics`.
  - Added workspace chatbot configuration + chatbot interaction logs in database.
