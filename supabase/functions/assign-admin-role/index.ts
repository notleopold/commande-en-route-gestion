import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Database {
  public: {
    Tables: {
      user_roles: {
        Row: { id: string; user_id: string; role: string; created_at: string }
        Insert: { user_id: string; role: string }
        Update: { role: string }
      }
    }
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient<Database>(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    
    // Get user from token
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
    
    if (authError || !user) {
      console.error('Auth error:', authError)
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Processing admin assignment for user:', user.id)

    // Check if this is the first user in the system
    const { data: existingUsers, error: usersError } = await supabaseClient
      .from('user_roles')
      .select('id')
      .limit(1)

    if (usersError) {
      console.error('Error checking existing users:', usersError)
      throw usersError
    }

    // If no users have roles yet, make this user an admin
    if (!existingUsers || existingUsers.length === 0) {
      const { error: insertError } = await supabaseClient
        .from('user_roles')
        .insert([
          { user_id: user.id, role: 'admin' }
        ])

      if (insertError) {
        console.error('Error inserting admin role:', insertError)
        throw insertError
      }

      console.log('Successfully assigned admin role to first user:', user.id)
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Admin role assigned as first user',
          role: 'admin'
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    } else {
      // Check if user already has a role
      const { data: userRole, error: roleError } = await supabaseClient
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single()

      if (roleError && roleError.code !== 'PGRST116') { // PGRST116 = not found
        console.error('Error checking user role:', roleError)
        throw roleError
      }

      if (!userRole) {
        // Assign default user role
        const { error: insertError } = await supabaseClient
          .from('user_roles')
          .insert([
            { user_id: user.id, role: 'user' }
          ])

        if (insertError) {
          console.error('Error inserting user role:', insertError)
          throw insertError
        }

        console.log('Assigned default user role to:', user.id)
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Default user role assigned',
            role: 'user'
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      } else {
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'User already has a role',
            role: userRole.role
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
    }

  } catch (error) {
    console.error('Error in assign-admin-role function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})