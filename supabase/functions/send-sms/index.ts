import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
// supabase/functions/send-sms/index.ts
// Sends an AGREE/DISAGREE reference verification SMS to a character reference via Twilio.



const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { to, userName, reference_id } = await req.json()

    if (!to || !userName) {
      return json({ error: 'Missing required fields: to, userName' }, 400)
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Assign a reply code unique among this phone number's currently-pending
    // reference rows (DB-enforced — see 20260902000001_reference_reply_code.sql).
    // Lets the reference disambiguate which applicant an AGREE/DISAGREE applies
    // to when they've been listed as a reference by more than one person.
    let referenceId = reference_id as string | undefined
    if (!referenceId) {
      // Caller didn't pass the row id — fall back to the reference row we
      // ourselves just inserted moments ago for this phone number. Safe here
      // (unlike in the reply handler) because we're not resolving an
      // ambiguous reply, just finding the row this send call is for.
      const { data: justCreated } = await supabase
        .from('reference')
        .select('id')
        .eq('reference_phone', to)
        .eq('verification_status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      referenceId = justCreated?.id
    }

    let code: string | null = null
    if (referenceId) {
      for (let attempt = 0; attempt < 10; attempt++) {
        const candidate = String(Math.floor(Math.random() * 90) + 10) // 10-99
        const { error: codeError } = await supabase
          .from('reference')
          .update({ reply_code: candidate })
          .eq('id', referenceId)

        if (!codeError) {
          code = candidate
          break
        }
        if (codeError.code !== '23505') {
          console.error('Error assigning reference reply code:', codeError)
          break
        }
        // 23505 = unique violation on (reference_phone, reply_code) — retry.
      }
    }

    const message = code
      ? `${userName} has listed you as a reference for Mithaq - an Islamic matrimony platform. Do you agree to be their reference?\n\n` +
        `Reply AGREE ${code} to accept or DISAGREE ${code} to decline.`
      : `${userName} has listed you as a reference for Mithaq - an Islamic matrimony platform. Do you agree to be their reference?\n\n` +
        `Reply AGREE to accept or DISAGREE to decline.`

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
          To: to,
          From: twilioFrom,
          Body: message,
        }).toString(),
      }
    )

    const result = await twilioResp.json()

    if (result.error_code) {
      console.error('Twilio error:', result)
      return json({ error: result.message })
    }

    return json({ success: true, sid: result.sid })

  } catch (err) {
    console.error('send-sms error:', err)
    return json({ error: err.message }, 500)
  }
})

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
