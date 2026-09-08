# Require admin approval before the Wali Gate opens, not just field presence

The Wali Gate (see ADR 0001, CONTEXT.md) originally opened as soon as a sister filled in all five wali fields — self-declared, unverified. That doesn't stop someone from typing a plausible-looking name/phone/email just to get past the gate. Since wali info is relied on for trust and safety (the app's equivalent of a chaperone contact), a human check that the details look genuine is worth the added friction.

**Decision**: add Wali Review — an admin approve/reject step (`sister.wali_review_status`, plus `admin-wali-review-action` edge function and an AdminDashboard queue) that the DB-level `enforce_wali_gate` trigger now requires (`wali_review_status = 'approved'`) in addition to field presence. Editing any wali field resets status to `pending`, so a sister can't stay "approved" on stale/unreviewed info.

**Considered Options**
- Field presence only (original ADR 0001 design) — no admin workload, but anyone can write junk that satisfies the check.
- Automated SMS verification, matching the imam/reference pattern (text the wali, they reply YES/NO) — not evaluated when this was built; would confirm the wali is a real, reachable person but not that the *relationship* claimed is genuine, which needs a human's judgment call the way imam/reference verification doesn't.
- Admin approval (chosen) — adds a manual review queue and a wait for the sister, but catches implausible submissions an automated reply can't.
