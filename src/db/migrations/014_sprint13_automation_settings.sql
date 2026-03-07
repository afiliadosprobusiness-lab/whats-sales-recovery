CREATE TABLE IF NOT EXISTS automation_settings (
  workspace_id UUID PRIMARY KEY REFERENCES workspaces(id) ON DELETE CASCADE,
  quick_recovery_webhook TEXT,
  followup_recovery_webhook TEXT,
  final_recovery_webhook TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
