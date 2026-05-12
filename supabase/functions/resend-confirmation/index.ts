import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // ── 1. Verify JWT ──────────────────────────────────────────────────────
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Unauthorized' }, 401)

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user }, error: authError } = await userClient.auth.getUser()
    if (authError || !user) return json({ error: 'Unauthorized' }, 401)

    // ── 2. Verify admin ────────────────────────────────────────────────────
    const serviceClient = createClient(supabaseUrl, serviceKey)
    const { data: adminRow } = await serviceClient
      .from('admin_user_ids')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle()
    if (!adminRow) return json({ error: 'Forbidden' }, 403)

    // ── 3. Parse body ──────────────────────────────────────────────────────
    const { email, name } = await req.json()
    if (!email) return json({ error: 'Missing email' }, 400)

    // ── 4. Generate fresh confirmation link ────────────────────────────────
    const { data: linkData, error: linkError } = await serviceClient.auth.admin.generateLink({
      type: 'signup',
      email,
      options: {
        redirectTo: 'https://joinmithaq.com/email-confirmed',
      },
    })

    if (linkError || !linkData?.properties?.action_link) {
      console.error('generateLink error:', linkError)
      return json({ error: linkError?.message || 'Failed to generate confirmation link' }, 500)
    }

    const confirmationUrl = linkData.properties.action_link

    // ── 5. Send via Resend ─────────────────────────────────────────────────
    const resendKey = Deno.env.get('RESEND_API_KEY')!
    const firstName = name?.split(' ')[0] || 'there'

    const emailBody = `
      <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; padding: 40px 20px; background: #0A0E1A; color: #E8D7B5;">
        <h1 style="font-size: 28px; color: #C9A961; margin-bottom: 8px;">Mithaq</h1>
        <p style="color: #7B8799; font-size: 13px; margin-bottom: 32px;">Islamic Matrimonial</p>

        <h2 style="font-size: 20px; color: #E8D7B5; margin-bottom: 16px;">Confirm your email address</h2>
        <p style="font-size: 15px; line-height: 1.6; color: #C5B99A; margin-bottom: 24px;">
          Assalamu Alaikum ${firstName},<br><br>
          Please confirm your email address to complete your Mithaq application.
          This link will expire in <strong style="color: #C9A961;">1 hour</strong>.
        </p>

        <a href="${confirmationUrl}"
           style="display: inline-block; background: #C9A961; color: #0A0E1A; font-weight: bold; font-size: 15px;
                  padding: 14px 28px; border-radius: 8px; text-decoration: none; margin-bottom: 32px;">
          Confirm Email Address
        </a>

        <p style="font-size: 13px; color: #7B8799; line-height: 1.5;">
          If the button doesn't work, copy and paste this link into your browser:<br>
          <a href="${confirmationUrl}" style="color: #C9A961; word-break: break-all;">${confirmationUrl}</a>
        </p>

        <hr style="border: none; border-top: 1px solid #1A1F2E; margin: 32px 0;" />
        <p style="font-size: 12px; color: #4A5568;">
          If you did not apply to Mithaq, you can safely ignore this email.<br>
          Questions? Contact us at <a href="mailto:adam@loworbitsystems.com" style="color: #C9A961;">adam@loworbitsystems.com</a>
        </p>
      </div>
    `

    const resendResp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Mithaq <noreply@joinmithaq.com>',
        to: [email],
        subject: 'Confirm your Mithaq email address',
        html: emailBody,
      }),
    })

    const resendResult = await resendResp.json()
    if (!resendResp.ok) {
      console.error('Resend error:', resendResult)
      return json({ error: resendResult.message || 'Failed to send email' }, 502)
    }

    return json({ success: true })

  } catch (err) {
    console.error('resend-confirmation error:', err)
    return json({ error: err.message }, 500)
  }
})

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
