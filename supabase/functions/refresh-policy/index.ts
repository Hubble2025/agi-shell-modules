import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type RefreshPolicy = {
  id: number;
  default_interval: number;
  module_interval: number;
  settings_interval: number;
  dashboard_interval: number;
  updated_at: string;
  error?: string;
};

type RefreshPolicyInput = {
  default_interval: number;
  module_interval: number;
  settings_interval: number;
  dashboard_interval: number;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS"
};

function validate(input: RefreshPolicyInput) {
  const keys: (keyof RefreshPolicyInput)[] = [
    "default_interval",
    "module_interval",
    "settings_interval",
    "dashboard_interval"
  ];
  for (const k of keys) {
    const v = input[k];
    if (typeof v !== "number") throw new Error("INVALID_INTERVAL");
    if (v < 1000 || v > 60000) throw new Error("INTERVAL_OUT_OF_RANGE");
  }
}

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

  const method = req.method.toUpperCase();

  if (method === "GET") {
    const { data, error } = await supabase
      .from("refresh_policy")
      .select("*")
      .limit(1);

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

    if (!data || data.length === 0) {
      const { data: inserted, error: insertError } = await supabase
        .from("refresh_policy")
        .insert({ default_interval: 5000 })
        .select("*")
        .limit(1);

      if (insertError) {
        return new Response(
          JSON.stringify({ error: insertError.message }),
          {
            status: 500,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json"
            }
          }
        );
      }

      return new Response(
        JSON.stringify(inserted[0]),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json"
          }
        }
      );
    }

    return new Response(
      JSON.stringify(data[0]),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      }
    );
  }

  if (method === "PUT") {
    const body = await req.json().catch(() => null);

    if (!body) {
      return new Response(
        JSON.stringify({ error: "INVALID_BODY" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json"
          }
        }
      );
    }

    try {
      validate(body as RefreshPolicyInput);
    } catch (err: any) {
      return new Response(
        JSON.stringify({ error: err.message }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json"
          }
        }
      );
    }

    const { data: existingData } = await supabase
      .from("refresh_policy")
      .select("id")
      .limit(1)
      .maybeSingle();

    if (!existingData) {
      return new Response(
        JSON.stringify({ error: "NO_POLICY_FOUND" }),
        {
          status: 404,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json"
          }
        }
      );
    }

    const { data, error } = await supabase
      .from("refresh_policy")
      .update({
        default_interval: body.default_interval,
        module_interval: body.module_interval,
        settings_interval: body.settings_interval,
        dashboard_interval: body.dashboard_interval,
        updated_at: new Date().toISOString()
      })
      .eq("id", existingData.id)
      .select("*")
      .limit(1);

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

    return new Response(
      JSON.stringify(data[0]),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      }
    );
  }

  return new Response(
    JSON.stringify({ error: "METHOD_NOT_ALLOWED" }),
    {
      status: 405,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    }
  );
});