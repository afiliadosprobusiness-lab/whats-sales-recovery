ALTER TABLE recovery_attempts
  ADD COLUMN IF NOT EXISTS contact_id UUID REFERENCES contacts(id),
  ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS failed_reason TEXT;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'recovery_attempts'
      AND column_name = 'scheduled_for'
  ) THEN
    UPDATE recovery_attempts
    SET scheduled_at = COALESCE(scheduled_at, scheduled_for, created_at)
    WHERE scheduled_at IS NULL;
  ELSE
    UPDATE recovery_attempts
    SET scheduled_at = COALESCE(scheduled_at, created_at)
    WHERE scheduled_at IS NULL;
  END IF;
END
$$;

ALTER TABLE recovery_attempts
  ALTER COLUMN scheduled_at SET NOT NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'recovery_attempts'
      AND column_name = 'failure_reason'
  ) THEN
    UPDATE recovery_attempts
    SET failed_reason = COALESCE(failed_reason, failure_reason)
    WHERE failed_reason IS NULL;
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_recovery_attempts_status ON recovery_attempts(status);
CREATE INDEX IF NOT EXISTS idx_recovery_attempts_created_at ON recovery_attempts(created_at);
