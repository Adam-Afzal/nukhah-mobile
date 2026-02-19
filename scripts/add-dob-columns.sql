-- Add date_of_birth, beard_commitment, and hijab_commitment columns
-- Safe to run multiple times (uses IF NOT EXISTS pattern via DO blocks)

-- date_of_birth on all 4 tables
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'brother_application' AND column_name = 'date_of_birth'
  ) THEN
    ALTER TABLE brother_application ADD COLUMN date_of_birth TEXT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sister_application' AND column_name = 'date_of_birth'
  ) THEN
    ALTER TABLE sister_application ADD COLUMN date_of_birth TEXT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'brother' AND column_name = 'date_of_birth'
  ) THEN
    ALTER TABLE brother ADD COLUMN date_of_birth TEXT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sister' AND column_name = 'date_of_birth'
  ) THEN
    ALTER TABLE sister ADD COLUMN date_of_birth TEXT;
  END IF;
END $$;

-- beard_commitment on brother profile
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'brother' AND column_name = 'beard_commitment'
  ) THEN
    ALTER TABLE brother ADD COLUMN beard_commitment TEXT;
  END IF;
END $$;

-- hijab_commitment on sister profile
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sister' AND column_name = 'hijab_commitment'
  ) THEN
    ALTER TABLE sister ADD COLUMN hijab_commitment TEXT;
  END IF;
END $$;
