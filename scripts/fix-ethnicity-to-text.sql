-- Fix ethnicity column: convert text[] to text on both tables

-- Brother: change column from text[] to text
ALTER TABLE brother ALTER COLUMN ethnicity TYPE text;

-- Sister: strip curly braces from any array-like strings (e.g. "{Arab}" -> "Arab")
UPDATE sister
SET ethnicity = TRIM(BOTH '{}' FROM ethnicity)
WHERE ethnicity IS NOT NULL AND ethnicity LIKE '{%}';
