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

### `POST /whatsapp/session/disconnect`
Disconnects the active WhatsApp session for the given workspace.

Request:
```json
{
  "workspace_id": "6a327bb8-f9e4-4f0d-8f72-b0c39b3ef8ea"
}
```

Response `200`:
```json
{
  "success": true,
  "workspace_id": "6a327bb8-f9e4-4f0d-8f72-b0c39b3ef8ea",
  "session_id": "a4bb04f2-5d53-454f-87db-84ff01a49bd4",
  "status": "disconnected",
  "auth_session_files": "preserved"
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

### `GET /conversations/metrics?workspaceId={uuid}`
Returns abandonment and recovery metrics for dashboard cards.

Response `200`:
```json
{
  "data": {
    "abandoned_conversations": 12,
    "recovered_from_abandonment": 4,
    "revenue_recovered_from_abandonment": 780.5
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

## 3.6 Revenue intelligence

### `GET /revenue-intelligence/summary?workspaceId={uuid}`
Returns customer state counters and recovered revenue insights.

Response `200`:
```json
{
  "data": {
    "ready_to_buy": 15,
    "lost_customers": 8,
    "reactivatable": 12,
    "recovered_revenue": 1640.5,
    "average_conversion_probability": 0.63
  },
  "error": null
}
```

### `GET /revenue-intelligence/customers?workspaceId={uuid}&state={optional}&limit=100&offset=0`
Returns paginated customer revenue intelligence list.

Response `200`:
```json
{
  "data": {
    "items": [
      {
        "phone": "+51999999999",
        "state": "READY_TO_BUY",
        "conversion_probability": 0.8
      }
    ],
    "pagination": {
      "limit": 100,
      "offset": 0
    }
  },
  "error": null
}
```

## 3.7 Follow-up sequencer

### `GET /followup-sequencer/stats?workspaceId={uuid}`
Returns follow-up sequence performance counters.

Response `200`:
```json
{
  "data": {
    "sequences_started": 24,
    "sequences_cancelled": 9,
    "sequences_completed": 11,
    "sales_from_followups": 5
  },
  "error": null
}
```

## 3.8 Deal probability

### `GET /deal-probability/summary?workspaceId={uuid}`
Returns lead-state counters and average purchase probability.

Response `200`:
```json
{
  "data": {
    "ready_to_close": 10,
    "warm_leads": 25,
    "cold_leads": 43,
    "average_probability": 0.57
  },
  "error": null
}
```

## 3.9 Conversation heatmap

### `GET /conversation-heatmap?workspaceId={uuid}`
Returns stage-level conversation drop-off analytics for dashboard heatmap visualizations.

Response `200`:
```json
{
  "data": [
    {
      "stage": "GREETING",
      "message_count": 200,
      "unique_customers": 180,
      "dropoff_count": 18,
      "dropoff_rate": 0.1
    },
    {
      "stage": "PRICE_DISCUSSION",
      "message_count": 120,
      "unique_customers": 85,
      "dropoff_count": 40,
      "dropoff_rate": 0.47
    },
    {
      "stage": "CLOSING",
      "message_count": 60,
      "unique_customers": 52,
      "dropoff_count": 8,
      "dropoff_rate": 0.15
    }
  ],
  "error": null
}
```

## 3.10 Playbook engine

### `GET /playbook-engine/top?workspaceId={uuid}&limit=10`
Returns high-performing conversation playbooks where conversion rate is above workspace average.

Response `200`:
```json
{
  "data": [
    {
      "playbook": "RESERVATION_OFFER",
      "conversion_rate": 0.27
    },
    {
      "playbook": "DELIVERY_INCENTIVE",
      "conversion_rate": 0.21
    }
  ],
  "error": null
}
```

## 3.11 Revenue reports

### `GET /revenue-reports/latest?workspaceId={uuid}&reportType=DAILY|WEEKLY|MONTHLY`
Returns latest automated revenue report for selected report type.

Response `200`:
```json
{
  "data": {
    "period": "weekly",
    "period_start": "2026-03-02T00:00:00.000Z",
    "period_end": "2026-03-09T00:00:00.000Z",
    "total_leads": 86,
    "active_conversations": 41,
    "total_sales": 19,
    "revenue_generated": 3250,
    "revenue_recovered": 740,
    "conversion_rate": 0.22,
    "direct_sales": 6,
    "sales_after_followups": 5,
    "sales_after_offers": 4,
    "sales_after_recovery": 8
  },
  "error": null
}
```

### `GET /revenue-reports/history?workspaceId={uuid}&reportType={optional}&limit=20&offset=0`
Returns historical revenue reports.

Response `200`:
```json
{
  "data": {
    "items": [
      {
        "id": "d2b1fb97-e35a-401f-b63b-7fce2aa9f096",
        "report_type": "WEEKLY",
        "period_start": "2026-03-02T00:00:00.000Z",
        "period_end": "2026-03-09T00:00:00.000Z",
        "total_leads": 86,
        "active_conversations": 41,
        "total_sales": 19,
        "revenue_generated": 3250,
        "revenue_recovered": 740,
        "conversion_rate": 0.22,
        "direct_sales": 6,
        "sales_after_followups": 5,
        "sales_after_offers": 4,
        "sales_after_recovery": 8
      }
    ],
    "pagination": {
      "limit": 20,
      "offset": 0
    }
  },
  "error": null
}
```

## 3.12 Automation settings

### `GET /settings/automations?workspaceId={uuid}`
Returns workspace-level n8n automation webhook configuration.

Response `200`:
```json
{
  "data": {
    "workspace_id": "6a327bb8-f9e4-4f0d-8f72-b0c39b3ef8ea",
    "quick_recovery_webhook": "https://example.ngrok-free.dev/webhook/wa/quick-recovery",
    "followup_recovery_webhook": "https://example.ngrok-free.dev/webhook/wa/lead-recovery",
    "final_recovery_webhook": "https://example.ngrok-free.dev/webhook/wa/final-recovery"
  },
  "error": null
}
```

### `POST /settings/automations?workspaceId={uuid}`
Upserts workspace-level n8n automation webhook configuration.

Request:
```json
{
  "quick_recovery_webhook": "https://example.ngrok-free.dev/webhook/wa/quick-recovery",
  "followup_recovery_webhook": "https://example.ngrok-free.dev/webhook/wa/lead-recovery",
  "final_recovery_webhook": "https://example.ngrok-free.dev/webhook/wa/final-recovery"
}
```

Notes:
- Empty strings are accepted and normalized to `null`.
- Non-empty values must start with `http://` or `https://`.

Response `200`:
```json
{
  "data": {
    "workspace_id": "6a327bb8-f9e4-4f0d-8f72-b0c39b3ef8ea",
    "quick_recovery_webhook": "https://example.ngrok-free.dev/webhook/wa/quick-recovery",
    "followup_recovery_webhook": "https://example.ngrok-free.dev/webhook/wa/lead-recovery",
    "final_recovery_webhook": "https://example.ngrok-free.dev/webhook/wa/final-recovery"
  },
  "error": null
}
```

## 3.13 AI chatbot settings

### `GET /settings/ai-chatbot?workspaceId={uuid}`
Returns workspace-level AI chatbot webhook configuration.

Response `200`:
```json
{
  "data": {
    "workspace_id": "6a327bb8-f9e4-4f0d-8f72-b0c39b3ef8ea",
    "ai_router_webhook_url": "https://example.ngrok-free.dev/webhook/wa/ai-router"
  },
  "error": null
}
```

### `POST /settings/ai-chatbot?workspaceId={uuid}`
Upserts workspace-level AI router webhook URL.

Request:
```json
{
  "ai_router_webhook_url": "https://example.ngrok-free.dev/webhook/wa/ai-router"
}
```

Notes:
- Field is required and must start with `http://` or `https://`.
- Main versioned path is under `/api/v1`.
- Compatibility alias is available at `/api/settings/ai-chatbot`.

Response `200`:
```json
{
  "data": {
    "workspace_id": "6a327bb8-f9e4-4f0d-8f72-b0c39b3ef8ea",
    "ai_router_webhook_url": "https://example.ngrok-free.dev/webhook/wa/ai-router"
  },
  "error": null
}
```

## 3.14 Automation playbooks

### `GET /automations/playbooks?workspaceId={uuid}`
Returns playbook enablement status for workspace automations.

Response `200`:
```json
{
  "data": {
    "items": [
      {
        "playbook": "sales_recovery",
        "enabled": true
      }
    ],
    "running": ["sales_recovery"]
  },
  "error": null
}
```

### `POST /automations/playbooks?workspaceId={uuid}`
Enables or disables a workspace automation playbook.

Request:
```json
{
  "playbook": "sales_recovery",
  "enabled": true
}
```

Response `200`:
```json
{
  "data": {
    "workspace_id": "6a327bb8-f9e4-4f0d-8f72-b0c39b3ef8ea",
    "playbook": "sales_recovery",
    "enabled": true
  },
  "error": null
}
```

Notes:
- Main versioned path is under `/api/v1`.
- Compatibility alias is available at `/api/automations/playbooks`.

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

### `offer_recommended`
```json
{
  "event_id": "evt_01J...",
  "event_name": "offer_recommended",
  "workspace_id": "6a327bb8-f9e4-4f0d-8f72-b0c39b3ef8ea",
  "occurred_at": "2026-03-09T19:03:00Z",
  "payload": {
    "conversation_id": "fe7b7169-9b84-4d5f-949a-ed517a7cc702",
    "customer_phone": "+51999999999",
    "detected_objection": "PRICE_OBJECTION",
    "offer_type": "DISCOUNT_OFFER",
    "offer_message": "Hoy tenemos un descuento especial si confirmas hoy.",
    "triggered_at": "2026-03-09T19:03:00Z",
    "trigger_source": "inbound_message"
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

### `conversation_abandoned`
```json
{
  "event_id": "evt_01J...",
  "event_name": "conversation_abandoned",
  "workspace_id": "6a327bb8-f9e4-4f0d-8f72-b0c39b3ef8ea",
  "occurred_at": "2026-03-08T18:30:00Z",
  "payload": {
    "conversation_id": "fe7b7169-9b84-4d5f-949a-ed517a7cc702",
    "contact_id": "02e0a2f8-0ea7-4f5b-9f46-0477f664fe4a",
    "threshold_minutes": 30,
    "last_customer_message_at": "2026-03-08T18:00:00Z",
    "abandoned_at": "2026-03-08T18:30:00Z"
  }
}
```

### `manual_followup_trigger`
```json
{
  "event_id": "evt_01J...",
  "event_name": "manual_followup_trigger",
  "workspace_id": "6a327bb8-f9e4-4f0d-8f72-b0c39b3ef8ea",
  "occurred_at": "2026-03-08T20:10:00Z",
  "payload": {
    "conversation_id": "fe7b7169-9b84-4d5f-949a-ed517a7cc702",
    "contact_id": "02e0a2f8-0ea7-4f5b-9f46-0477f664fe4a",
    "customer_phone": "+51999999999",
    "reason": "agent_requested_followup"
  }
}
```

### `customer_ready_to_buy`
```json
{
  "event_id": "evt_01J...",
  "event_name": "customer_ready_to_buy",
  "workspace_id": "6a327bb8-f9e4-4f0d-8f72-b0c39b3ef8ea",
  "occurred_at": "2026-03-08T19:10:00Z",
  "payload": {
    "conversation_id": "fe7b7169-9b84-4d5f-949a-ed517a7cc702",
    "contact_id": "02e0a2f8-0ea7-4f5b-9f46-0477f664fe4a",
    "customer_phone": "+51999999999",
    "conversion_probability": 0.82,
    "last_activity_at": "2026-03-08T19:05:00Z"
  }
}
```

### `customer_lost`
```json
{
  "event_id": "evt_01J...",
  "event_name": "customer_lost",
  "workspace_id": "6a327bb8-f9e4-4f0d-8f72-b0c39b3ef8ea",
  "occurred_at": "2026-03-08T19:10:00Z",
  "payload": {
    "conversation_id": "fe7b7169-9b84-4d5f-949a-ed517a7cc702",
    "contact_id": "02e0a2f8-0ea7-4f5b-9f46-0477f664fe4a",
    "customer_phone": "+51999999999",
    "conversion_probability": 0.45,
    "last_activity_at": "2026-03-03T19:05:00Z"
  }
}
```

### `customer_reactivatable`
```json
{
  "event_id": "evt_01J...",
  "event_name": "customer_reactivatable",
  "workspace_id": "6a327bb8-f9e4-4f0d-8f72-b0c39b3ef8ea",
  "occurred_at": "2026-03-08T19:10:00Z",
  "payload": {
    "conversation_id": "fe7b7169-9b84-4d5f-949a-ed517a7cc702",
    "contact_id": "02e0a2f8-0ea7-4f5b-9f46-0477f664fe4a",
    "customer_phone": "+51999999999",
    "conversion_probability": 0.58,
    "last_activity_at": "2026-03-04T19:05:00Z"
  }
}
```

### `customer_ready_to_close`
```json
{
  "event_id": "evt_01J...",
  "event_name": "customer_ready_to_close",
  "workspace_id": "6a327bb8-f9e4-4f0d-8f72-b0c39b3ef8ea",
  "occurred_at": "2026-03-10T15:20:00Z",
  "payload": {
    "conversation_id": "fe7b7169-9b84-4d5f-949a-ed517a7cc702",
    "contact_id": "02e0a2f8-0ea7-4f5b-9f46-0477f664fe4a",
    "customer_phone": "+51999999999",
    "probability_score": 0.82,
    "lead_state": "READY_TO_CLOSE",
    "primary_signal": "PRICE_QUERY",
    "last_activity_at": "2026-03-10T15:18:00Z"
  }
}
```

### `customer_warm_lead`
```json
{
  "event_id": "evt_01J...",
  "event_name": "customer_warm_lead",
  "workspace_id": "6a327bb8-f9e4-4f0d-8f72-b0c39b3ef8ea",
  "occurred_at": "2026-03-10T15:20:00Z",
  "payload": {
    "conversation_id": "fe7b7169-9b84-4d5f-949a-ed517a7cc702",
    "contact_id": "02e0a2f8-0ea7-4f5b-9f46-0477f664fe4a",
    "customer_phone": "+51999999999",
    "probability_score": 0.56,
    "lead_state": "WARM_LEAD",
    "primary_signal": "DELIVERY_QUERY",
    "last_activity_at": "2026-03-10T15:18:00Z"
  }
}
```

### `customer_cold_lead`
```json
{
  "event_id": "evt_01J...",
  "event_name": "customer_cold_lead",
  "workspace_id": "6a327bb8-f9e4-4f0d-8f72-b0c39b3ef8ea",
  "occurred_at": "2026-03-10T15:20:00Z",
  "payload": {
    "conversation_id": "fe7b7169-9b84-4d5f-949a-ed517a7cc702",
    "contact_id": "02e0a2f8-0ea7-4f5b-9f46-0477f664fe4a",
    "customer_phone": "+51999999999",
    "probability_score": 0.22,
    "lead_state": "COLD_LEAD",
    "primary_signal": null,
    "last_activity_at": "2026-03-10T15:18:00Z"
  }
}
```

### `heatmap_insight_generated`
```json
{
  "event_id": "evt_01J...",
  "event_name": "heatmap_insight_generated",
  "workspace_id": "6a327bb8-f9e4-4f0d-8f72-b0c39b3ef8ea",
  "occurred_at": "2026-03-11T18:30:00Z",
  "payload": {
    "metric_id": "9a80b9a3-42df-410a-93ca-caa0f4a9f2fd",
    "stage_name": "PRICE_DISCUSSION",
    "message": "High drop-off detected at PRICE_DISCUSSION stage.",
    "message_count": 120,
    "unique_customers": 85,
    "dropoff_count": 40,
    "dropoff_rate": 0.47,
    "calculated_at": "2026-03-11T18:30:00Z"
  }
}
```

### `playbook_high_performance`
```json
{
  "event_id": "evt_01J...",
  "event_name": "playbook_high_performance",
  "workspace_id": "6a327bb8-f9e4-4f0d-8f72-b0c39b3ef8ea",
  "occurred_at": "2026-03-11T19:00:00Z",
  "payload": {
    "playbook_name": "RESERVATION_OFFER",
    "message_pattern": "reservation_offer",
    "message_count": 70,
    "sales_generated": 19,
    "conversion_rate": 0.27
  }
}
```

### `revenue_report_generated`
```json
{
  "event_id": "evt_01J...",
  "event_name": "revenue_report_generated",
  "workspace_id": "6a327bb8-f9e4-4f0d-8f72-b0c39b3ef8ea",
  "occurred_at": "2026-03-12T00:05:00Z",
  "payload": {
    "report_id": "d2b1fb97-e35a-401f-b63b-7fce2aa9f096",
    "report_type": "DAILY",
    "period_start": "2026-03-11T00:00:00.000Z",
    "period_end": "2026-03-12T00:00:00.000Z",
    "total_leads": 18,
    "active_conversations": 12,
    "total_sales": 4,
    "revenue_generated": 520,
    "revenue_recovered": 190,
    "conversion_rate": 0.22
  }
}
```

### `revenue_report_insight_generated`
```json
{
  "event_id": "evt_01J...",
  "event_name": "revenue_report_insight_generated",
  "workspace_id": "6a327bb8-f9e4-4f0d-8f72-b0c39b3ef8ea",
  "occurred_at": "2026-03-12T00:05:00Z",
  "payload": {
    "report_id": "d2b1fb97-e35a-401f-b63b-7fce2aa9f096",
    "report_type": "DAILY",
    "period_start": "2026-03-11T00:00:00.000Z",
    "period_end": "2026-03-12T00:00:00.000Z",
    "message": "Recovery automation is contributing significantly to sales.",
    "metadata": {
      "revenue_generated": 520,
      "revenue_recovered": 190
    }
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
- Date: 2026-03-07
- Change: Added abandoned conversation detector module, abandonment metrics endpoint, and domain event.
- Type: Non-breaking (new endpoint + event + conversation fields).
- Impact:
  - Added `GET /conversations/metrics`.
  - Added `conversation_abandoned` domain event contract.
  - Added `purchase_intent`, `abandoned`, and `abandoned_at` fields in conversations model.
- Date: 2026-03-07
- Change: Added revenue intelligence module with customer-state scoring, events, and dashboard endpoints.
- Type: Non-breaking (new endpoints + events + table).
- Impact:
  - Added `GET /revenue-intelligence/summary`.
  - Added `GET /revenue-intelligence/customers`.
  - Added `customer_ready_to_buy`, `customer_lost`, and `customer_reactivatable` domain events.
  - Added `customer_revenue_state` table.
- Date: 2026-03-07
- Change: Added smart follow-up sequencer module with multi-step automation and dashboard stats endpoint.
- Type: Non-breaking (new endpoint + table + event + worker integration).
- Impact:
  - Added `GET /followup-sequencer/stats`.
  - Added `manual_followup_trigger` event contract.
  - Added `followup_sequences` and `followup_sequence_steps` tables.
- Date: 2026-03-07
- Change: Added offer optimizer module with objection detection and optimized recommendation events.
- Type: Non-breaking (new event + table + worker integration).
- Impact:
  - Added `offer_recommended` event contract.
  - Added `offer_events` table.
  - Added offer optimizer background worker and sales-assistant event integration.
- Date: 2026-03-07
- Change: Added deal probability engine module with lead-state scoring, events, and summary endpoint.
- Type: Non-breaking (new endpoint + events + table + worker integration).
- Impact:
  - Added `GET /deal-probability/summary`.
  - Added `customer_ready_to_close`, `customer_warm_lead`, and `customer_cold_lead` event contracts.
  - Added `deal_probability` table.
- Date: 2026-03-07
- Change: Added conversation heatmap analytics module with stage drop-off metrics and insights integration.
- Type: Non-breaking (new endpoint + table + worker integration).
- Impact:
  - Added `GET /conversation-heatmap`.
  - Added `conversation_stage_metrics` table.
  - Added 30-minute heatmap worker and revenue-intelligence insight logging for high drop-off stages.
  - Added `heatmap_insight_generated` domain event contract.
- Date: 2026-03-07
- Change: Added conversation playbook engine module with high-performing strategy detection and event integration.
- Type: Non-breaking (new endpoint + table + worker + event).
- Impact:
  - Added `GET /playbook-engine/top`.
  - Added `conversation_playbooks` table.
  - Added hourly playbook analysis worker.
  - Added `playbook_high_performance` domain event contract.
- Date: 2026-03-07
- Change: Added auto revenue reports module with daily/weekly/monthly aggregation and revenue insights.
- Type: Non-breaking (new endpoints + table + worker + events).
- Impact:
  - Added `GET /revenue-reports/latest`.
  - Added `GET /revenue-reports/history`.
  - Added `revenue_reports` table.
  - Added daily revenue reports worker (24h).
  - Added `revenue_report_generated` and `revenue_report_insight_generated` domain event contracts.
- Date: 2026-03-07
- Change: Added workspace-level n8n automation settings endpoints and configurable webhook integration.
- Type: Non-breaking (new endpoints + table + runtime webhook calls).
- Impact:
  - Added `GET /settings/automations`.
  - Added `POST /settings/automations`.
  - Added `automation_settings` table.
  - Added runtime n8n webhook dispatch on inbound lead interactions.
- Date: 2026-03-07
- Change: Added automation playbooks API and workspace-level playbook gating for n8n recovery flows.
- Type: Non-breaking (new endpoints + table + runtime behavior gate).
- Impact:
  - Added `GET /automations/playbooks`.
  - Added `POST /automations/playbooks`.
  - Added `automation_playbooks` table.
  - n8n quick/follow-up/final recovery webhooks now run only when `sales_recovery` playbook is enabled.
- Date: 2026-03-07
- Change: Added configurable AI chatbot webhook settings and inbound forwarding endpoint integration.
- Type: Non-breaking (new endpoints + table extension + runtime webhook call).
- Impact:
  - Added `GET /settings/ai-chatbot`.
  - Added `POST /settings/ai-chatbot`.
  - Extended `automation_settings` with `ai_router_webhook_url`.
  - Added inbound message forwarding payload dispatch to workspace-configured AI router webhook.
- Date: 2026-03-07
- Change: Added onboarding disconnect endpoint for workspace-scoped WhatsApp session termination.
- Type: Non-breaking (new onboarding endpoint).
- Impact:
  - Added `POST /whatsapp/session/disconnect`.
  - Response now states session disconnect result and auth-session persistence behavior (`auth_session_files: preserved`).
