-- Add payment provider columns to subscribers table
-- Run this migration before deploying the payment feature

ALTER TABLE subscribers
  ADD COLUMN IF NOT EXISTS provider text,
  ADD COLUMN IF NOT EXISTS provider_customer_id text,
  ADD COLUMN IF NOT EXISTS provider_subscription_id text,
  ADD COLUMN IF NOT EXISTS plan text,
  ADD COLUMN IF NOT EXISTS subscribed_at timestamptz,
  ADD COLUMN IF NOT EXISTS expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz;

-- Index for looking up by provider subscription ID (used by webhook)
CREATE INDEX IF NOT EXISTS idx_subscribers_provider_subscription_id
  ON subscribers (provider_subscription_id)
  WHERE provider_subscription_id IS NOT NULL;
