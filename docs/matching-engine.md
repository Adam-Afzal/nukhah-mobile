# How the matching engine actually works

Embeddings, pgvector, and where "RAG" does and doesn't belong. Written from the actual code, not from what the feature is usually assumed to do.

## Correction: this is not RAG

- **Not RAG.** No LLM ever generates text from retrieved data. Nothing is "augmented" — the pipeline ends in arithmetic, not a language model response.
- **Embeddings + pgvector.** What's actually built: OpenAI embeddings compared with pgvector's cosine-distance operator, blended with rule-based scoring. That's semantic similarity search — a real, separate technique that RAG happens to also use for its retrieval half.

Resume/portfolio line, corrected:

> Designed an AI-powered matching engine using OpenAI embeddings and vector similarity search (pgvector) to compute compatibility scores, improving match quality for users — over 100 applications to date.

## Concepts

- **Embedding** — a fixed-length vector (here, 1536 numbers) representing a piece of text, produced by a model, such that semantically similar text lands near semantically similar text in that space. Comparison needs a distance metric; vectors from different models can't be compared against each other.
- **Chunking** — splitting a long source document into smaller pieces before embedding, needed only when a document is too long to embed as one unit or when retrieval needs to return a sub-section rather than the whole thing. **Doesn't apply here** — every embedded string in this app is a short, deterministically-generated sentence, nowhere near chunk-worthy length.
- **pgvector** — a Postgres extension adding a `vector` column type and distance operators (`<->` Euclidean, `<=>` cosine, `<#>` inner product), so nearest-neighbor search runs as ordinary SQL alongside relational data. **This is the retrieval mechanism this app actually uses.**
- **RAG** — Retrieval-Augmented Generation. Retrieve relevant chunks, inject them into an LLM prompt, have the LLM generate an answer grounded in that content. The generation step is the defining part — retrieval without generation is just semantic search.

## Per-profile data: two vectors, not one

Every brother/sister profile stores two separate embeddings, each built from its own fixed text template and embedded independently:

| Column | Built by | Purpose |
|---|---|---|
| `profile_embedding` | `generateWhoIAmText()` | Self-description — "who I am" |
| `profile_embedding_want` | `generateWhatIWantText()` | Stated preferences — "what I want" |

Two vectors exist because matchmaking isn't about two people *sounding similar* — it's about whether what one person wants lines up with who the other person is. A single combined vector can only answer "do these two sound alike," not "does he want what she offers."

### What feeds each template

Both templates concatenate labeled fragments from user-entered data — always the user's own words or selections, never system-inferred. What the system contributes is the sentence structure and labels around them, plus one auto-inserted sentence for married brothers.

| Field | Input type | Feeds |
|---|---|---|
| `personality` | free text | who I am |
| `hobbies_and_interests` | free text | who I am |
| `location_city` / `location_country` | text | who I am |
| `ethnicity` | dropdown | who I am |
| `date_of_birth` | date → computed age | who I am |
| `build` | dropdown | who I am |
| `marital_status` | dropdown | who I am (+ auto sentence if married) |
| `children` | boolean | who I am |
| `prayer_consistency` | dropdown | who I am |
| `open_to_hijrah` | boolean | who I am |
| `willing_to_relocate` | boolean | who I am |
| `beard_commitment` / `hijab_commitment` | dropdown | who I am |
| `open_to_polygyny` | boolean | who I am |
| `living_arrangements` | dropdown | who I am |
| `other_spouse_criteria` | free text | what I want |
| `dealbreakers` | free text | what I want |
| `preferred_ethnicity` | multi-select | what I want |

**Worked example** — a sister's "who I am" string, as actually assembled:

```
Personality: warm and family-oriented. Hobbies and interests: reading, cooking.
Location: London, UK. Ethnicity: Pakistani. Age: 26. Marital status: single.
Has children: no. Prayer consistency: five daily prayers. Open to hijrah: yes.
Willing to relocate: yes. Hijab: full hijab. Open to polygyny: no.
Living arrangements: with family
```

A brother's "what I want" string is much thinner — typically two or three sentences from `other_spouse_criteria`, `dealbreakers`, and `preferred_ethnicity` alone.

## Generation: text → vector, two separate API calls

