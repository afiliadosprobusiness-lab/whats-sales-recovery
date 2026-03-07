# RecuperaVentas - MVP Backlog V2 (Fastest Validation)

Scope locked:
- Detect conversation inactivity.
- Send recovery message automatically.
- Track recovered conversations and recovered sales.

Architecture base:
- WhatsApp Web session automation (`whatsapp-web.js` or `Baileys`).
- Ingestion via session event listeners (no webhooks).

---

## Sprint 1
Focus: WhatsApp session connection + message ingestion.

### Components
- `whatsapp-session-manager`
- `message-ingestion`
- `conversation-tracker`

### Tasks
1. Implement WhatsApp session bootstrap (`start`, `stop`, `status`).
2. Implement QR generation endpoint and frontend polling flow.
3. Persist session state (`pending_qr`, `connected`, `disconnected`) in `wa_sessions`.
4. Restore session on service restart.
5. Subscribe to WhatsApp message events from active session.
6. Normalize inbound messages and persist to `messages`.
7. Upsert `contacts` and create/update `conversations`.
8. Update conversation timestamps (`last_customer_message_at`, `last_business_message_at`).
9. Basic conversation list endpoint: `GET /conversations`.

### Sprint 1 success criteria
1. User scans QR and connects account.
2. Incoming WhatsApp messages appear in DB and are attached to conversations.

---

## Sprint 2
Focus: Idle detection + recovery message automation.

### Components
- `idle-detector`
- `recovery-engine`
- `message-sender`

### Tasks
1. Add configurable inactivity threshold (default 24h).
2. Build periodic idle scan job over open conversations.
3. Mark eligible conversations as `idle`.
4. Emit and persist `conversation_idle`.
5. Implement recovery eligibility rules:
   - conversation is idle
   - not closed
   - no opt-out
   - no recent recovery duplication
6. Create `recovery_attempts` records.
7. Emit and persist `recovery_triggered`.
8. Send recovery message through WhatsApp active session.
9. Persist send result and update attempt status (`sent|failed`).

### Sprint 2 success criteria
1. Idle conversation triggers one automatic follow-up.
2. Recovery attempt status is visible and auditable.

---

## Sprint 3
Focus: Reply detection + recovered sales tracking + simple dashboard.

### Components
- `message-ingestion`
- `conversation-tracker`
- `recovery-engine`

### Tasks
1. Detect customer reply after recovery send.
2. Link reply to latest active recovery attempt.
3. Mark attempt as `replied`.
4. Emit and persist `customer_replied`.
5. Implement `POST /recoveries/{recovery_id}/mark-sale`.
6. Persist recovered sale in `sale_outcomes`.
7. Emit and persist `sale_recovered`.
8. Add basic dashboard metrics page with 4 counters:
   - idle conversations
   - recovery messages sent
   - customers replied
   - sales recovered

### Sprint 3 success criteria
1. Team can confirm which recoveries got replies.
2. Team can mark and track recovered sales.
3. Dashboard shows basic MVP validation numbers.

---

## Prioritization notes
1. Do not add features outside the 3-core outcomes.
2. If timeline is tight, ship dashboard as API counters first, UI second.
3. Keep one active recovery template in MVP to reduce complexity.
