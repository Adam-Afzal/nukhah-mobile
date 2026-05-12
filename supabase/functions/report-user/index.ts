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
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Unauthorized' }, 401)

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user }, error: authError } = await userClient.auth.getUser()
    if (authError || !user) return json({ error: 'Unauthorized' }, 401)

    const { reportedUserId, reportedUsername, reporterUsername, reason } = await req.json()
    if (!reason?.trim()) return json({ error: 'Reason is required' }, 400)

    const resendKey = Deno.env.get('RESEND_API_KEY')!

    const html = `
      <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; padding: 40px 20px;">
        <h2 style="color: #B7312C;">User Report — Mithaq</h2>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr><td style="padding: 8px 0; color: #555; width: 140px;">Reported user</td><td style="padding: 8px 0; font-weight: bold;">${reportedUsername || reportedUserId}</td></tr>
          <tr><td style="padding: 8px 0; color: #555;">Reported user ID</td><td style="padding: 8px 0;">${reportedUserId || '—'}</td></tr>
          <tr><td style="padding: 8px 0; color: #555;">Reporter</td><td style="padding: 8px 0;">${reporterUsername || user.email}</td></tr>
          <tr><td style="padding: 8px 0; color: #555;">Reporter user ID</td><td style="padding: 8px 0;">${user.id}</td></tr>
          <tr><td style="padding: 8px 0; color: #555; vertical-align: top;">Reason</td><td style="padding: 8px 0; white-space: pre-wrap;">${reason.trim()}</td></tr>
        </table>
      </div>
    `

    const resendResp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Mithaq Reports <noreply@joinmithaq.com>',
        to: ['adam@loworbitsystems.com'],
        subject: `User report: ${reportedUsername || reportedUserId}`,
        html,
      }),
    })

    if (!resendResp.ok) {
      const err = await resendResp.json()
      return json({ error: err.message || 'Failed to send report' }, 502)
    }

    return json({ success: true })
  } catch (err) {
    console.error('report-user error:', err)
    return json({ error: err.message }, 500)
  }
})

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