1. **Build two template strings.** `generateWhoIAmText()` and `generateWhatIWantText()` run client-side over the saved profile fields.
2. **Two sequential, independent calls.** `generateEmbedding(whoIAmText)`, `await`ed, then `generateEmbedding(whatIWantText)` — not parallel, not batched. Each is a full round trip to the `generate-embedding` edge function.
3. **Edge function calls OpenAI.** One `input` string per request to `text-embedding-3-small`. One string in, one 1536-number vector out — `data.data[0].embedding`.
4. **Stored back on the profile row.** `profile_embedding` always gets written. `profile_embedding_want` is skipped (stays `NULL`) if the source text was empty — no criteria, no dealbreakers, no preferred ethnicity.

A profile with a null `profile_embedding_want` isn't excluded from matching — see the fallback branch below.

## The math: cosine similarity via pgvector

For two vectors, cosine similarity is the cosine of the angle between them — direction only, magnitude ignored:

```
cos_sim(A, B) = (A · B) / (‖A‖ × ‖B‖)
```

pgvector's `<=>` operator returns cosine *distance*, the inverse: `1 - cos_sim(A, B)`. Every query in this codebase flips it back with `1 - (a <=> b)`, recovering plain similarity — 0 (unrelated) to roughly 1 (near-identical direction).

## Cross-comparison: his want vs. her am, and back again

Matching a brother against a sister runs *two* cosine comparisons, not one, then averages them:

```
sim1 = cos_sim(his_want_vector, her_am_vector)
sim2 = cos_sim(her_want_vector, his_am_vector)

vectorScore = (sim1 + sim2) / 2     -- still a single 0-1 number
```

Straight from `find_sister_matches`:

```sql
(
  (1 - (b.profile_embedding_want <=> s.profile_embedding)) +
  (1 - (s.profile_embedding_want <=> b.profile_embedding))
) / 2.0
```

If either side's `_want` vector is `NULL`, the whole expression falls back to a single plain comparison: `cos_sim(his_am, her_am)`.

This all runs **inside Postgres**, called from the client as an RPC (`supabase.rpc('find_sister_matches', …)`). Two query shapes exist: `find_*_matches` scores every candidate row with a `vector_score > 0.40` threshold and a 200-row limit; `score_*_profiles` scores a specific ID list with no threshold, used for masjid-local browsing.

> No `CREATE INDEX ... USING ivfflat / hnsw` exists anywhere in the tracked SQL for either column — matches are exact brute-force scans, fine at current scale, worth an ANN index once the profile tables grow.

## Hard rules: the deterministic backstop

`calculateHardRuleScore` runs entirely client-side over structured fields — no embeddings involved at all. It exists because some incompatibilities need to be exact, not "pretty similar": a married brother matched against a sister who isn't open to polygyny must score `0.0`, not a fuzzy mid-range number an embedding might produce.

| Check | Logic |
|---|---|
| Polygyny | Brother married + sister not open → hard 0.0 |
| Ethnicity preference | Their ethnicity in my preferred list → 1.0, else 0.2 |
| Living arrangements | Exact match → 1.0, else 0.5 |
| Hijrah alignment | Both agree → 0.8–1.0, mismatch → 0.2 |
| Willing to relocate | Both flexible → 1.0, one → 0.7, neither → 0.4 |

Note the overlap: ethnicity, living arrangements, marital status/polygyny, hijrah, and relocation all also appear inside the embedding text itself. That's deliberate redundancy, not a bug — the embedding captures these *fuzzily*, blended in among personality and hobbies; the hard-rule layer re-checks the same signals as exact conditionals for the cases where fuzzy proximity isn't good enough.

## Final blend: 70% vector, 30% rules

```
compatibility_score = vectorScore * 0.7 + hardRuleScore * 0.3    -- clamped 0-1
```

By this point both inputs are already plain numbers — the 1536-dimension vectors themselves never reach this line, only the scalar `vectorScore` that Postgres already reduced them to. `vectorScore` can be `null` (embeddings not yet generated), in which case the score falls back to `hardRuleScore` alone.

## Reference: where this lives in the repo

| File | Contains |
|---|---|
| `lib/embeddingService.ts` | text templates, embedding calls, scoring, blend |
| `supabase/functions/generate-embedding/index.ts` | OpenAI call — `text-embedding-3-small` |
| `scripts/add-compatibility-embeddings.sql` | match/score SQL functions, pgvector columns |
| `app/(auth)/index.tsx` | calls the RPCs, blends, renders match list |
