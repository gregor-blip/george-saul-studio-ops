import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // --- Auth guard ---
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- Monday.com sync logic ---
    const mondayToken = Deno.env.get("MONDAY_API_TOKEN");
    const boardId = Deno.env.get("MONDAY_ALLOCATION_BOARD_ID");

    if (!mondayToken || !boardId) {
      return new Response(JSON.stringify({ error: "Monday.com not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Fetch items from Monday.com
    const mondayResponse = await fetch("https://api.monday.com/v2", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: mondayToken,
      },
      body: JSON.stringify({
        query: `{ boards(ids: [${boardId}]) { items_page(limit: 500) { items { id name column_values { id text value } } } } }`,
      }),
    });

    if (!mondayResponse.ok) {
      return new Response(JSON.stringify({ error: "Failed to fetch from Monday.com" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const mondayData = await mondayResponse.json();
    const items = mondayData?.data?.boards?.[0]?.items_page?.items ?? [];

    // Upsert items into monday_items table
    for (const item of items) {
      const columnValues: Record<string, string> = {};
      let assignedTo: string | null = null;
      let clientNameRaw: string | null = null;
      let status: string | null = null;

      for (const col of item.column_values ?? []) {
        columnValues[col.id] = col.text ?? col.value;
        if (col.id === "person") assignedTo = col.text;
        if (col.id === "client" || col.id === "text") clientNameRaw = col.text;
        if (col.id === "status") status = col.text;
      }

      await adminClient.from("monday_items").upsert(
        {
          monday_board_id: boardId,
          monday_item_id: item.id,
          item_name: item.name,
          status,
          assigned_to: assignedTo,
          client_name_raw: clientNameRaw,
          custom_fields: columnValues,
          synced_at: new Date().toISOString(),
        },
        { onConflict: "monday_board_id,monday_item_id" }
      );
    }

    return new Response(JSON.stringify({ success: true, synced: items.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Sync error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
