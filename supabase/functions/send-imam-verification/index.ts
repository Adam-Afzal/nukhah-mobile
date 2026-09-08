// supabase/functions/send-imam-verification/index.ts
// Called after an imam_verification row is inserted.
// Texts the imam asking them to confirm the user's affiliation.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { imam_verification_id, user_id, user_type, masjid_id, applicant_note } = await req.json()

    if (!imam_verification_id || !user_id || !user_type || !masjid_id) {
      return json({ error: 'Missing required fields' }, 400)
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Fetch masjid + imam
    const { data: masjid, error: masjidError } = await supabase
      .from('masjid')
      .select('id, name, city, country, imam:imam_id(id, name, phone)')
      .eq('id', masjid_id)
      .single()

    if (masjidError || !masjid) {
      return json({ error: 'Masjid not found' })
    }

    const imam = Array.isArray(masjid.imam) ? masjid.imam[0] : masjid.imam

    if (!imam?.phone) {
      console.log('Imam has no phone — skipping SMS for', imam_verification_id)
      return json({ skipped: true, reason: 'no_imam_phone' })
    }

    // Fetch user profile
    const table = user_type === 'brother' ? 'brother' : 'sister'
    const fields = user_type === 'sister'
      ? 'first_name, last_name, wali_name, wali_relationship, wali_phone'
      : 'first_name, last_name'

    const { data: profile } = await supabase
      .from(table)
      .select(fields)
      .eq('id', user_id)
      .maybeSingle()

    const userName = profile
      ? `${profile.first_name} ${profile.last_name}`.trim()
      : 'A member'

    // Assign a reply code unique among this masjid's currently-pending
    // verifications (DB-enforced via a partial unique index — see
    // 20260902000000_imam_verification_reply_code.sql). Lets the imam
    // disambiguate which applicant a YES/NO applies to when more than one
    // is pending at once. Retry a few times on the rare collision.
    let code: string | null = null
    for (let attempt = 0; attempt < 10; attempt++) {
      const candidate = String(Math.floor(Math.random() * 90) + 10) // 10-99
      const { error: codeError } = await supabase
        .from('imam_verification')
        .update({ code: candidate })
        .eq('id', imam_verification_id)

      if (!codeError) {
        code = candidate
        break
      }
      if (codeError.code !== '23505') {
        console.error('Error assigning verification code:', codeError)
        break
      }
      // 23505 = unique violation on (masjid_id, code) — another pending
      // request at this masjid already has this code, try a new one.
    }

    if (!code) {
      return json({ error: 'Could not allocate a verification code' }, 500)
    }

    let smsBody =
      `Assalamu Alaikum ${imam.name},\n\n` +
      `${userName} has affiliated themselves with ${masjid.name}. ` +
      `Can you confirm knowledge of this person?`

    const trimmedNote = typeof applicant_note === 'string' ? applicant_note.trim().slice(0, 120) : ''
    if (trimmedNote) {
      smsBody += `\n\nNote from ${userName}: "${trimmedNote}"`
    }

    if (user_type === 'sister' && profile?.wali_name) {
      smsBody += `\n\nWali: ${profile.wali_name}`
      if (profile.wali_relationship) smsBody += ` (${profile.wali_relationship})`
      if (profile.wali_phone) smsBody += `, ${profile.wali_phone}`
    }

    smsBody += `\n\nReply YES ${code} to confirm or NO ${code} if you cannot confirm.\n\nJazakAllahu Khairan`

    const twilioSid = Deno.env.get('TWILIO_ACCOUNT_SID')!
    const twilioToken = Deno.env.get('TWILIO_AUTH_TOKEN')!
    const twilioFrom = Deno.env.get('TWILIO_PHONE_NUMBER')!

    const twilioResp = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${btoa(`${twilioSid}:${twilioToken}`)}`,
        },
        body: new URLSearchParams({
          To: imam.phone,
          From: twilioFrom,
          Body: smsBody,
        }).toString(),
      }
    )

    const twilioResult = await twilioResp.json()

    if (twilioResult.error_code) {
      console.error('Twilio error:', twilioResult)
      return json({ error: twilioResult.message })
    }

    return json({ success: true, sid: twilioResult.sid })

  } catch (err) {
    console.error('send-imam-verification error:', err)
    return json({ error: err.message }, 500)
  }
})

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
