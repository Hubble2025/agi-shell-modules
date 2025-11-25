import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient, SupabaseClient } from "npm:@supabase/supabase-js@2";

type RefreshPolicyInput = {
  default_interval: number;
  module_interval: number;
  settings_interval: number;
  dashboard_interval: number;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
  "Access-Control-Allow-Methods": "GET, PUT, OPTIONS"
};

function validate(input: RefreshPolicyInput) {
  const keys: (keyof RefreshPolicyInput)[] = [
    "default_interval", "module_interval", "settings_interval", "dashboard_interval"
  ];
  for (const k of keys) {
    const v = input[k];
    if (typeof v !== "number" || v < 1000 || v > 60000)
      throw new Error("INVALID_INTERVAL_OR_RANGE");
  }
}

// ====== AUTH & ROLE CHECK ======
async function requireAdmin(req: Request, supabase: SupabaseClient) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer "))
    return new Response(JSON.stringify({ error: "UNAUTHORIZED" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  const jwt = authHeader.substring(7);
  const { data: { user }, error } = await supabase.auth.getUser(jwt);
  if (error || !user)
    return new Response(JSON.stringify({ error: "UNAUTHORIZED" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  const { data: roles } = await supabase
    .from("user_roles")
    .select("id")
    .eq("user_id", user.id)
    .in("role", ["admin", "system"]);

  if (!roles || roles.length === 0)
    return new Response(JSON.stringify({ error: "FORBIDDEN" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  return null;
}
// ===============================

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS")
    return new Response(null, { status: 200, headers: corsHeaders });

  const url = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const supabase = createClient(url, serviceKey);

  const authError = await requireAdmin(req, supabase);
  if (authError) return authError;

  try {
    if (req.method === "GET") {
      const { data, error } = await supabase.from("refresh_policy").select("*").limit(1);
      if (error) throw error;
      if (!data || data.length === 0) {
        const { data: inserted } = await supabase
          .from("refresh_policy")
          .insert({ default_interval: 5000 })
          .select()
          .limit(1);
        return new Response(JSON.stringify(inserted[0]), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      return new Response(JSON.stringify(data[0]), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    if (req.method === "PUT") {
      const body = await req.json();
      validate(body);

      const { data: existing } = await supabase.from("refresh_policy").select("id").limit(1).maybeSingle();
      if (!existing) throw new Error("NO_POLICY_FOUND");

      const { data, error } = await supabase
        .from("refresh_policy")
        .update({ ...body, updated_at: new Date().toISOString() })
        .eq("id", existing.id)
        .select()
        .single();

      if (error) throw error;
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify({ error: "METHOD_NOT_ALLOWED" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
