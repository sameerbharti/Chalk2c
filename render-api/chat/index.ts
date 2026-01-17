import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Health check endpoint
const handleHealthCheck = () => {
  return new Response(JSON.stringify({ status: 'ok', service: 'chat' }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
};

// Copy the entire chat function from supabase/functions/chat/index.ts
// For Render deployment, we'll use the same code
export { serve, corsHeaders };
