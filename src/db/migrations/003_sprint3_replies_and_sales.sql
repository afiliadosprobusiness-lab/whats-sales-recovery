ALTER TABLE recovery_attempts
  ADD COLUMN IF NOT EXISTS replied_at TIMESTAMPTZ;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.constraint_column_usage
    WHERE table_name = 'recovery_attempts'
      AND constraint_name = 'recovery_attempts_status_check'
  ) THEN
    ALTER TABLE recovery_attempts
      DROP CONSTRAINT recovery_attempts_status_check;
  END IF;
END
$$;

ALTER TABLE recovery_attempts
  ADD CONSTRAINT recovery_attempts_status_check
  CHECK (status IN ('scheduled', 'sent', 'replied', 'recovered', 'failed'));

CREATE TABLE IF NOT EXISTS sale_outcomes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  conversation_id UUID NOT NULL REFERENCES conversations(id),
  recovery_attempt_id UUID NOT NULL REFERENCES recovery_attempts(id),
  amount NUMERIC(12,2) NOT NULL,
  currency TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE sale_outcomes
  DROP COLUMN IF EXISTS is_recovered,
  DROP COLUMN IF EXISTS note;

UPDATE sale_outcomes
SET
  amount = COALESCE(amount, 0),
  currency = COALESCE(currency, 'PEN')
WHERE amount IS NULL OR currency IS NULL;

ALTER TABLE sale_outcomes
  ALTER COLUMN amount SET NOT NULL,
  ALTER COLUMN currency SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_sale_outcomes_conversation_id ON sale_outcomes(conversation_id);
