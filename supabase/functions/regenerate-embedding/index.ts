import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    // ── Auth + admin check ────────────────────────────────────────────────
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Unauthorized' }, 401)

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const openaiKey = Deno.env.get('OPENAI_API_KEY')!

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user }, error: authError } = await userClient.auth.getUser()
    if (authError || !user) return json({ error: 'Unauthorized' }, 401)

    const serviceClient = createClient(supabaseUrl, serviceKey)
    const { data: adminRow } = await serviceClient
      .from('admin_user_ids').select('user_id').eq('user_id', user.id).maybeSingle()
    if (!adminRow) return json({ error: 'Forbidden' }, 403)

    // ── Parse request ─────────────────────────────────────────────────────
    const { profileId, profileType } = await req.json()
    if (!profileId || !profileType) return json({ error: 'Missing profileId or profileType' }, 400)
    if (profileType !== 'brother' && profileType !== 'sister') return json({ error: 'Invalid profileType' }, 400)

    // ── Fetch profile ─────────────────────────────────────────────────────
    const { data: profile, error: fetchError } = await serviceClient
      .from(profileType)
      .select('*')
      .eq('id', profileId)
      .single()

    if (fetchError || !profile) {
      console.error('Profile fetch error:', JSON.stringify(fetchError))
      return json({ error: `Profile not found: ${fetchError?.message || 'unknown'}` }, 404)
    }

    // ── Build text ────────────────────────────────────────────────────────
    const whoIAmParts: string[] = []
    if (profile.personality) whoIAmParts.push(`Personality: ${profile.personality}`)
    if (profile.hobbies_and_interests) whoIAmParts.push(`Hobbies and interests: ${profile.hobbies_and_interests}`)
    if (profile.location_city && profile.location_country) whoIAmParts.push(`Location: ${profile.location_city}, ${profile.location_country}`)
    else if (profile.location_country) whoIAmParts.push(`Location: ${profile.location_country}`)
    if (profile.ethnicity) whoIAmParts.push(`Ethnicity: ${profile.ethnicity}`)
    if (profile.date_of_birth) {
      const age = new Date().getFullYear() - new Date(profile.date_of_birth).getFullYear()
      whoIAmParts.push(`Age: ${age}`)
    }
    if (profile.build) whoIAmParts.push(`Build: ${profile.build}`)
    if (profile.marital_status) whoIAmParts.push(`Marital status: ${profile.marital_status}`)
    if (profile.children !== undefined) whoIAmParts.push(`Has children: ${profile.children ? 'yes' : 'no'}`)
    if (profile.prayer_consistency) whoIAmParts.push(`Prayer consistency: ${profile.prayer_consistency}`)
    if (profile.open_to_hijrah !== undefined) whoIAmParts.push(`Open to hijrah: ${profile.open_to_hijrah ? 'yes' : 'no'}`)
    if (profile.beard_commitment) whoIAmParts.push(`Beard: ${profile.beard_commitment}`)
    if (profile.hijab_commitment) whoIAmParts.push(`Hijab: ${profile.hijab_commitment}`)
    if (profile.open_to_polygyny !== undefined) whoIAmParts.push(`Open to polygyny: ${profile.open_to_polygyny ? 'yes' : 'no'}`)
    if (profile.living_arrangements) whoIAmParts.push(`Living arrangements: ${profile.living_arrangements}`)

    const whatIWantParts: string[] = []
    if (profile.other_spouse_criteria) whatIWantParts.push(`Looking for: ${profile.other_spouse_criteria}`)
    if (profile.dealbreakers) whatIWantParts.push(`Dealbreakers: ${profile.dealbreakers}`)
    if (profile.preferred_ethnicity?.length) whatIWantParts.push(`Preferred ethnicity: ${profile.preferred_ethnicity.join(', ')}`)

    const whoIAmText = whoIAmParts.join('. ')
    const whatIWantText = whatIWantParts.join('. ')

    if (!whoIAmText) return json({ error: 'Profile has no text to embed' }, 400)

    // ── Generate embeddings via OpenAI ────────────────────────────────────
    const embed = async (text: string): Promise<number[]> => {
      const resp = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${openaiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ model: 'text-embedding-3-small', input: text }),
      })
      const data = await resp.json()
      if (!resp.ok) throw new Error(data.error?.message || 'OpenAI error')
      return data.data[0].embedding
    }

    const updateData: Record<string, any> = {
      profile_embedding: await embed(whoIAmText),
    }
    if (whatIWantText) {
      updateData.profile_embedding_want = await embed(whatIWantText)
    }

    // ── Save to profile ───────────────────────────────────────────────────
    const { error: updateError } = await serviceClient
      .from(profileType)
      .update(updateData)
      .eq('id', profileId)

    if (updateError) throw updateError

    return json({ success: true })
  } catch (err) {
    console.error('regenerate-embedding error:', err)
    return json({ error: err.message }, 500)
  }
})

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
