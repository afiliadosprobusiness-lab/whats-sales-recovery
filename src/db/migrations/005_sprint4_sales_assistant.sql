CREATE TABLE IF NOT EXISTS workspace_settings (
  workspace_id UUID PRIMARY KEY REFERENCES workspaces(id) ON DELETE CASCADE,
  chatbot_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  chatbot_style TEXT,
  chatbot_product_context TEXT,
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

CREATE INDEX IF NOT EXISTS idx_workspace_settings_chatbot_enabled
  ON workspace_settings(chatbot_enabled);

CREATE INDEX IF NOT EXISTS idx_chatbot_logs_workspace_created_at
  ON chatbot_logs(workspace_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_chatbot_logs_conversation_id
  ON chatbot_logs(conversation_id);
