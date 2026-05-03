// supabase/functions/reference-sms-reply/index.ts
// Twilio webhook — receives YES/NO reply from a character reference.
// Deploy with: supabase functions deploy reference-sms-reply --no-verify-jwt
//
// Twilio config: set this function's URL as the "A message comes in" webhook
// on your Twilio phone number (HTTP POST). Same number as imam-sms-reply.
// Twilio will call both — each handler ignores messages it can't match.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return twiml('')
  }

  const rawBody = formData.get('Body')?.toString().trim() ?? ''
  const fromPhone = formData.get('From')?.toString() ?? ''

  if (!fromPhone) return twiml('')

  const body = rawBody.toUpperCase()
  const isYes = body.startsWith('YES')
  const isNo = body.startsWith('NO')

  if (!isYes && !isNo) {
    return twiml('Please reply with YES or NO.')
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Find most recent pending reference for this phone number
    const { data: reference } = await supabase
      .from('reference')
      .select('id, user_id, user_type')
      .eq('reference_phone', fromPhone)
      .eq('verification_status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!reference) {
      return twiml('Thank you for your message.')
    }

    const newStatus = isYes ? 'verified' : 'rejected'

    await supabase
      .from('reference')
      .update({ verification_status: newStatus })
      .eq('id', reference.id)

    // Get profile for push token + auth user_id
    const { data: profile } = await supabase
      .from(reference.user_type)
      .select('push_token, user_id, first_name, last_name')
      .eq('id', reference.user_id)
      .maybeSingle()

    if (isYes && profile) {
      const pushTitle = 'Reference Verified'
      const pushBody = 'Your character reference has been verified.'

      // Push notification
      if (profile.push_token) {
        await fetch('https://exp.host/--/api/v2/push/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({
            to: profile.push_token,
            title: pushTitle,
            body: pushBody,
            sound: 'default',
            data: { type: 'reference_verified' },
          }),
        })
      }

      // In-app notification
      if (profile.user_id) {
        await supabase.from('notifications').insert({
          user_id: profile.user_id,
          type: 'reference_verified',
          title: pushTitle,
          message: pushBody,
          data: { reference_id: reference.id },
          read: false,
        })
      }
    }

    const reply = isYes
      ? 'JazakAllahu Khairan. We have recorded your confirmation.'
      : 'JazakAllahu Khairan. We have recorded your response.'

    return twiml(reply)

  } catch (err) {
    console.error('reference-sms-reply error:', err)
    return twiml('')
  }
})

function twiml(message: string): Response {
  const xml = message
    ? `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${message}</Message></Response>`
    : `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`
  return new Response(xml, { headers: { 'Content-Type': 'text/xml' } })
}
