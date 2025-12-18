import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify API key
    const apiKey = req.headers.get('x-api-key');
    const expectedKey = Deno.env.get('DUTY_BOT_API_KEY');
    
    if (!apiKey || apiKey !== expectedKey) {
      console.error('Invalid or missing API key');
      return new Response(
        JSON.stringify({ error: 'Unauthorized', message: 'Invalid or missing API key' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const body = await req.json();
    const { license, duration_hours, start_time, end_time } = body;

    console.log('Received duty session:', { license, duration_hours, start_time, end_time });

    if (!license || duration_hours === undefined || !start_time || !end_time) {
      return new Response(
        JSON.stringify({ error: 'Bad Request', message: 'Missing required fields: license, duration_hours, start_time, end_time' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Clean license (strip "license:" prefix if present)
    const cleanLicense = license.replace(/^license:/i, '').trim();
    console.log('Cleaned license:', cleanLicense);

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find officer by license_id
    const { data: officer, error: officerError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, license_id, total_hours')
      .ilike('license_id', `%${cleanLicense}%`)
      .maybeSingle();

    if (officerError) {
      console.error('Error finding officer:', officerError);
      return new Response(
        JSON.stringify({ error: 'Database Error', message: officerError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Found officer:', officer);

    // Insert duty session
    const sessionData = {
      license: cleanLicense,
      officer_id: officer?.id || null,
      start_time,
      end_time,
      duration_hours: parseFloat(duration_hours.toString())
    };

    const { data: session, error: sessionError } = await supabase
      .from('duty_sessions')
      .insert(sessionData)
      .select()
      .single();

    if (sessionError) {
      console.error('Error inserting session:', sessionError);
      return new Response(
        JSON.stringify({ error: 'Database Error', message: sessionError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Inserted session:', session);

    // Update officer's total hours and status if found
    if (officer) {
      const newTotalHours = (officer.total_hours || 0) + parseFloat(duration_hours.toString());
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          total_hours: newTotalHours,
          duty_status: 'Off Duty',
          last_duty_activity: end_time
        })
        .eq('id', officer.id);

      if (updateError) {
        console.error('Error updating officer:', updateError);
      } else {
        console.log(`Updated officer ${officer.first_name} ${officer.last_name}: total_hours=${newTotalHours}, status=Off Duty`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Duty session recorded successfully',
        session_id: session.id,
        officer_matched: !!officer,
        officer_name: officer ? `${officer.first_name} ${officer.last_name}` : null
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
