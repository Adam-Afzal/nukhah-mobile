// supabase/functions/admin-send-sms/index.ts
// Admin-only SMS sender. Verifies the caller is an authenticated admin
// before forwarding to Twilio. Logs every message to admin_sms_log.
//
// SQL — run once:
//   create table if not exists admin_sms_log (
//     id uuid default gen_random_uuid() primary key,
//     sent_by uuid references auth.users(id),
//     recipient_name text,
//     recipient_phone text not null,
//     message text not null,
//     twilio_sid text,
//     status text default 'sent',
//     created_at timestamptz default now()
//   );
//   alter table admin_sms_log enable row level security;
//   create policy "Admins can view sms log"
//     on admin_sms_log for select to authenticated
//     using (exists (select 1 from admin_user_ids where user_id = auth.uid()));

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

    // Use the caller's JWT to identify them
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user }, error: authError } = await userClient.auth.getUser()
    if (authError || !user) return json({ error: 'Unauthorized' }, 401)

    // ── 2. Check admin_user_ids (service role — cannot be spoofed) ─────────
    const serviceClient = createClient(supabaseUrl, serviceKey)
    const { data: adminRow } = await serviceClient
      .from('admin_user_ids')
      .select('user_id')
      .eq('user_id', user.id)
      .single()

    if (!adminRow) return json({ error: 'Forbidden — admin access required' }, 403)

    // ── 3. Parse and validate body ─────────────────────────────────────────
    const { to, message, recipientName } = await req.json()

    if (!to || !message) {
      return json({ error: 'Missing required fields: to, message' }, 400)
    }
    if (message.trim().length === 0) {
      return json({ error: 'Message cannot be empty' }, 400)
    }
    if (message.length > 1600) {
      return json({ error: 'Message too long (max 1600 characters)' }, 400)
    }

    // ── 4. Send via Twilio ─────────────────────────────────────────────────
    const twilioSid = Deno.env.get('TWILIO_ACCOUNT_SID')!
    const twilioToken = Deno.env.get('TWILIO_AUTH_TOKEN')!
    const twilioFrom = Deno.env.get('TWILIO_PHONE_NUMBER')!

    // Alphanumeric sender IDs are one-way (no replies) and unsupported by US carriers
    const isUkRecipient = to.startsWith('+44') || to.startsWith('44')
    const senderId = isUkRecipient ? 'Mithaq' : twilioFrom

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
          From: senderId,
          Body: message,
        }).toString(),
      }
    )

    const twilioResult = await twilioResp.json()
    console.log('Twilio response:', JSON.stringify(twilioResult))

    if (twilioResult.error_code) {
      console.error('Twilio error:', twilioResult)
      return json({ error: `Twilio error: ${twilioResult.message}` }, 502)
    }

    // ── 5. Log to admin_sms_log ────────────────────────────────────────────
    await serviceClient.from('admin_sms_log').insert({
      sent_by: user.id,
      recipient_name: recipientName || null,
      recipient_phone: to,
      message,
      twilio_sid: twilioResult.sid,
      status: twilioResult.status,
    })

    return json({ success: true, sid: twilioResult.sid })

  } catch (err) {
    console.error('admin-send-sms error:', err)
    return json({ error: err.message }, 500)
  }
})

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
