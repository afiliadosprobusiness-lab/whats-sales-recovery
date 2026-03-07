CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS workspaces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS workspace_settings (
  workspace_id UUID PRIMARY KEY REFERENCES workspaces(id) ON DELETE CASCADE,
  chatbot_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  chatbot_style TEXT,
  chatbot_product_context TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS automation_settings (
  workspace_id UUID PRIMARY KEY REFERENCES workspaces(id) ON DELETE CASCADE,
  quick_recovery_webhook TEXT,
  followup_recovery_webhook TEXT,
  final_recovery_webhook TEXT,
  ai_router_webhook_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS automation_playbooks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (workspace_id, name)
);

CREATE TABLE IF NOT EXISTS whatsapp_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  status TEXT NOT NULL CHECK (status IN ('pending_qr', 'connected', 'disconnected')),
  auth_blob TEXT,
  qr_code TEXT,
  last_seen_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  phone_e164 TEXT NOT NULL,
  display_name TEXT,
  opt_out BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (workspace_id, phone_e164)
);

CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  contact_id UUID NOT NULL REFERENCES contacts(id),
  whatsapp_session_id UUID NOT NULL REFERENCES whatsapp_sessions(id),
  status TEXT NOT NULL CHECK (status IN ('open', 'idle', 'closed')) DEFAULT 'open',
  purchase_intent BOOLEAN NOT NULL DEFAULT FALSE,
  abandoned BOOLEAN NOT NULL DEFAULT FALSE,
  abandoned_at TIMESTAMPTZ,
  last_customer_message_at TIMESTAMPTZ,
  last_business_message_at TIMESTAMPTZ,
  idle_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  conversation_id UUID NOT NULL REFERENCES conversations(id),
  provider_message_id TEXT NOT NULL UNIQUE,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  message_type TEXT NOT NULL DEFAULT 'text',
  body_text TEXT,
  provider_status TEXT,
  sent_at TIMESTAMPTZ,
  received_at TIMESTAMPTZ,
  raw_payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  name TEXT NOT NULL,
  body TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS recovery_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  conversation_id UUID NOT NULL REFERENCES conversations(id),
  contact_id UUID NOT NULL REFERENCES contacts(id),
  status TEXT NOT NULL CHECK (status IN ('scheduled', 'sent', 'replied', 'recovered', 'failed')) DEFAULT 'scheduled',
  scheduled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  replied_at TIMESTAMPTZ,
  failed_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sale_outcomes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  conversation_id UUID NOT NULL REFERENCES conversations(id),
  recovery_attempt_id UUID NOT NULL REFERENCES recovery_attempts(id),
  amount NUMERIC(12,2) NOT NULL,
  currency TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('queued', 'running', 'completed', 'failed')) DEFAULT 'queued',
  contacts_total INTEGER NOT NULL DEFAULT 0,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS campaign_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  contact_id UUID NOT NULL REFERENCES contacts(id),
  status TEXT NOT NULL CHECK (status IN ('pending', 'sent', 'failed', 'replied', 'recovered')) DEFAULT 'pending',
  sent_at TIMESTAMPTZ,
  replied_at TIMESTAMPTZ,
  failed_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (campaign_id, contact_id)
);

CREATE TABLE IF NOT EXISTS campaign_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  campaign_contact_id UUID NOT NULL REFERENCES campaign_contacts(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  message_text TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('scheduled', 'processing', 'sent', 'failed', 'replied')) DEFAULT 'scheduled',
  provider_message_id TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  failed_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chatbot_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  conversation_id UUID NOT NULL REFERENCES conversations(id),
  customer_message TEXT NOT NULL,
  bot_response TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customer_revenue_state (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  customer_phone TEXT NOT NULL,
  state TEXT NOT NULL CHECK (state IN ('READY_TO_BUY', 'LOST_CUSTOMER', 'REACTIVATABLE', 'ACTIVE_CONVERSATION')),
  conversion_probability NUMERIC(5,4) NOT NULL DEFAULT 0,
  last_activity_at TIMESTAMPTZ NOT NULL,
  last_intent_detected_at TIMESTAMPTZ,
  revenue_recovered NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (workspace_id, conversation_id)
);

CREATE TABLE IF NOT EXISTS followup_sequences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  customer_phone TEXT NOT NULL,
  sequence_status TEXT NOT NULL CHECK (sequence_status IN ('active', 'completed', 'cancelled')) DEFAULT 'active',
  current_step INTEGER NOT NULL DEFAULT 0,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS followup_sequence_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sequence_id UUID NOT NULL REFERENCES followup_sequences(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL CHECK (step_number > 0),
  delay_minutes INTEGER NOT NULL CHECK (delay_minutes > 0),
  message_template TEXT NOT NULL,
  sent_at TIMESTAMPTZ,
  status TEXT NOT NULL CHECK (status IN ('pending', 'sent', 'cancelled')) DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (sequence_id, step_number)
);

