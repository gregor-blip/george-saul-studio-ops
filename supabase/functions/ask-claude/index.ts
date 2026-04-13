import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.103.0";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface RequestBody {
  question: string;
  history?: Message[];
}

interface AnthropicDelta {
  type: string;
  delta?: { text?: string };
}

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, x-client-info, apikey",
};

function safeData<T>(
  result: { data: T | null; error: { message: string } | null },
  label: string,
  errors: string[]
): T | null {
  if (result.error) {
    console.error(
      `[ask-claude] ${label} fetch failed: ${result.error.message}`
    );
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
  return `You are the studio intelligence layer for George & Saul, a New York design studio. You have complete access to all live operational data below.

Your job: answer questions from Jesse (Founder) and Daniel (Director of Client Services) in plain English — concise, direct, and immediately actionable. These are smart, busy people. They don't need explanation of what the data is. They need the answer.

Rules:
- Never say "based on the data" or "according to the information" — just answer directly
- Use specific numbers when they add clarity. Skip them when they don't.
- If something needs attention, say so plainly. Don't soften bad news.
- Maximum 4 sentences unless a breakdown is genuinely needed
- If asked about capacity or availability, always reference specific people by name
- If asked about profitability, give the margin % and whether it's healthy (target: >50% gross margin)
- Never mention internal clients (is_internal=true) in any answer — Business Development, Internal/Admin, Management, and Professional Development are overhead categories, not real clients. Never list them or count them when answering questions about clients.
- Currency is USD, not EUR.
- Today's date: ${today}

At the end of your answer, on a NEW LINE, output exactly this JSON and nothing else after it:
{"suggestions": ["follow-up question 1", "follow-up question 2", "follow-up question 3"]}

Make the suggestions specific to what was just asked — not generic.

--- LIVE STUDIO DATA ---

STUDIO SUMMARY:
${JSON.stringify(studioSummary ?? [], null, 2)}

CLIENT PROFITABILITY:
${JSON.stringify(clientProfitability ?? [], null, 2)}

EMPLOYEE UTILISATION:
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

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!anthropicKey) {
    console.error("[ask-claude] ANTHROPIC_API_KEY not set");
    return new Response(
      JSON.stringify({ error: "Claude is unavailable. Please try again." }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  let question: string;
  let history: Message[] | undefined;

  try {
    const body: RequestBody = await req.json();
    question = body.question;
    history = body.history;
    if (!question || typeof question !== "string") {
      throw new Error("Missing question");
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: `Invalid request: ${msg}` }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const fetchErrors: string[] = [];

  const [
    studioSummaryRes,
    clientProfitabilityRes,
    employeeUtilisationRes,
    projectBurnRes,
    effectiveRateRes,
    receivablesRes,
    allocationAccuracyRes,
    forecastRes,
    employeesRes,
    clientsRes,
    weeklyAllocationsRes,
    recurringAllocationsRes,
    legoCatalogueRes,
    pipelineRes,
  ] = await Promise.all([
    supabase.from("v_studio_summary").select("*"),
    supabase.from("v_client_profitability").select("*"),
    supabase.from("v_employee_utilisation").select("*"),
    supabase.from("v_project_burn").select("*"),
    supabase.from("v_effective_rate").select("*"),
    supabase.from("v_receivables").select("*"),
    supabase.from("v_allocation_accuracy").select("*").limit(100),
    supabase.from("v_forecast").select("*"),
    supabase
      .from("employees")
      .select(
        "id, name, role, is_partner, is_active, available_hours_per_week, hourly_cost_rate, employment_type"
      )
      .eq("is_active", true),
    supabase
      .from("clients")
      .select("id, name, status, billing_rate, is_internal")
      .eq("status", "active"),
    supabase
      .from("weekly_allocations")
      .select(
        "week_start_date, employee_id, client_id, allocated_hours, notes, actual_outcome, variance_hours"
      )
      .order("week_start_date", { ascending: false })
      .limit(300),
    supabase
      .from("recurring_allocations")
      .select(
        "employee_id, client_id, allocated_hours, start_date, end_date, cadence_days, status"
      )
      .eq("status", "active"),
    supabase
      .from("lego_catalogue")
      .select("name, category, estimated_hours, confidence, is_active")
      .eq("is_active", true),
    supabase
      .from("pipeline")
      .select(
        "prospect_name, project_name, expected_revenue, expected_hours, expected_start_date, probability, status"
      ),
  ]);

  const studioSummary = safeData(studioSummaryRes, "v_studio_summary", fetchErrors);
  const clientProfitability = safeData(clientProfitabilityRes, "v_client_profitability", fetchErrors);
  const employeeUtilisation = safeData(employeeUtilisationRes, "v_employee_utilisation", fetchErrors);
  const projectBurn = safeData(projectBurnRes, "v_project_burn", fetchErrors);
  const effectiveRate = safeData(effectiveRateRes, "v_effective_rate", fetchErrors);
  const receivables = safeData(receivablesRes, "v_receivables", fetchErrors);
  const allocationAccuracy = safeData(allocationAccuracyRes, "v_allocation_accuracy", fetchErrors);
  const forecast = safeData(forecastRes, "v_forecast", fetchErrors);
  const employees = safeData(employeesRes, "employees", fetchErrors);
  const clients = safeData(clientsRes, "clients", fetchErrors);
  const weeklyAllocations = safeData(weeklyAllocationsRes, "weekly_allocations", fetchErrors);
  const recurringAllocations = safeData(recurringAllocationsRes, "recurring_allocations", fetchErrors);
  const legoCatalogue = safeData(legoCatalogueRes, "lego_catalogue", fetchErrors);
  const pipeline = safeData(pipelineRes, "pipeline", fetchErrors);

  if (fetchErrors.length > 0) {
    console.warn(
      `[ask-claude] ${fetchErrors.length} data fetches failed, continuing with partial data`
    );
  }

  const today = new Date().toISOString().split("T")[0];

  const systemPrompt = buildSystemPrompt(
    today,
    studioSummary,
    clientProfitability,
    employeeUtilisation,
    projectBurn,
    effectiveRate,
    receivables,
    allocationAccuracy,
    forecast,
    employees,
    clients,
    weeklyAllocations,
    recurringAllocations,
    legoCatalogue,
    pipeline
  );

  const messages: Message[] = [
    ...(history ?? []),
    { role: "user", content: question },
  ];

  let anthropicResponse: Response;
  try {
    anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 600,
        stream: true,
        system: systemPrompt,
        messages,
      }),
    });

    if (!anthropicResponse.ok) {
      const errorBody = await anthropicResponse.text();
      console.error(
        `[ask-claude] Anthropic API error ${anthropicResponse.status}: ${errorBody}`
      );
      return new Response(
        JSON.stringify({
          error: "Claude is unavailable. Please try again.",
        }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[ask-claude] Anthropic API request failed: ${msg}`);
    return new Response(
      JSON.stringify({ error: "Claude is unavailable. Please try again." }),
      {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const reader = anthropicResponse.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6).trim();
              if (data === "[DONE]") continue;
              try {
                const parsed: AnthropicDelta = JSON.parse(data);
                if (
                  parsed.type === "content_block_delta" &&
                  parsed.delta?.text
                ) {
                  controller.enqueue(
                    encoder.encode(
                      `data: ${JSON.stringify({ text: parsed.delta.text })}\n\n`
                    )
                  );
                }
              } catch {
                // skip
              }
            }
          }
        }
      } catch (streamErr) {
        const msg =
          streamErr instanceof Error ? streamErr.message : String(streamErr);
        console.error(`[ask-claude] Stream error: ${msg}`);
      } finally {
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      ...corsHeaders,
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
});
