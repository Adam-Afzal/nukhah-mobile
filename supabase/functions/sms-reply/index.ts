import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
// supabase/functions/sms-reply/index.ts
// Single Twilio webhook for all incoming SMS replies.
// Handles both imam verification (YES/NO) and reference verification (AGREE/DISAGREE).
// Deploy with: supabase functions deploy sms-reply --no-verify-jwt
//
// Both flows disambiguate which pending request a reply applies to via a
// short 2-digit code included in the original outbound SMS (assigned by
// send-imam-verification / send-sms), unique among that phone's currently-
// pending requests only (DB-enforced, see the reply-code migrations). With
// only one pending request, the code is optional — a plain YES/NO or
// AGREE/DISAGREE still resolves it. With more than one pending and no code,
// this does not guess — it replies asking for the code instead.

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

  // YES/NO → imam affiliation verification only
  // AGREE/DISAGREE → reference verification only
  const isYes = body.startsWith('YES')
  const isNo = body.startsWith('NO')
  const isAgree = body.startsWith('AGREE')
  const isDisagree = body.startsWith('DISAGREE')

  if (!isYes && !isNo && !isAgree && !isDisagree) {
    return twiml('Please reply YES or NO for masjid affiliation, or AGREE or DISAGREE for reference requests.')
  }

  const codeMatch = body.match(/(\d{2,})/)
  const replyCode = codeMatch ? codeMatch[1] : null

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  let handledImam = false
  let handledReference = false
  let imamName: string | undefined
  let applicantName: string | undefined
  let clarificationReply: string | undefined

  // ── Imam verification — YES/NO only ───────────────────────────────────────
  const { data: imam } = await supabase
    .from('imam')
    .select('id, name')
    .eq('phone', fromPhone)
    .maybeSingle()

  if (imam && (isYes || isNo)) {
    imamName = imam.name

    const { data: masjid } = await supabase
      .from('masjid')
      .select('id, name')
      .eq('imam_id', imam.id)
      .maybeSingle()

    if (masjid) {
      const { data: pending } = await supabase
        .from('imam_verification')
        .select('id, user_id, user_type, code')
        .eq('masjid_id', masjid.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: true })

      if (pending && pending.length > 0) {
        let verification: { id: string; user_id: string; user_type: string; code: string | null } | undefined

        if (replyCode) {
          verification = pending.find((v) => v.code === replyCode)
          if (!verification) {
            clarificationReply = `That code doesn't match a pending verification for your masjid. Please check and reply again, e.g. "YES ${pending[0].code}".`
          }
        } else if (pending.length === 1) {
          verification = pending[0]
        } else {
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
          clarificationReply =
            `You have ${pending.length} pending verifications: ${namedList.join(', ')}. ` +
            `Please reply YES or NO followed by the code, e.g. "YES ${pending[0].code}".`
        }

        if (verification) {
          handledImam = true
          const newStatus = isYes ? 'verified' : 'rejected'

          await supabase.from('imam_verification').update({ status: newStatus }).eq('id', verification.id)

          if (isYes) {
            await supabase.from(verification.user_type).update({ imam_verified: true }).eq('id', verification.user_id)
          }

          const { data: profile } = await supabase
            .from(verification.user_type)
            .select('push_token, user_id, first_name, last_name')
            .eq('id', verification.user_id)
            .maybeSingle()

          applicantName = profile ? `${profile.first_name ?? ''} ${profile.last_name ?? ''}`.trim() : undefined

          const pushTitle = isYes ? 'Masjid Affiliation Verified' : 'Masjid Affiliation Update'
          const pushBody = isYes
            ? `Your imam at ${masjid.name} has confirmed your masjid affiliation.`
            : `Your imam was unable to confirm your affiliation with ${masjid.name}. You can still use Mithaq with a character reference.`

          if (profile?.push_token) {
            await fetch('https://exp.host/--/api/v2/push/send', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
              body: JSON.stringify({
                to: profile.push_token, title: pushTitle, body: pushBody,
                sound: 'default', data: { type: 'imam_verification', status: newStatus },
              }),
            })
          }

          if (profile?.user_id) {
            await supabase.from('notifications').insert({
              user_id: profile.user_id, type: 'imam_verification',
              title: pushTitle, message: pushBody,
              data: { masjid_id: masjid.id, status: newStatus }, read: false,
            })
          }
        }
      }
    }
  }

  // ── Reference verification — AGREE/DISAGREE only ─────────────────────────
  if (!handledImam && (isAgree || isDisagree)) {
    const { data: pending } = await supabase
      .from('reference')
      .select('id, user_id, user_type, reply_code')
      .eq('reference_phone', fromPhone)
      .eq('verification_status', 'pending')
      .order('created_at', { ascending: true })

    if (pending && pending.length > 0) {
      let reference: { id: string; user_id: string; user_type: string; reply_code: string | null } | undefined

      if (replyCode) {
        reference = pending.find((r) => r.reply_code === replyCode)
        if (!reference) {
          clarificationReply = `That code doesn't match a pending reference request. Please check and reply again, e.g. "AGREE ${pending[0].reply_code}".`
        }
      } else if (pending.length === 1) {
        reference = pending[0]
      } else {
        const namedList = await Promise.all(
          pending.map(async (r) => {
            const { data: p } = await supabase
              .from(r.user_type)
              .select('first_name, last_name')
              .eq('id', r.user_id)
              .maybeSingle()
            const name = p ? `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim() : 'a member'
            return `${name} (${r.reply_code})`
          })
        )
        clarificationReply =
          `You've been listed as a reference by ${pending.length} people: ${namedList.join(', ')}. ` +
          `Please reply AGREE or DISAGREE followed by the code, e.g. "AGREE ${pending[0].reply_code}".`
      }

      if (reference) {
        handledReference = true
        const newStatus = isAgree ? 'verified' : 'rejected'

        await supabase.from('reference').update({ verification_status: newStatus }).eq('id', reference.id)

        const { data: profile } = await supabase
          .from(reference.user_type)
          .select('push_token, user_id, first_name, last_name')
          .eq('id', reference.user_id)
          .maybeSingle()

        applicantName = profile ? `${profile.first_name ?? ''} ${profile.last_name ?? ''}`.trim() : undefined

        if (isAgree && profile) {
          if (profile.push_token) {
            await fetch('https://exp.host/--/api/v2/push/send', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
              body: JSON.stringify({
                to: profile.push_token, title: 'Reference Verified',
                body: 'Your character reference has been verified.',
                sound: 'default', data: { type: 'reference_verified' },
              }),
            })
          }
          if (profile.user_id) {
            await supabase.from('notifications').insert({
              user_id: profile.user_id, type: 'reference_verified',
              title: 'Reference Verified', message: 'Your character reference has been verified.',
              data: { reference_id: reference.id }, read: false,
            })
          }
        }
      }
    }
  }

  // ── Reply ─────────────────────────────────────────────────────────────────
  if (clarificationReply) {
    return twiml(clarificationReply)
  }

  if (handledImam || handledReference) {
    const name = imamName ? `, ${imamName}` : ''
    const confirmed = isYes || isAgree
    const forWhom = applicantName ? ` for ${applicantName}` : ''
    return twiml(confirmed
      ? `JazakAllahu Khairan${name}. We have recorded your confirmation${forWhom}.`
      : `JazakAllahu Khairan${name}. We have recorded your response${forWhom}.`
    )
  }

  return twiml('Thank you for your message.')
})

function twiml(message: string): Response {
  const xml = message
    ? `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${message}</Message></Response>`
    : `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`
  return new Response(xml, { headers: { 'Content-Type': 'text/xml' } })
}