CREATE TABLE IF NOT EXISTS offer_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  customer_phone TEXT NOT NULL,
  detected_objection TEXT NOT NULL CHECK (
    detected_objection IN (
      'PRICE_OBJECTION',
      'DELAY_OBJECTION',
      'AVAILABILITY_OBJECTION',
      'DELIVERY_QUESTION'
    )
  ),
  offer_type TEXT NOT NULL CHECK (
    offer_type IN (
      'DISCOUNT_OFFER',
      'URGENCY_OFFER',
      'BONUS_OFFER',
      'DELIVERY_INCENTIVE',
      'RESERVATION_OFFER'
    )
  ),
  offer_message TEXT NOT NULL,
  triggered_at TIMESTAMPTZ NOT NULL,
  converted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS deal_probability (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  customer_phone TEXT NOT NULL,
  probability_score NUMERIC(5,4) NOT NULL CHECK (probability_score >= 0 AND probability_score <= 1),
  lead_state TEXT NOT NULL CHECK (
    lead_state IN ('READY_TO_CLOSE', 'WARM_LEAD', 'COLD_LEAD')
  ),
  last_calculated_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (workspace_id, conversation_id)
);

CREATE TABLE IF NOT EXISTS domain_event_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  event_name TEXT NOT NULL,
  aggregate_type TEXT NOT NULL,
  aggregate_id UUID NOT NULL,
  correlation_id UUID,
  payload JSONB NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);
CREATE INDEX IF NOT EXISTS idx_conversations_idle_at ON conversations(idle_at);
CREATE INDEX IF NOT EXISTS idx_conversations_purchase_intent ON conversations(purchase_intent, status, last_customer_message_at);
CREATE INDEX IF NOT EXISTS idx_conversations_abandoned ON conversations(abandoned);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_recovery_attempts_conversation_id ON recovery_attempts(conversation_id);
CREATE INDEX IF NOT EXISTS idx_recovery_attempts_status ON recovery_attempts(status);
CREATE INDEX IF NOT EXISTS idx_recovery_attempts_created_at ON recovery_attempts(created_at);
CREATE INDEX IF NOT EXISTS idx_sale_outcomes_conversation_id ON sale_outcomes(conversation_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_workspace_created_at ON campaigns(workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_campaign_contacts_campaign_status ON campaign_contacts(campaign_id, status);
CREATE INDEX IF NOT EXISTS idx_campaign_contacts_workspace_contact ON campaign_contacts(workspace_id, contact_id);
CREATE INDEX IF NOT EXISTS idx_campaign_messages_status_scheduled_at ON campaign_messages(status, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_campaign_messages_campaign_contact ON campaign_messages(campaign_contact_id);
CREATE INDEX IF NOT EXISTS idx_workspace_settings_chatbot_enabled ON workspace_settings(chatbot_enabled);
CREATE INDEX IF NOT EXISTS idx_chatbot_logs_workspace_created_at ON chatbot_logs(workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chatbot_logs_conversation_id ON chatbot_logs(conversation_id);
CREATE INDEX IF NOT EXISTS idx_customer_revenue_state_workspace_state ON customer_revenue_state(workspace_id, state);
CREATE INDEX IF NOT EXISTS idx_customer_revenue_state_workspace_probability ON customer_revenue_state(workspace_id, conversion_probability DESC);
CREATE INDEX IF NOT EXISTS idx_customer_revenue_state_last_activity ON customer_revenue_state(last_activity_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_followup_sequences_active_unique ON followup_sequences(workspace_id, conversation_id) WHERE sequence_status = 'active';
CREATE INDEX IF NOT EXISTS idx_followup_sequences_workspace_status ON followup_sequences(workspace_id, sequence_status, started_at);
CREATE INDEX IF NOT EXISTS idx_followup_sequences_phone_status ON followup_sequences(workspace_id, customer_phone, sequence_status);
CREATE INDEX IF NOT EXISTS idx_followup_steps_sequence_status_step ON followup_sequence_steps(sequence_id, status, step_number);
CREATE INDEX IF NOT EXISTS idx_offer_events_workspace_triggered ON offer_events(workspace_id, triggered_at DESC);
CREATE INDEX IF NOT EXISTS idx_offer_events_workspace_conversation ON offer_events(workspace_id, conversation_id, triggered_at DESC);
CREATE INDEX IF NOT EXISTS idx_offer_events_workspace_objection ON offer_events(workspace_id, detected_objection, triggered_at DESC);
CREATE INDEX IF NOT EXISTS idx_offer_events_workspace_converted ON offer_events(workspace_id, converted);
CREATE INDEX IF NOT EXISTS idx_deal_probability_workspace_state ON deal_probability(workspace_id, lead_state);
CREATE INDEX IF NOT EXISTS idx_deal_probability_workspace_score ON deal_probability(workspace_id, probability_score DESC);
CREATE INDEX IF NOT EXISTS idx_deal_probability_last_calculated ON deal_probability(last_calculated_at DESC);
CREATE INDEX IF NOT EXISTS idx_domain_event_logs_event_name ON domain_event_logs(event_name);
CREATE INDEX IF NOT EXISTS idx_automation_playbooks_workspace_enabled ON automation_playbooks(workspace_id, enabled);
