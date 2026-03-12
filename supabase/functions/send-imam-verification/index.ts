// supabase/functions/send-imam-verification/index.ts
// Called from the app after an imam_verification row is inserted.
// Looks up the imam's phone, builds an SMS with user details, and sends via Twilio.

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
    const { imam_verification_id, user_id, user_type, masjid_id } = await req.json()

    if (!imam_verification_id || !user_id || !user_type || !masjid_id) {
      return json({ error: 'Missing required fields' }, 400)
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Fetch masjid + imam (masjid.imam_id → imam)
    const { data: masjid, error: masjidError } = await supabase
      .from('masjid')
      .select('id, name, city, country, imam:imam_id(id, name, phone)')
      .eq('id', masjid_id)
      .single()

    if (masjidError || !masjid) {
      console.error('Masjid not found:', masjidError)
      return json({ error: 'Masjid not found' })
    }

    // Supabase join may return array or object depending on cardinality
    const imam = Array.isArray(masjid.imam) ? masjid.imam[0] : masjid.imam

    if (!imam?.phone) {
      console.log('Imam has no phone on file — skipping SMS for verification', imam_verification_id)
      return json({ skipped: true, reason: 'no_imam_phone' })
    }

    // Fetch user profile
    const table = user_type === 'brother' ? 'brother' : 'sister'
    const sisterFields = 'full_name, email, wali_name, wali_relationship, wali_phone'
    const brotherFields = 'full_name, email'

    const { data: profile } = await supabase
      .from(table)
      .select(user_type === 'sister' ? sisterFields : brotherFields)
      .eq('id', user_id)
      .maybeSingle()

    const gender = user_type === 'brother' ? 'Brother' : 'Sister'
    const userName = profile?.full_name || 'A member'

    let smsBody =
      `Assalamu Alaikum ${imam.name},\n\n` +
      `${userName} has applied to join Mithaq and listed ${masjid.name} as their masjid.\n\n` +
      `Gender: ${gender}\n` +
      `Email: ${profile?.email ?? 'N/A'}`

    if (user_type === 'sister' && profile?.wali_name) {
      smsBody += `\nWali: ${profile.wali_name}`
      if (profile.wali_relationship) smsBody += ` (${profile.wali_relationship})`
      if (profile.wali_phone) smsBody += `, ${profile.wali_phone}`
    }

    smsBody +=
      '\n\nBy replying YES you confirm that you know this person and can vouch for their ' +
      'character and regular attendance at your masjid. Reply NO if you cannot confirm this.\n\n' +
      'JazakAllahu Khairan'

    // Send via Twilio
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

    console.log('SMS sent, Twilio SID:', twilioResult.sid)
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
