-- Add wali contact columns to sister table
ALTER TABLE sister
  ADD COLUMN IF NOT EXISTS wali_name TEXT,
  ADD COLUMN IF NOT EXISTS wali_relationship TEXT,
  ADD COLUMN IF NOT EXISTS wali_phone TEXT,
  ADD COLUMN IF NOT EXISTS wali_email TEXT,
  ADD COLUMN IF NOT EXISTS wali_preferred_contact TEXT;
