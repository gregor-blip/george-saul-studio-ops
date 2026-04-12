import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// -- Helpers -----------------------------------------------------------------

function safeData<T>(
  result: { data: T | null; error: { message: string } | null },
  label: string,
  errors: string[]
): T | null {
  if (result.error) {
    console.error(`[ask-claude] ${label} fetch failed: ${result.error.message}`);
    errors.push(`${label}: ${result.error.message}`);
    return null;
  }
  return result.data;
}

function buildSystemPrompt(
  today: string,
  studioSummary: unknown,
  clientProfitability: unknown,
  employeeUtilisation: unknown,
  projectBurn: unknown,
  effectiveRate: unknown,
  receivables: unknown,
  allocationAccuracy: unknown,
  forecast: unknown,
  employees: unknown,
  clients: unknown,
  weeklyAllocations: unknown,
  recurringAllocations: unknown,
  legoCatalogue: unknown,
  pipeline: unknown
): string {
  return `You are the studio intelligence layer for George & Saul, a New York design studio based in New York. You have complete access to all live operational data below.

Your job: answer questions from Jesse (Founder) and Daniel (Director of Client Services) in plain English — concise, direct, and immediately actionable. These are smart, busy people. They don't need explanation of what the data is. They need the answer.

Rules:
- Never say "based on the data" or "according to the information" — just answer directly
- Use specific numbers when they add clarity. Skip them when they don't.
- If something needs attention, say so plainly. Don't soften bad news.
- Maximum 4 sentences unless a breakdown is genuinely needed
- If asked about capacity or availability, always reference specific people by name
- If asked about profitability, give the margin % and whether it's healthy (target: >50% gross margin)
- Never mention internal clients (is_internal=true) in any answer — Business Development, Internal/Admin, Management, and Professional Development are overhead categories, not real clients. Never list them or count them when answering questions about clients.
- Today's date: ${today}

At the end of your answer, on a NEW LINE, output exactly this JSON and nothing else after it:
{"suggestions": ["follow-up question 1", "follow-up question 2", "follow-up question 3"]}

Make the suggestions specific to what was just asked — not generic.

--- LIVE STUDIO DATA ---

STUDIO SUMMARY:
${JSON.stringify(studioSummary ?? [], null, 2)}

CLIENT PROFITABILITY:
${JSON.stringify(clientProfitability ?? [], null, 2)}

EMPLOYEE UTILISATION (last 200 records):
${JSON.stringify(employeeUtilisation ?? [], null, 2)}

PROJECT BURN:
${JSON.stringify(projectBurn ?? [], null, 2)}

EFFECTIVE RATES:
${JSON.stringify(effectiveRate ?? [], null, 2)}

RECEIVABLES:
${JSON.stringify(receivables ?? [], null, 2)}

ALLOCATION ACCURACY:
${JSON.stringify(allocationAccuracy ?? [], null, 2)}

90-DAY FORECAST:
${JSON.stringify(forecast ?? [], null, 2)}

ACTIVE EMPLOYEES:
${JSON.stringify(employees ?? [], null, 2)}

ACTIVE CLIENTS:
${JSON.stringify(clients ?? [], null, 2)}

RECENT WEEKLY ALLOCATIONS (last 300 rows):
${JSON.stringify(weeklyAllocations ?? [], null, 2)}

ACTIVE RECURRING ALLOCATIONS:
${JSON.stringify(recurringAllocations ?? [], null, 2)}

LEGO CATALOGUE:
${JSON.stringify(legoCatalogue ?? [], null, 2)}

PIPELINE:
${JSON.stringify(pipeline ?? [], null, 2)}`;
}

// -- Main --------------------------------------------------------------------

Deno.serve(async (req: Request) => {
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

    // --- Input validation ---
    const { question, history } = await req.json();

    if (!question || typeof question !== "string") {
      return new Response(JSON.stringify({ error: "Bad Request: question is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (question.length > 2000) {
      return new Response(JSON.stringify({ error: "Question too long (max 2000 chars)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (history !== undefined && history !== null) {
      if (!Array.isArray(history) || history.length > 20) {
        return new Response(JSON.stringify({ error: "History must be an array of max 20 items" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // --- Fetch studio data using service role for full access ---
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const [
      { data: employees },
      { data: clients },
      { data: projects },
      { data: allocations },
      { data: revenue },
      { data: expenses },
      { data: summary },
      { data: utilisation },
      { data: profitability },
      { data: projectBurn },
      { data: forecast },
      { data: pipeline },
      { data: settings },
      { data: receivables },
    ] = await Promise.all([
      adminClient.from("employees").select("*"),
      adminClient.from("clients").select("*"),
      adminClient.from("projects").select("*"),
      adminClient.from("weekly_allocations").select("*"),
      adminClient.from("qb_revenue").select("*"),
      adminClient.from("qb_expenses").select("*"),
      adminClient.from("v_studio_summary").select("*"),
      adminClient.from("v_employee_utilisation").select("*"),
      adminClient.from("v_client_profitability").select("*"),
      adminClient.from("v_project_burn").select("*"),
      adminClient.from("v_forecast").select("*"),
      adminClient.from("pipeline").select("*"),
      adminClient.from("studio_settings").select("*"),
      adminClient.from("v_receivables").select("*"),
    ]);

    const studioContext = JSON.stringify({
      employees,
      clients,
      projects,
      allocations,
      revenue,
      expenses,
      summary,
      utilisation,
      profitability,
      projectBurn,
      forecast,
      pipeline,
      settings,
      receivables,
    });

    const systemPrompt = `You are the AI assistant for George & Saul, a creative studio. You have access to all studio data below. Answer questions about team utilisation, client profitability, project burn, pipeline, financials, and operations. Be concise and specific. Use numbers from the data. Currency is EUR.

At the end of every response, include a JSON array of 2-3 follow-up suggestion chips on a new line, formatted as: [SUGGESTIONS]["suggestion 1","suggestion 2","suggestion 3"]

STUDIO DATA:
${studioContext}`;

    const messages: Array<{ role: string; content: string }> = [];

    const safeHistory = Array.isArray(history) ? history : [];
    for (const h of safeHistory) {
      if (h && typeof h === "object" && typeof h.role === "string" && typeof h.content === "string") {
        messages.push({
          role: h.role === "assistant" ? "assistant" : "user",
          content: h.content.slice(0, 2000),
        });
      }
    }

    messages.push({ role: "user", content: question });

    const anthropicApiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!anthropicApiKey) {
      return new Response(JSON.stringify({ error: "Anthropic API key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicApiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 600,
        system: systemPrompt,
        messages,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Anthropic API error:", errorText);
      return new Response(JSON.stringify({ error: "Claude is unavailable. Please try again." }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Stream response back to client
    return new Response(response.body, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Edge function error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
