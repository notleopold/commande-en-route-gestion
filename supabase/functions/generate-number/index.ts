import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.51.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Créer le client Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Parse la requête
    const { entityType } = await req.json()
    
    console.log('Generating number for entity type:', entityType)

    if (!entityType || !['reservation', 'order'].includes(entityType)) {
      return new Response(
        JSON.stringify({ error: 'Type d\'entité invalide. Doit être "reservation" ou "order".' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Appeler la fonction de génération de numéro
    const { data, error } = await supabase.rpc('generate_next_number', {
      entity_type_param: entityType
    })

    if (error) {
      console.error('Erreur lors de la génération du numéro:', error)
      return new Response(
        JSON.stringify({ error: 'Erreur lors de la génération du numéro' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Numéro généré:', data)

    return new Response(
      JSON.stringify({ number: data }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Erreur dans generate-number:', error)
    return new Response(
      JSON.stringify({ error: 'Erreur interne du serveur' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})