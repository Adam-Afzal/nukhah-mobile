import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
  }

  // Verify the requesting user via their JWT
  const supabaseUser = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  );
  const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const userId = user.id;

  try {
    // ── Cancel RevenueCat subscription ────────────────────────────────────
    // Deletes the subscriber from RevenueCat, revoking entitlements.
    // Note: underlying Apple/Google billing must be cancelled by the user
    // in App Store/Play Store settings — neither RC nor we can do it for them.
    const rcSecretKey = Deno.env.get('REVENUECAT_SECRET_KEY');
    if (rcSecretKey) {
      try {
        await fetch(`https://api.revenuecat.com/v1/subscribers/${userId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${rcSecretKey}` },
        });
      } catch (rcErr) {
        console.error('RevenueCat delete failed (non-blocking):', rcErr);
      }
    }


    // Resolve profile row IDs
    const [{ data: brother }, { data: sister }] = await Promise.all([
      supabase.from('brother').select('id').eq('user_id', userId).maybeSingle(),
      supabase.from('sister').select('id').eq('user_id', userId).maybeSingle(),
    ]);

    const profileId = brother?.id || sister?.id;
    const profileType = brother ? 'brother' : 'sister';

    if (profileId) {
      // Delete question responses linked to this profile's interests
      const { data: interests } = await supabase
        .from('interests')
        .select('id')
        .or(`requester_id.eq.${profileId},recipient_id.eq.${profileId}`);

      if (interests && interests.length > 0) {
        await supabase
          .from('question_responses')
          .delete()
          .in('interest_id', interests.map((i: any) => i.id));

        await supabase
          .from('interests')
          .delete()
          .or(`requester_id.eq.${profileId},recipient_id.eq.${profileId}`);
      }

      await Promise.all([
        supabase.from('reference').delete().eq('user_id', profileId).eq('user_type', profileType),
        supabase.from('imam_verification').delete().eq('user_id', profileId).eq('user_type', profileType),
      ]);
    }

    await Promise.all([
      supabase.from('notifications').delete().eq('user_id', userId),
      supabase.from('brother_application').delete().eq('user_id', userId),
      supabase.from('sister_application').delete().eq('user_id', userId),
      supabase.from('subscribers').delete().eq('user_id', userId),
    ]);

    await supabase.from('brother').delete().eq('user_id', userId);
    await supabase.from('sister').delete().eq('user_id', userId);

    const { error: deleteError } = await supabase.auth.admin.deleteUser(userId);
    if (deleteError) throw deleteError;

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('delete-account error:', err);
    return new Response(JSON.stringify({ error: err.message || 'Failed to delete account' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
