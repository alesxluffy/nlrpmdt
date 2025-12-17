import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Some callers (or platform health checks) may hit this endpoint without a JSON body.
    // Be tolerant: accept JSON when present, otherwise treat raw text as the message.
    const rawBody = await req.text()
    if (!rawBody) {
      console.log('Webhook called with empty body', { method: req.method })
      return new Response(
        JSON.stringify({ error: 'Missing request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let body: any = null
    try {
      body = JSON.parse(rawBody)
    } catch {
      body = { content: rawBody }
    }

    const message = body?.content || body?.message || rawBody

    console.log('Received webhook message:', message)

    // Parse format: (license:xxxxx) went on-duty. (Rank) or (license:xxxxx) went off-duty. (Rank)
    const licenseMatch = message.match(/\(license:([^\)]+)\)/)
    const statusMatch = message.match(/went (on-duty|off-duty)/)
    const rankMatch = message.match(/\. \(([^)]+)\)$/)

    if (!licenseMatch || !statusMatch) {
      console.log('Could not parse message format')
      return new Response(
        JSON.stringify({ error: 'Invalid message format', received: message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const licenseId = licenseMatch[1]
    const status = statusMatch[1] === 'on-duty' ? 'on_duty' : 'off_duty'
    const rankAtTime = rankMatch ? rankMatch[1] : null

    console.log('Parsed:', { licenseId, status, rankAtTime })

    const { data, error } = await supabase
      .from('duty_logs')
      .insert({
        license_id: licenseId,
        status,
        rank_at_time: rankAtTime,
        raw_message: message,
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Duty log saved:', data)

    return new Response(
      JSON.stringify({ success: true, data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

