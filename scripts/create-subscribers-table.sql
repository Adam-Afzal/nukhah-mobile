-- Create subscribers table (run once — skip if table already exists in Supabase)
CREATE TABLE IF NOT EXISTS subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  subscribed boolean NOT NULL DEFAULT false,
  provider text,                        -- 'revenuecat'
  provider_customer_id text,            -- RevenueCat originalAppUserId
  provider_subscription_id text,
  plan text,                            -- 'monthly'
  subscribed_at timestamptz,
  expires_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT subscribers_user_id_key UNIQUE (user_id)
);

-- Index for fast lookup by user
CREATE INDEX IF NOT EXISTS idx_subscribers_user_id ON subscribers (user_id);
CREATE INDEX IF NOT EXISTS idx_subscribers_provider_subscription_id
  ON subscribers (provider_subscription_id)
  WHERE provider_subscription_id IS NOT NULL;

-- app_settings table (used for testing_mode flag)
CREATE TABLE IF NOT EXISTS app_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Seed testing_mode = false (change to true in Supabase dashboard when testing)
INSERT INTO app_settings (key, value)
VALUES ('testing_mode', 'false')
ON CONFLICT (key) DO NOTHING;
