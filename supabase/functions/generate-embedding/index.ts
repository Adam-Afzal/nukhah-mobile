// generate-embedding
// Called client-side when a user saves their profile.
// Takes a text string, returns a vector embedding from OpenAI.
// Requires auth (any authenticated user) — no admin check needed.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Unauthorized' }, 401)

    // Verify the caller is authenticated
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return json({ error: 'Unauthorized' }, 401)

    const { text } = await req.json()
    if (!text || typeof text !== 'string' || !text.trim()) {
      return json({ error: 'text is required' }, 400)
    }

    const openaiKey = Deno.env.get('OPENAI_API_KEY')!
    if (!openaiKey) return json({ error: 'OpenAI not configured' }, 500)

    const resp = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model: 'text-embedding-3-small', input: text.trim() }),
    })

    const data = await resp.json()
    if (!resp.ok) {
      console.error('OpenAI error:', data)
      return json({ error: data.error?.message || 'OpenAI error' }, 502)
    }

    return json({ embedding: data.data[0].embedding })
  } catch (err: any) {
    console.error('generate-embedding error:', err)
    return json({ error: err.message || 'Failed to generate embedding' }, 500)
  }
})

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
