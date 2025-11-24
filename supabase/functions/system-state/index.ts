import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS"
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders
    });
  }

  const url = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

  const supabase = createClient(url, serviceKey);

  const { data, error } = await supabase
    .from("system_revision")
    .select("key, revision, updated_at");

  if (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      }
    );
  }

  const map: Record<string, { revision: number; updated_at: string }> = {};
  (data ?? []).forEach((row: any) => {
    map[row.key] = {
      revision: row.revision,
      updated_at: row.updated_at
    };
  });

  const body = {
    ...map,
    timestamp: new Date().toISOString()
  };

  return new Response(
    JSON.stringify(body),
    {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    }
  );
});