import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DeleteSchema = z.object({
  sessionId: z.string().uuid("Invalid session ID format"),
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rawBody = await req.json();
    const validationResult = DeleteSchema.safeParse(rawBody);
    
    if (!validationResult.success) {
      return new Response(JSON.stringify({ 
        error: "Validation failed", 
        details: validationResult.error.errors.map(e => e.message).join(", ")
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { sessionId } = validationResult.data;
    console.log("Deleting session:", sessionId);

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase configuration is missing. SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.');
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify session exists
    const { data: session, error: checkError } = await supabase
      .from('classroom_sessions')
      .select('id, subject, chapter')
      .eq('id', sessionId)
      .single();

    if (checkError || !session) {
      return new Response(JSON.stringify({ 
        error: "Session not found" 
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Delete session (cascades to knowledge_chunks and chat_messages via FK)
    const { error: deleteError } = await supabase
      .from('classroom_sessions')
      .delete()
      .eq('id', sessionId);

    if (deleteError) {
      console.error("Delete error:", deleteError);
      throw deleteError;
    }

    console.log("Successfully deleted session:", sessionId);

    return new Response(JSON.stringify({ 
      success: true,
      deleted: {
        id: sessionId,
        subject: session.subject,
        chapter: session.chapter
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Delete session error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
