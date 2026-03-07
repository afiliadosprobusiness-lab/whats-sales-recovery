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

CREATE INDEX IF NOT EXISTS idx_campaigns_workspace_created_at
  ON campaigns(workspace_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_campaign_contacts_campaign_status
  ON campaign_contacts(campaign_id, status);

CREATE INDEX IF NOT EXISTS idx_campaign_contacts_workspace_contact
  ON campaign_contacts(workspace_id, contact_id);

CREATE INDEX IF NOT EXISTS idx_campaign_messages_status_scheduled_at
  ON campaign_messages(status, scheduled_at);

CREATE INDEX IF NOT EXISTS idx_campaign_messages_campaign_contact
  ON campaign_messages(campaign_contact_id);
