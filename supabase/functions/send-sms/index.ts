// supabase/functions/send-sms/index.ts
// Sends a YES/NO reference verification SMS to a character reference via Twilio.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { to, userName } = await req.json()

    if (!to || !userName) {
      return json({ error: 'Missing required fields: to, userName' }, 400)
    }

    const message =
      `${userName} has listed you as a reference for Mithaq - an Islamic matrimony platform. Do you accept?\n\n` +
      `Reply YES to accept or NO to decline.`

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
