// supabase/functions/imam-sms-reply/index.ts
// Twilio webhook — receives the imam's YES/NO SMS reply.
// Deploy with: supabase functions deploy imam-sms-reply --no-verify-jwt
//
// Twilio config: set this function's URL as the "A message comes in" webhook
// on your Twilio phone number (HTTP POST).

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  // Twilio posts form-encoded data
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

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Look up imam by phone number
    const { data: imam } = await supabase
      .from('imam')
      .select('id, name')
      .eq('phone', fromPhone)
      .maybeSingle()

    if (!imam) {
      console.log('No imam found for phone:', fromPhone)
      return twiml('Thank you for your message.')
    }

    // Find the masjid this imam is attached to (masjid.imam_id → imam.id)
    const { data: masjid } = await supabase
      .from('masjid')
      .select('id, name')
      .eq('imam_id', imam.id)
      .maybeSingle()

    if (!masjid) {
      console.log('No masjid found for imam:', imam.id)
      return twiml('Thank you for your message.')
    }

    // Find the most recent pending verification for this masjid
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

    // Parse intent
    const isYes = body.startsWith('YES')
    const isNo = body.startsWith('NO')

    if (!isYes && !isNo) {
      return twiml('Please reply with YES or NO to verify the applicant.')
    }

    const newStatus = isYes ? 'verified' : 'rejected'

    // Update imam_verification
    const { error: updateError } = await supabase
      .from('imam_verification')
      .update({ status: newStatus })
      .eq('id', verification.id)

    if (updateError) {
      console.error('Error updating verification:', updateError)
      return twiml('Sorry, there was an error recording your response. Please try again.')
    }

    // Fetch user push token
    const { data: profile } = await supabase
      .from(verification.user_type)
      .select('push_token')
      .eq('id', verification.user_id)
      .maybeSingle()

    const pushTitle = isYes ? 'Masjid Affiliation Verified' : 'Masjid Affiliation Update'
    const pushBody = isYes
      ? `Your imam at ${masjid.name} has confirmed your masjid affiliation.`
      : `Your imam was unable to confirm your affiliation with ${masjid.name}. You can still use Mithaq with a character reference.`

    // Send push notification
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

    // Create in-app notification
    await supabase.from('notifications').insert({
      user_id: verification.user_id,
      type: 'imam_verification',
      title: pushTitle,
      message: pushBody,
      data: { masjid_id: masjid.id, status: newStatus },
      read: false,
    })

    const reply = isYes
      ? `JazakAllahu Khairan, ${imam.name}. We have recorded your confirmation.`
      : `JazakAllahu Khairan, ${imam.name}. We have recorded your response.`

    return twiml(reply)

  } catch (err) {
    console.error('imam-sms-reply error:', err)
    return twiml('')
  }
})

function twiml(message: string): Response {
  const xml = message
    ? `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${message}</Message></Response>`
    : `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`
  return new Response(xml, { headers: { 'Content-Type': 'text/xml' } })
}
