# Nukhah Mobile

Muslim matchmaking app. Signed-up users go through a funnel before reaching the main app: payment, profile, masjid affiliation, references.

## Language

**Sign Up**:
Creates the Supabase auth account directly (name, nationality, date of birth, phone, email, password — including the 18+ check) and leads straight into Onboarding. Replaces the old Application system — there is no review/approval step. Previously, "applying" created the auth account too, but left the user waiting in a `pending` state for admin review before Onboarding could begin.
_Avoid_: "Application" or "apply" for this flow — those terms now refer only to the legacy system below.

**Application (legacy)**:
The pre-removal signup path: `brother_application`/`sister_application` rows with a `pending`/`approved`/`rejected` status, reviewed by an admin before the applicant could proceed. Removed in favour of Sign Up (no more review gate). The tables are kept in the database as historical record only — no app code reads or writes them anymore.
_Avoid_: Treating these tables as live data, or joining to them for current user info — see [[nukhbah-web-main CONTEXT.md]] for what replaced the email join.

**Onboarding**:
The post-Sign-Up setup funnel — `app/(onboarding)/`: payment → profile-intro → profile-setup → masjid-affiliation → references. Each screen is a *task* the user must complete, tracked by `OnboardingProgress` and the `userStatus.onboardingCompleted` flag.

**Testing Mode**:
A global (not per-user) flag in `app_settings` (`key = 'testing_mode'`). When true, the Onboarding gate in `app/(auth)/_layout.tsx` skips the payment step entirely for every user — `payment.tsx` is never visited. When false, users must pay before continuing.
_Avoid_: Conflating with a user-level setting — it affects everyone at once.

**Onboarding gate**:
The redirect logic in `app/(auth)/_layout.tsx` that re-evaluates `userStatus` every time an `(auth)` screen renders and force-navigates users who haven't finished Onboarding to the correct step. This is the authority for where a user resumes after closing and reopening the app.

**Wali Gate**:
The rule that a sister profile must have `wali_name` and `wali_phone` filled in *and* have passed Wali Review before she can express interest, or accept/decline a received interest. `wali_relationship`, `wali_email`, and `wali_preferred_contact` are optional extras — not every wali has an email. Wali fields stay optional in profile-setup — a sister can finish Onboarding without one — so this is enforced at the point of the interest action, not at profile-setup. Enforced at the database level (not just client-side) since mobile and web each have their own independent interest-handling code with no shared backend layer. See [[nukhah-mobile docs/adr/0001]] for why it's DB-level, [[nukhah-mobile docs/adr/0002]] for why it requires review.
_Avoid_: Confusing with `applied_by_wali` — a separate flag recording whether the wali is the one who filled in the profile-setup form on the sister's behalf, not whether wali info exists at all.

**Wali Review**:
The admin approve/reject workflow a sister's wali details must pass before the Wali Gate opens — a trust/safety check that the wali info looks genuine, since anyone can type a plausible-looking name/phone/email. Tracked by `sister.wali_review_status`: absent/null (not submitted), `pending`, `approved`, or `rejected` (with `wali_reject_reason`). Editing any wali field resets an approved or rejected sister back to `pending` automatically — there is no "approved forever" state once content changes.
_Avoid_: Confusing with imam verification or reference verification (`verification_status: 'pending' | 'verified' | 'rejected'` on masjid affiliation and references) — these are separate review tracks with their own tables and their own status values (`verified`, not `approved`). A sister can be wali-approved and reference-unverified at the same time; they don't gate each other.
