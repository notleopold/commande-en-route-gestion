
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CreateUserRequest {
  action: 'create';
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'moderator' | 'user';
}

interface UpdateUserRequest {
  action: 'update';
  user_id: string;
  first_name?: string;
  last_name?: string;
  role?: 'admin' | 'moderator' | 'user';
  public_metadata?: Record<string, any>;
}

interface DeleteUserRequest {
  action: 'delete';
  user_id: string;
}

type UserManagementRequest = CreateUserRequest | UpdateUserRequest | DeleteUserRequest;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const CLERK_SECRET_KEY = Deno.env.get('CLERK_SECRET_KEY');
    if (!CLERK_SECRET_KEY) {
      throw new Error('CLERK_SECRET_KEY is not configured');
    }

    const body: UserManagementRequest = await req.json();
    console.log('Received request:', body);

    const clerkApiUrl = 'https://api.clerk.com/v1';
    const headers = {
      'Authorization': `Bearer ${CLERK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    };

    switch (body.action) {
      case 'create': {
        console.log('Creating user with email:', body.email);
        
        const createResponse = await fetch(`${clerkApiUrl}/users`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            email_address: [body.email],
            password: body.password,
            first_name: body.first_name,
            last_name: body.last_name,
            public_metadata: {
              role: body.role
            }
          })
        });

        if (!createResponse.ok) {
          const errorText = await createResponse.text();
          console.error('Clerk API error:', errorText);
          throw new Error(`Failed to create user: ${errorText}`);
        }

        const userData = await createResponse.json();
        console.log('User created successfully:', userData.id);

        return new Response(
          JSON.stringify({ success: true, user: userData }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'update': {
        console.log('Updating user:', body.user_id);
        
        const updateData: any = {};
        if (body.first_name) updateData.first_name = body.first_name;
        if (body.last_name) updateData.last_name = body.last_name;
        if (body.role || body.public_metadata) {
          updateData.public_metadata = {
            role: body.role,
            ...body.public_metadata
          };
        }

        const updateResponse = await fetch(`${clerkApiUrl}/users/${body.user_id}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify(updateData)
        });

        if (!updateResponse.ok) {
          const errorText = await updateResponse.text();
          console.error('Clerk API error:', errorText);
          throw new Error(`Failed to update user: ${errorText}`);
        }

        const userData = await updateResponse.json();
        console.log('User updated successfully:', userData.id);

        return new Response(
          JSON.stringify({ success: true, user: userData }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'delete': {
        console.log('Deleting user:', body.user_id);
        
        const deleteResponse = await fetch(`${clerkApiUrl}/users/${body.user_id}`, {
          method: 'DELETE',
          headers
        });

        if (!deleteResponse.ok) {
          const errorText = await deleteResponse.text();
          console.error('Clerk API error:', errorText);
          throw new Error(`Failed to delete user: ${errorText}`);
        }

        console.log('User deleted successfully:', body.user_id);

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        throw new Error('Invalid action');
    }
  } catch (error) {
    console.error('Error in clerk-user-management:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
})
