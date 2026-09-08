import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
// supabase/functions/imam-sms-reply/index.ts
// Twilio webhook — receives the imam's YES/NO SMS reply.
// Deploy with: supabase functions deploy imam-sms-reply --no-verify-jwt
//
// Twilio config: set this function's URL as the "A message comes in" webhook
// on your Twilio phone number (HTTP POST).


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

    // Parse intent
    const isYes = body.startsWith('YES')
    const isNo = body.startsWith('NO')

    if (!isYes && !isNo) {
      return twiml('Please reply with YES or NO to verify the applicant.')
    }

    // A reply code disambiguates which applicant this is for when more than
    // one is pending at this masjid — e.g. "YES 42". Optional: with only one
    // pending, a plain YES/NO still works.
    const codeMatch = body.match(/(\d{2,})/)
    const replyCode = codeMatch ? codeMatch[1] : null

    const { data: pending } = await supabase
      .from('imam_verification')
      .select('id, user_id, user_type, code')
      .eq('masjid_id', masjid.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: true })

    if (!pending || pending.length === 0) {
      return twiml('No pending verification found for your masjid. JazakAllahu Khairan.')
    }

    let verification: { id: string; user_id: string; user_type: string; code: string | null } | undefined

    if (replyCode) {
      verification = pending.find((v) => v.code === replyCode)
      if (!verification) {
        return twiml(`That code doesn't match a pending verification for your masjid. Please check and reply again, e.g. "YES ${pending[0].code}".`)
      }
    } else if (pending.length === 1) {
      verification = pending[0]
    } else {
      // Multiple pending and no code given — don't guess which one this is for.
      const namedList = await Promise.all(
        pending.map(async (v) => {
          const { data: p } = await supabase
            .from(v.user_type)
            .select('first_name, last_name')
            .eq('id', v.user_id)
            .maybeSingle()
          const name = p ? `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim() : 'a member'
          return `${name} (${v.code})`
        })
      )
      return twiml(
        `You have ${pending.length} pending verifications: ${namedList.join(', ')}. ` +
        `Please reply YES or NO followed by the code, e.g. "YES ${pending[0].code}".`
      )
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

    // Fetch user push token + name — name is echoed back in the reply too, as
    // a final visible confirmation of who the code resolved to.
    const { data: profile } = await supabase
      .from(verification.user_type)
      .select('push_token, first_name, last_name')
      .eq('id', verification.user_id)
      .maybeSingle()

    const applicantName = profile
      ? `${profile.first_name ?? ''} ${profile.last_name ?? ''}`.trim()
      : 'the applicant'

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
      ? `JazakAllahu Khairan, ${imam.name}. We have recorded your confirmation for ${applicantName}.`
      : `JazakAllahu Khairan, ${imam.name}. We have recorded your response for ${applicantName}.`

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
