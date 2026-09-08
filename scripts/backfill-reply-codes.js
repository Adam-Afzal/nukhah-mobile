// @ts-nocheck
// scripts/backfill-reply-codes.js
//
// One-off backfill: pending imam_verification / reference rows created
// before the SMS reply-code disambiguation feature (see
// supabase/functions/sms-reply/index.ts) have code / reply_code = NULL.
// That's harmless while a phone number has only one pending request (no
// code needed to resolve it), but breaks once a second pending request
// shows up for the same phone: the NULL-code row renders as "(null)" in
// the clarification SMS and can never be selected by code (codeMatch only
// captures digits) — see 20260902000000_imam_verification_reply_code.sql
// and 20260902000001_reference_reply_code.sql for the uniqueness
// constraints this mirrors.
//
// This only fills in the DB column — it does NOT re-send SMS to notify
// anyone of their new code. Anyone currently blocked by ambiguity (2+
// pending requests right now) will see their code the next time they
// message in and get a clarification reply listing it; no proactive
// message is sent by this script.
//
// Same random-with-retry allocation as send-imam-verification /
// send-sms: 2-digit code (10-99), retried on unique-constraint collision
// (23505), scoped to masjid_id (imam_verification) / reference_phone
// (reference) — same as the live uniqueness constraints.
//
// Usage:
//   node scripts/backfill-reply-codes.js            (dry run)
//   node scripts/backfill-reply-codes.js --confirm   (apply)

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY || '';
const confirm = process.argv.includes('--confirm');

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function assignCode(table, column, id, scopeColumn, scopeValue) {
  for (let attempt = 0; attempt < 10; attempt++) {
    const candidate = String(Math.floor(Math.random() * 90) + 10); // 10-99
    const { error } = await supabase.from(table).update({ [column]: candidate }).eq('id', id);
    if (!error) return candidate;
    if (error.code !== '23505') {
      console.error(`  ERROR assigning code for ${table} ${id}: ${error.message}`);
      return null;
    }
    // 23505 = unique violation on (scopeColumn, code) — another pending row
    // in the same scope already has this code, try a new one.
  }
  console.error(`  Could not allocate a unique code for ${table} ${id} (scope ${scopeColumn}=${scopeValue}) after 10 attempts`);
  return null;
}

async function run() {
  const { data: pendingImam } = await supabase
    .from('imam_verification')
    .select('id, masjid_id, user_id, user_type')
    .eq('status', 'pending')
    .is('code', null);

  const { data: pendingRef } = await supabase
    .from('reference')
    .select('id, reference_phone, user_id, user_type')
    .eq('verification_status', 'pending')
    .is('reply_code', null);

  const imamRows = pendingImam || [];
  const refRows = pendingRef || [];

  console.log(`${imamRows.length} pending imam_verification row(s) missing a code.`);
  console.log(`${refRows.length} pending reference row(s) missing a reply_code.\n`);

  if (imamRows.length === 0 && refRows.length === 0) {
    console.log('Nothing to backfill.');
    return;
  }

  if (!confirm) {
    imamRows.forEach((r) => console.log(`  [imam_verification] ${r.id} (${r.user_type} ${r.user_id}, masjid ${r.masjid_id})`));
    refRows.forEach((r) => console.log(`  [reference] ${r.id} (${r.user_type} ${r.user_id}, phone ${r.reference_phone})`));
    console.log('\nDry run only — no changes made. Re-run with --confirm to apply.');
    return;
  }

  // Sequential, not parallel — each assignment must commit before the next
  // uniqueness check in the same scope (masjid_id / reference_phone) runs.
  for (const r of imamRows) {
    const code = await assignCode('imam_verification', 'code', r.id, 'masjid_id', r.masjid_id);
    if (code) console.log(`  [imam_verification] ${r.id} -> code ${code}`);
  }

  for (const r of refRows) {
    const code = await assignCode('reference', 'reply_code', r.id, 'reference_phone', r.reference_phone);
    if (code) console.log(`  [reference] ${r.id} -> reply_code ${code}`);
  }

  console.log('\nDone.');
}

run().then(() => process.exit(0)).catch((err) => { console.error('ERROR:', err.message); process.exit(1); });
