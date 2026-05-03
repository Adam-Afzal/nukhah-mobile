// supabase/functions/sms-reply/index.ts
// Single Twilio webhook for all incoming SMS replies.
// Handles both imam verification (YES/NO) and reference verification (YES/NO).
// Deploy with: supabase functions deploy sms-reply --no-verify-jwt

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

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // ── Try imam verification first ───────────────────────────────────────────
  const { data: imam } = await supabase
    .from('imam')
    .select('id, name')
    .eq('phone', fromPhone)
    .maybeSingle()

  if (imam) {
    const { data: masjid } = await supabase
      .from('masjid')
      .select('id, name')
      .eq('imam_id', imam.id)
      .maybeSingle()

    if (!masjid) return twiml('Thank you for your message.')

    const { data: verification } = await supabase
      .from('imam_verification')
      .select('id, user_id, user_type')
      .eq('masjid_id', masjid.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!verification) {
      return twiml('No pending verification found for your masjid. JazakAllahu Khairan.')
    }

    const newStatus = isYes ? 'verified' : 'rejected'

    await supabase
      .from('imam_verification')
      .update({ status: newStatus })
      .eq('id', verification.id)

    const { data: profile } = await supabase
      .from(verification.user_type)
      .select('push_token, user_id')
      .eq('id', verification.user_id)
      .maybeSingle()

    const pushTitle = isYes ? 'Masjid Affiliation Verified' : 'Masjid Affiliation Update'
    const pushBody = isYes
      ? `Your imam at ${masjid.name} has confirmed your masjid affiliation.`
      : `Your imam was unable to confirm your affiliation with ${masjid.name}. You can still use Mithaq with a character reference.`

    if (profile?.push_token) {
      await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          to: profile.push_token,
          title: pushTitle,
          body: pushBody,
          sound: 'default',
          data: { type: 'imam_verification', status: newStatus },
        }),
      })
    }

    if (profile?.user_id) {
      await supabase.from('notifications').insert({
        user_id: profile.user_id,
        type: 'imam_verification',
        title: pushTitle,
        message: pushBody,
        data: { masjid_id: masjid.id, status: newStatus },
        read: false,
      })
    }

    const reply = isYes
      ? `JazakAllahu Khairan, ${imam.name}. We have recorded your confirmation.`
      : `JazakAllahu Khairan, ${imam.name}. We have recorded your response.`

    return twiml(reply)
  }

  // ── Try reference verification ────────────────────────────────────────────
  const { data: reference } = await supabase
    .from('reference')
    .select('id, user_id, user_type')
    .eq('reference_phone', fromPhone)
    .eq('verification_status', 'pending')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (reference) {
    const newStatus = isYes ? 'verified' : 'rejected'

    await supabase
      .from('reference')
      .update({ verification_status: newStatus })
      .eq('id', reference.id)

    const { data: profile } = await supabase
      .from(reference.user_type)
      .select('push_token, user_id')
      .eq('id', reference.user_id)
      .maybeSingle()

    if (isYes && profile) {
      const pushTitle = 'Reference Verified'
      const pushBody = 'Your character reference has been verified.'

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

    return twiml(isYes
      ? 'JazakAllahu Khairan. We have recorded your confirmation.'
      : 'JazakAllahu Khairan. We have recorded your response.'
    )
  }

  // ── No match found ────────────────────────────────────────────────────────
  return twiml('Thank you for your message.')
})

function twiml(message: string): Response {
  const xml = message
    ? `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${message}</Message></Response>`
    : `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`
  return new Response(xml, { headers: { 'Content-Type': 'text/xml' } })
}
