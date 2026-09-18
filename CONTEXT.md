# Nukhah Mobile

Muslim matchmaking app. Signed-up users go through a funnel before reaching the main app: profile, masjid affiliation, references. Membership (payment) is not part of that funnel — it's checked separately, only when a user tries to express interest or respond to one.

## Language

**Sign Up**:
Creates the Supabase auth account directly (name, nationality, date of birth, phone, email, password — including the 18+ check) and leads straight into Onboarding. Replaces the old Application system — there is no review/approval step. Previously, "applying" created the auth account too, but left the user waiting in a `pending` state for admin review before Onboarding could begin.
_Avoid_: "Application" or "apply" for this flow — those terms now refer only to the legacy system below.

**Application (legacy)**:
The pre-removal signup path: `brother_application`/`sister_application` rows with a `pending`/`approved`/`rejected` status, reviewed by an admin before the applicant could proceed. Removed in favour of Sign Up (no more review gate). The tables are kept in the database as historical record only — no app code reads or writes them anymore.
_Avoid_: Treating these tables as live data, or joining to them for current user info — see [[nukhbah-web-main CONTEXT.md]] for what replaced the email join.

**Onboarding**:
The post-Sign-Up setup funnel — `app/(onboarding)/`: profile-intro → profile-setup → masjid-affiliation → references. Each screen is a *task* the user must complete, tracked by `OnboardingProgress` and the `userStatus.onboardingCompleted` flag. Does not include payment — see Membership Gate.
_Avoid_: Assuming payment is one of the tasks — it was, before the paywall moved to interest-action time (see [[nukhah-mobile docs/adr/0003]]); `app/(onboarding)/payment.tsx` no longer exists.

**Membership Gate**:
The rule that a user must have an active subscription (`subscribers.subscribed = true`) before they can express interest, or accept/reject a received one — checked in `app/(auth)/profile/[id].tsx`'s handlers and enforced at the database level via a trigger on `interests`, same pattern as the Wali Gate. `withdrawInterest` is deliberately exempt. Blocked users are sent to `app/(auth)/payment.tsx`, which resumes the exact action that triggered the gate once the purchase is confirmed (polling `subscribers` briefly first, since the RevenueCat webhook that updates it lands asynchronously after the purchase itself succeeds). See [[nukhah-mobile docs/adr/0003]].
_Avoid_: Confusing with Testing Mode, which is a separate, additional bypass (`userStatus.testingMode || userStatus.paid`), not the gate itself.

**Testing Mode**:
A global (not per-user) flag in `app_settings` (`key = 'testing_mode'`). Currently the only thing it affects is the Membership Gate: when true, `userStatus.testingMode || userStatus.paid` is satisfied for everyone regardless of subscription status. It has no effect on Onboarding, which never checks payment.
_Avoid_: Conflating with a user-level setting — it affects everyone at once. Also avoid assuming it still gates onboarding — that was true before [[nukhah-mobile docs/adr/0003]], not after.

**Top Match**:
A brother/sister profile scoring `compatibility_score` ≥ 0.7 (the same 70%-vector/30%-hard-rule blend described in `docs/matching-engine.md`, and the same number already shown as "X% match" on every card) relative to the viewer. On both Discover and Local tabs, Top Matches are pulled into their own "⭐ Top Matches" section above the regular sorted list, on both mobile and web — not merely sorted first within one list. Capped at 10, highest score first; anyone qualifying beyond the 10th falls back into the regular list rather than disappearing. If nobody clears the threshold, the section doesn't render at all; the screen looks exactly like it does without this feature.
_Avoid_: Confusing with the plain sort order — every list is already sorted by `compatibility_score` descending regardless of Top Match status; Top Match is a separate, hard-threshold *section*, not just "whoever's first."

**Onboarding gate**:
The redirect logic in `app/(auth)/_layout.tsx` that re-evaluates `userStatus` every time an `(auth)` screen renders and force-navigates users who haven't finished Onboarding to the correct step. This is the authority for where a user resumes after closing and reopening the app.

**Wali Gate**:
The rule that a sister profile must have `wali_name` and `wali_phone` filled in *and* have passed Wali Review before she can express interest, or accept/decline a received interest. `wali_relationship`, `wali_email`, and `wali_preferred_contact` are optional extras — not every wali has an email. Wali fields stay optional in profile-setup — a sister can finish Onboarding without one — so this is enforced at the point of the interest action, not at profile-setup. Enforced at the database level (not just client-side) since mobile and web each have their own independent interest-handling code with no shared backend layer. See [[nukhah-mobile docs/adr/0001]] for why it's DB-level, [[nukhah-mobile docs/adr/0002]] for why it requires review.
_Avoid_: Confusing with `applied_by_wali` — a separate flag recording whether the wali is the one who filled in the profile-setup form on the sister's behalf, not whether wali info exists at all.

**Aqeedah**:
A brother/sister profile field (`brother.aqeedah` / `sister.aqeedah`) capturing theological methodology — `salafi_ahlul_hadith` or `other`. Required at Profile Setup and on the Edit Profile screen (blocks saving the whole form, on both platforms) — but nullable at the DB level, since it was added after profiles already existed and there's no honest value to backfill existing rows with. A pre-existing profile with `aqeedah: null` can still be browsed/matched on normally; it's only blocked from saving *edits* until the owner sets it, which is the actual backfill mechanism — there is no separate migration or forced prompt outside Edit Profile.
_Avoid_: Adding a DB `NOT NULL` constraint — this field's required-ness lives entirely at the app layer specifically so existing rows aren't broken.

**Wali Review**:
The admin approve/reject workflow a sister's wali details must pass before the Wali Gate opens — a trust/safety check that the wali info looks genuine, since anyone can type a plausible-looking name/phone/email. Tracked by `sister.wali_review_status`: absent/null (not submitted), `pending`, `approved`, or `rejected` (with `wali_reject_reason`). Editing any wali field resets an approved or rejected sister back to `pending` automatically — there is no "approved forever" state once content changes.
_Avoid_: Confusing with imam verification or reference verification (`verification_status: 'pending' | 'verified' | 'rejected'` on masjid affiliation and references) — these are separate review tracks with their own tables and their own status values (`verified`, not `approved`). A sister can be wali-approved and reference-unverified at the same time; they don't gate each other.
