import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Find all active sessions where auto_end_time has passed
    const now = new Date().toISOString()
    
    const { data: expiredSessions, error: fetchError } = await supabaseClient
      .from('vendor_live_sessions')
      .select('*')
      .eq('is_active', true)
      .not('auto_end_time', 'is', null)
      .lt('auto_end_time', now)

    if (fetchError) {
      console.error('Error fetching expired sessions:', fetchError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch expired sessions' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (!expiredSessions || expiredSessions.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No expired sessions found', count: 0 }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // End all expired sessions
    const sessionIds = expiredSessions.map(session => session.id)
    
    const { error: updateError } = await supabaseClient
      .from('vendor_live_sessions')
      .update({
        is_active: false,
        end_time: now,
        ended_by: 'timer'
      })
      .in('id', sessionIds)

    if (updateError) {
      console.error('Error updating expired sessions:', updateError)
      return new Response(
        JSON.stringify({ error: 'Failed to update expired sessions' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`Successfully ended ${expiredSessions.length} expired sessions`)
    
    return new Response(
      JSON.stringify({ 
        message: 'Successfully ended expired sessions', 
        count: expiredSessions.length,
        sessions: expiredSessions.map(s => ({ id: s.id, vendor_id: s.vendor_id, auto_end_time: s.auto_end_time }))
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})