ALTER TABLE automation_settings
ADD COLUMN IF NOT EXISTS ai_router_webhook_url TEXT;
