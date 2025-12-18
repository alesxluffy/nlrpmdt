import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
}

type DutyStatus = 'on_duty' | 'off_duty'

const extractLicenseId = (msg: string): string | null => {
  const fromParen = msg.match(/\(license:([^\)]+)\)/i)?.[1]
  const fromInline = msg.match(/\blicense:([a-f0-9]{8,})\b/i)?.[1]
  const raw = String(fromParen ?? fromInline ?? '').trim()
  if (!raw) return null

  // Normalize: remove any repeated leading "license:" tokens then rebuild as "license:<hash>"
  const cleaned = raw.replace(/^(license:)+/i, '').trim()
  return cleaned ? `license:${cleaned}` : null
}

const extractStatus = (msg: string): DutyStatus | null => {
  const m = msg.toLowerCase()
  if (/\b10[- ]?41\b/.test(m) || /\bon[- ]?duty\b/.test(m)) return 'on_duty'
  if (/\b10[- ]?42\b/.test(m) || /\boff[- ]?duty\b/.test(m)) return 'off_duty'
  return null
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
      return new Response(JSON.stringify({ error: 'Missing request body' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    let body: any = null
    try {
      body = JSON.parse(rawBody)
    } catch {
      body = { content: rawBody }
    }

    const message = body?.content || body?.message || rawBody
    const receivedAt = new Date().toISOString()

    console.log('Received webhook message:', message)

    const licenseId = extractLicenseId(message)
    const status = extractStatus(message)
    const rankMatch = message.match(/\(([^()]+)\)\s*$/)
    const rankAtTime = rankMatch ? rankMatch[1] : null

    if (!licenseId || !status) {
      console.log('Could not parse message format')
      return new Response(JSON.stringify({ error: 'Invalid message format', received: message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log('Parsed:', { licenseId, status, rankAtTime, receivedAt })

    // 1) Always log the raw duty event (audit trail)
    const { data: dutyLog, error: dutyLogError } = await supabase
      .from('duty_logs')
      .insert({
        license_id: licenseId,
        status,
        rank_at_time: rankAtTime,
        raw_message: message,
      })
      .select()
      .single()

    if (dutyLogError) {
      console.error('Database error (duty_logs):', dutyLogError)
      return new Response(JSON.stringify({ error: dutyLogError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 2) Match officer (exact match to avoid mixing multiple officers)
    const { data: officer, error: officerError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, total_hours')
      .eq('license_id', licenseId)
      .maybeSingle()

    if (officerError) {
      console.error('Database error (profiles lookup):', officerError)
      return new Response(JSON.stringify({ error: officerError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 3) Start/stop duty sessions based on events (works for many officers; keyed by license)
    if (status === 'on_duty') {
      const { data: openSession } = await supabase
        .from('duty_sessions')
        .select('id')
        .eq('license', licenseId)
        .is('end_time', null)
        .order('start_time', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (!openSession) {
        const { error: startError } = await supabase.from('duty_sessions').insert({
          license: licenseId,
          officer_id: officer?.id ?? null,
          start_time: receivedAt,
          end_time: null,
          duration_hours: null,
        })

        if (startError) {
          console.error('Database error (start session):', startError)
          return new Response(JSON.stringify({ error: startError.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }
      }

      if (officer) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ duty_status: 'On Duty', last_duty_activity: receivedAt })
          .eq('id', officer.id)

        if (updateError) console.error('Database error (set On Duty):', updateError)
      }

      return new Response(
        JSON.stringify({ success: true, event: status, duty_log: dutyLog, officer_matched: !!officer }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // off_duty
    let durationHours: number | null = null

    const { data: openSession } = await supabase
      .from('duty_sessions')
      .select('id, start_time')
      .eq('license', licenseId)
      .is('end_time', null)
      .order('start_time', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (openSession) {
      const startMs = Date.parse(openSession.start_time)
      const endMs = Date.parse(receivedAt)
      durationHours = Math.max(0, (endMs - startMs) / 3_600_000)

      const { error: endError } = await supabase
        .from('duty_sessions')
        .update({
          end_time: receivedAt,
          duration_hours: durationHours,
          officer_id: officer?.id ?? null,
        })
        .eq('id', openSession.id)

      if (endError) {
        console.error('Database error (end session):', endError)
        return new Response(JSON.stringify({ error: endError.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    } else {
      console.log('Off duty received but no open session was found', { licenseId })
    }

    if (officer) {
      const updates: Record<string, any> = {
        duty_status: 'Off Duty',
        last_duty_activity: receivedAt,
      }

      if (durationHours !== null) {
        updates.total_hours = (officer.total_hours || 0) + durationHours
      }

      const { error: updateError } = await supabase.from('profiles').update(updates).eq('id', officer.id)
      if (updateError) console.error('Database error (set Off Duty):', updateError)
    }

    return new Response(
      JSON.stringify({
        success: true,
        event: status,
        duration_hours: durationHours,
        duty_log: dutyLog,
        officer_matched: !!officer,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})


