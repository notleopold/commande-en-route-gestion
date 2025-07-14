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
    // Create a Supabase client with the service role key for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // Verify the user is authenticated and is an admin
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
    
    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    // Check if user is admin
    const { data: userRole, error: roleError } = await supabase
      .rpc('get_user_role', { _user_id: user.id })

    if (roleError || userRole !== 'admin') {
      throw new Error('Insufficient permissions')
    }

    const { method } = req
    const body = method !== 'GET' ? await req.json() : null

    if (method === 'GET') {
      // Get all users with their profiles and roles
      const { data: profiles, error: profilesError } = await supabaseAdmin
        .from('profiles')
        .select(`
          *,
          user_roles (role)
        `)
        .order('created_at', { ascending: false })

      if (profilesError) throw profilesError

      // Get auth users data
      const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers()
      
      if (authError) throw authError

      // Combine the data
      const users = profiles?.map(profile => {
        const authUser = authUsers.users.find(u => u.id === profile.id)
        return {
          ...profile,
          role: profile.user_roles?.[0]?.role || 'user',
          disabled: authUser?.banned_until ? new Date(authUser.banned_until) > new Date() : false,
          email_confirmed: authUser?.email_confirmed_at ? true : false,
          created_at: authUser?.created_at
        }
      })

      return new Response(
        JSON.stringify({ users }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (method === 'POST') {
      // Create new user
      const { email, password, full_name, role } = body

      // Create auth user
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name }
      })

      if (authError) throw authError

      // Update profile (should be created by trigger)
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update({ full_name })
        .eq('id', authUser.user.id)

      if (profileError) throw profileError

      // Set user role
      const { error: roleError } = await supabaseAdmin
        .from('user_roles')
        .upsert({ 
          user_id: authUser.user.id, 
          role: role || 'user' 
        })

      if (roleError) throw roleError

      return new Response(
        JSON.stringify({ user: authUser.user }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (method === 'PUT') {
      // Update user
      const { user_id, full_name, phone, department, role } = body

      // Update profile
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update({ 
          full_name,
          phone,
          department
        })
        .eq('id', user_id)

      if (profileError) throw profileError

      // Update role
      if (role) {
        const { error: roleError } = await supabaseAdmin
          .from('user_roles')
          .upsert({ 
            user_id, 
            role 
          })

        if (roleError) throw roleError
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (method === 'DELETE') {
      // Disable/ban user
      const { user_id } = body

      // Ban the user (this disables their account)
      const { error: banError } = await supabaseAdmin.auth.admin.updateUserById(
        user_id,
        { 
          ban_duration: 'none' // Permanent ban
        }
      )

      if (banError) throw banError

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    throw new Error('Method not allowed')

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})