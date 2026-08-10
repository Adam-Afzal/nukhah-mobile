# Enforce the Wali Gate at the database level, not just client-side

Mobile (`lib/interestService.ts`) and the web app (inline Supabase calls in `ProfileDetail.tsx`/`Interests.tsx`) each implement interest expression/acceptance independently — there's no shared backend layer between them. The Wali Gate (see CONTEXT.md) needs to hold in both places without relying on two copies of the same check staying in sync.

**Decision**: enforce the Wali Gate as a Postgres-level check (RLS policy or trigger) on the `interests` table, rejecting inserts/updates from a sister profile missing any of the five wali fields. Client-side checks are added too, in both apps, purely for a good error message before the request round-trips — but the database is the source of truth.

**Considered Options**
- Client-side only, duplicated in both apps — no new backend work, but the rule lives in two places that must be kept in sync, and silently stops protecting anything if either client has a bug or a future third client (e.g. admin tooling) writes to `interests` directly.
- Database-level (chosen) — one migration to write and test, but can't be bypassed by a client bug or a new caller.
