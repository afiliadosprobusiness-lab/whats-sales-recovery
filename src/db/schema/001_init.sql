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
CREATE INDEX IF NOT EXISTS idx_domain_event_logs_event_name ON domain_event_logs(event_name);
