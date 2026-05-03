-- Add new profile fields
ALTER TABLE brother ADD COLUMN IF NOT EXISTS willing_to_relocate boolean DEFAULT false;
ALTER TABLE sister ADD COLUMN IF NOT EXISTS willing_to_relocate boolean DEFAULT false;

-- Add "what I want" embedding vector to both profile tables
ALTER TABLE brother ADD COLUMN IF NOT EXISTS profile_embedding_want vector(1536);
ALTER TABLE sister ADD COLUMN IF NOT EXISTS profile_embedding_want vector(1536);

-- Score specific sister profiles for a brother (no threshold — used by local tab)
-- Cross-compares: brother's want vs sister's am, and sister's want vs brother's am
CREATE OR REPLACE FUNCTION score_sister_profiles(
  brother_id_param uuid,
  sister_ids uuid[]
)
RETURNS TABLE (id uuid, vector_score float)
LANGUAGE sql
AS $$
  SELECT
    s.id,
    CASE
      WHEN b.profile_embedding IS NULL OR s.profile_embedding IS NULL THEN NULL
      WHEN b.profile_embedding_want IS NOT NULL AND s.profile_embedding_want IS NOT NULL THEN
        -- Cross-comparison: each side's wants vs the other's self-description
        (
          (1 - (b.profile_embedding_want <=> s.profile_embedding)) +
          (1 - (s.profile_embedding_want <=> b.profile_embedding))
        ) / 2.0
      ELSE
        -- Fallback: single-vector similarity while embeddings are being migrated
        1 - (b.profile_embedding <=> s.profile_embedding)
    END AS vector_score
  FROM sister s
  CROSS JOIN (
    SELECT profile_embedding, profile_embedding_want
    FROM brother
    WHERE brother.id = brother_id_param
  ) b
  WHERE s.id = ANY(sister_ids)
$$;

-- Score specific brother profiles for a sister (no threshold — used by local tab)
CREATE OR REPLACE FUNCTION score_brother_profiles(
  sister_id_param uuid,
  brother_ids uuid[]
)
RETURNS TABLE (id uuid, vector_score float)
LANGUAGE sql
AS $$
  SELECT
    b.id,
    CASE
      WHEN s.profile_embedding IS NULL OR b.profile_embedding IS NULL THEN NULL
      WHEN s.profile_embedding_want IS NOT NULL AND b.profile_embedding_want IS NOT NULL THEN
        (
          (1 - (s.profile_embedding_want <=> b.profile_embedding)) +
          (1 - (b.profile_embedding_want <=> s.profile_embedding))
        ) / 2.0
      ELSE
        1 - (s.profile_embedding <=> b.profile_embedding)
    END AS vector_score
  FROM brother b
  CROSS JOIN (
    SELECT profile_embedding, profile_embedding_want
    FROM sister
    WHERE sister.id = sister_id_param
  ) s
  WHERE b.id = ANY(brother_ids)
$$;

-- Updated find_sister_matches — returns vector_score (renamed from similarity) with cross-comparison
-- Lower threshold (0.40) because cross-comparison scores differently than single-vector
CREATE OR REPLACE FUNCTION find_sister_matches(
  brother_id_param uuid,
  match_threshold float DEFAULT 0.40,
  match_limit int DEFAULT 50
)
RETURNS TABLE (id uuid, vector_score float)
LANGUAGE sql
AS $$
  SELECT id, vector_score FROM (
    SELECT
      s.id,
      CASE
        WHEN b.profile_embedding_want IS NOT NULL AND s.profile_embedding_want IS NOT NULL THEN
          (
            (1 - (b.profile_embedding_want <=> s.profile_embedding)) +
            (1 - (s.profile_embedding_want <=> b.profile_embedding))
          ) / 2.0
        ELSE
          1 - (b.profile_embedding <=> s.profile_embedding)
      END AS vector_score
    FROM sister s
    CROSS JOIN (
      SELECT profile_embedding, profile_embedding_want
      FROM brother
      WHERE brother.id = brother_id_param
    ) b
    WHERE b.profile_embedding IS NOT NULL
      AND s.profile_embedding IS NOT NULL
  ) scored
  WHERE scored.vector_score > match_threshold
  ORDER BY vector_score DESC
  LIMIT match_limit
$$;

-- Updated find_brother_matches
CREATE OR REPLACE FUNCTION find_brother_matches(
  sister_id_param uuid,
  match_threshold float DEFAULT 0.40,
  match_limit int DEFAULT 50
)
RETURNS TABLE (id uuid, vector_score float)
LANGUAGE sql
AS $$
  SELECT id, vector_score FROM (
    SELECT
      b.id,
      CASE
        WHEN s.profile_embedding_want IS NOT NULL AND b.profile_embedding_want IS NOT NULL THEN
          (
            (1 - (s.profile_embedding_want <=> b.profile_embedding)) +
            (1 - (b.profile_embedding_want <=> s.profile_embedding))
          ) / 2.0
        ELSE
          1 - (s.profile_embedding <=> b.profile_embedding)
      END AS vector_score
    FROM brother b
    CROSS JOIN (
      SELECT profile_embedding, profile_embedding_want
      FROM sister
      WHERE sister.id = sister_id_param
    ) s
    WHERE s.profile_embedding IS NOT NULL
      AND b.profile_embedding IS NOT NULL
  ) scored
  WHERE scored.vector_score > match_threshold
  ORDER BY vector_score DESC
  LIMIT match_limit
$$;
