import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.51.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DatabaseFunctionResponse {
  data: any;
  error: any;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🗑️ Starting trash cleanup job...');

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Calculate the cutoff date (45 days ago)
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 45);
    
    console.log(`🕒 Cutoff date: ${cutoffDate.toISOString()}`);

    // Get expired items
    const { data: expiredItems, error: fetchError } = await supabase
      .from('deleted_items')
      .select('*')
      .lt('deleted_at', cutoffDate.toISOString());

    if (fetchError) {
      console.error('❌ Error fetching expired items:', fetchError);
      throw fetchError;
    }

    console.log(`📋 Found ${expiredItems?.length || 0} expired items to delete`);

    if (!expiredItems || expiredItems.length === 0) {
      console.log('✅ No expired items to clean up');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No expired items found',
          deletedCount: 0,
          cutoffDate: cutoffDate.toISOString()
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    // Delete expired items
    const { error: deleteError } = await supabase
      .from('deleted_items')
      .delete()
      .lt('deleted_at', cutoffDate.toISOString());

    if (deleteError) {
      console.error('❌ Error deleting expired items:', deleteError);
      throw deleteError;
    }

    console.log(`✅ Successfully deleted ${expiredItems.length} expired items`);

    // Log details of deleted items for audit purposes
    const deletedItemsSummary = expiredItems.reduce((acc: any, item: any) => {
      acc[item.table_name] = (acc[item.table_name] || 0) + 1;
      return acc;
    }, {});

    console.log('📊 Deleted items summary:', deletedItemsSummary);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Successfully deleted ${expiredItems.length} expired items`,
        deletedCount: expiredItems.length,
        cutoffDate: cutoffDate.toISOString(),
        summary: deletedItemsSummary,
        expiredItems: expiredItems.map((item: any) => ({
          id: item.id,
          table_name: item.table_name,
          item_id: item.item_id,
          deleted_at: item.deleted_at,
          reason: item.reason
        }))
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('💥 Trash cleanup failed:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});