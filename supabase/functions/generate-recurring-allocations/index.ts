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

    // --- Generate recurring allocations ---
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Get all active recurring allocations
    const { data: recurringAllocations, error: fetchError } = await adminClient
      .from("recurring_allocations")
      .select("*")
      .eq("status", "active");

    if (fetchError) {
      console.error("Fetch error:", fetchError);
      return new Response(JSON.stringify({ error: "Failed to fetch recurring allocations" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const today = new Date();
    const currentWeekStart = getWeekStart(today);
    let created = 0;
    let skipped = 0;

    for (const ra of recurringAllocations ?? []) {
      const startDate = new Date(ra.start_date);
      const endDate = ra.end_date ? new Date(ra.end_date) : null;

      // Check if current week is within range
      if (currentWeekStart < startDate) {
        skipped++;
        continue;
      }
      if (endDate && currentWeekStart > endDate) {
        skipped++;
        continue;
      }

      // Check if allocation already exists for this week
      const weekStartStr = formatDate(currentWeekStart);
      const { data: existing } = await adminClient
        .from("weekly_allocations")
        .select("id")
        .eq("employee_id", ra.employee_id)
        .eq("client_id", ra.client_id)
        .eq("week_start_date", weekStartStr)
        .eq("recurring_allocation_id", ra.id)
        .maybeSingle();

      if (existing) {
        skipped++;
        continue;
      }

      // Create weekly allocation
      const { error: insertError } = await adminClient.from("weekly_allocations").insert({
        week_start_date: weekStartStr,
        employee_id: ra.employee_id,
        client_id: ra.client_id,
        project_id: ra.project_id,
        allocated_hours: ra.allocated_hours,
        recurring_allocation_id: ra.id,
        lego_ids: ra.lego_id ? [ra.lego_id] : null,
        notes: ra.notes,
        assigned_by: ra.assigned_by,
      });

      if (insertError) {
        console.error("Insert error:", insertError);
      } else {
        created++;
      }
    }

    return new Response(JSON.stringify({ success: true, created, skipped }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Generate error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}
