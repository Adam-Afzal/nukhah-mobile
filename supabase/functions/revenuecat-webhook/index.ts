// supabase/functions/revenuecat-webhook/index.ts
// Receives RevenueCat webhook events and keeps the subscribers table in sync.
// Set the webhook URL in RevenueCat dashboard → Project Settings → Webhooks:
//   https://<your-project>.supabase.co/functions/v1/revenuecat-webhook
// Set Authorization header value to REVENUECAT_WEBHOOK_SECRET env var.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const ACTIVE_EVENTS = new Set(['INITIAL_PURCHASE', 'RENEWAL', 'UNCANCELLATION'])
const EXPIRED_EVENTS = new Set(['EXPIRATION'])
const CANCELLED_EVENTS = new Set(['CANCELLATION'])
const BILLING_ISSUE_EVENTS = new Set(['BILLING_ISSUE'])

serve(async (req) => {
  try {
    // Verify the request is from RevenueCat
    const authHeader = req.headers.get('Authorization')
    const webhookSecret = Deno.env.get('REVENUECAT_WEBHOOK_SECRET')

    if (webhookSecret && authHeader !== webhookSecret) {
      return new Response('Unauthorized', { status: 401 })
    }

    const body = await req.json()
    const event = body.event

    if (!event) {
      return new Response('No event', { status: 400 })
    }

    const eventType: string = event.type
    const appUserId: string = event.app_user_id // This is the Supabase user_id (we logIn with it)
    const expirationMs: number | null = event.expiration_at_ms ?? null
    const productId: string | null = event.product_id ?? null

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const expiresAt = expirationMs ? new Date(expirationMs).toISOString() : null

    if (ACTIVE_EVENTS.has(eventType)) {
      // Subscription active — ensure subscribed = true and update expiry
      await supabase.from('subscribers').upsert({
        user_id: appUserId,
        subscribed: true,
        provider: 'revenuecat',
        plan: 'monthly',
        product_id: productId,
        subscribed_at: new Date().toISOString(),
        expires_at: expiresAt,
        cancelled_at: null,
      }, { onConflict: 'user_id' })

    } else if (EXPIRED_EVENTS.has(eventType)) {
      // Subscription fully expired — revoke access
      await supabase.from('subscribers')
        .update({
          subscribed: false,
          expires_at: expiresAt,
        })
        .eq('user_id', appUserId)

    } else if (CANCELLED_EVENTS.has(eventType)) {
      // Cancelled but still active until expiry — record cancellation, keep access
      await supabase.from('subscribers')
        .update({
          cancelled_at: new Date().toISOString(),
          expires_at: expiresAt,
        })
        .eq('user_id', appUserId)

    } else if (BILLING_ISSUE_EVENTS.has(eventType)) {
      // Payment failed — RevenueCat will retry; we log but don't revoke yet
      // Access is revoked when EXPIRATION event fires after grace period
      console.log(`Billing issue for user ${appUserId}`)
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Webhook error:', error)
    return new Response('Internal error', { status: 500 })
  }
})
