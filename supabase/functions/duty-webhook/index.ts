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

    // Parse status/license from a few common variants (be liberal in what we accept)
    // Examples:
    // (license:xxxxx) went on-duty/off-duty. (Rank)
    // (license:xxxxx) went on duty/off duty. (Rank)
    // 10-41 / 10-42 messages that still include the license id

    const extractLicenseId = (msg: string): string | null => {
      const fromParen = msg.match(/\(license:([^\)]+)\)/i)?.[1];
      const fromInline = msg.match(/\blicense:([a-f0-9]{8,})\b/i)?.[1];
      const raw = String(fromParen ?? fromInline ?? '').trim();
      if (!raw) return null;

      // Normalize: remove any repeated leading "license:" tokens then rebuild as "license:<hash>"
      const cleaned = raw.replace(/^(license:)+/i, '').trim();
      return cleaned ? `license:${cleaned}` : null;
    };

    const extractStatus = (msg: string): 'on_duty' | 'off_duty' | null => {
      const m = msg.toLowerCase();
      if (/\b10[- ]?41\b/.test(m) || /\bon[- ]?duty\b/.test(m)) return 'on_duty';
      if (/\b10[- ]?42\b/.test(m) || /\boff[- ]?duty\b/.test(m)) return 'off_duty';
      return null;
    };

    const licenseId = extractLicenseId(message);
    const status = extractStatus(message);
    const rankMatch = message.match(/\(([^()]+)\)\s*$/);

    if (!licenseId || !status) {
      console.log('Could not parse message format');
      return new Response(
        JSON.stringify({ error: 'Invalid message format', received: message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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

