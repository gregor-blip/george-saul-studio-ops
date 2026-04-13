import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.103.0";

// -- Types -------------------------------------------------------------------

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

type DataCategory =
  | "capacity"
  | "profitability"
  | "revenue"
  | "projects"
  | "pipeline"
  | "overview";

// -- Question classifier -----------------------------------------------------

const CATEGORY_PATTERNS: Record<DataCategory, RegExp[]> = {
  capacity: [
    /\b(free|available|capacity|utilis|utiliz|allocat|hours?\s+left|overloaded|bandwidth|who.*time|who.*free|busy|workload)\b/i,
    /\b(team|employee|staff|headcount|hire|contractor)\b/i,
    /\b(this week|next week|schedule|assign)\b/i,
  ],
  profitability: [
    /\b(profit|margin|cost|rate|billing|realisation|realization|effective.?rate|expensive|cheap)\b/i,
    /\b(client.*health|healthy|unhealthy|below.*target|under.?performing)\b/i,
  ],
  revenue: [
    /\b(revenue|invoice|receiv|paid|unpaid|overdue|outstanding|cash|collect|aging|ar\b|money|earn|billed)\b/i,
    /\b(quickbooks|qb|financial|import)\b/i,
  ],
  projects: [
    /\b(project|scope|burn|over.?scope|amendment|deliverable|deadline|timeline|milestone)\b/i,
    /\b(hours?\s+remaining|consumed|on.?track)\b/i,
  ],
  pipeline: [
    /\b(pipeline|prospect|lead|new.?business|forecast|upcoming|expected|probability|pitch|proposal)\b/i,
  ],
  overview: [
    /\b(overview|summary|studio|how.*doing|health|dashboard|everything|status|state\s+of)\b/i,
    /\b(biggest|top|worst|best|most|least)\b/i,
  ],
};

function classifyQuestion(question: string, history?: Message[]): DataCategory[] {
  const fullText = [
    ...(history ?? []).map((m) => m.content),
    question,
  ].join(" ");

  const matched = new Set<DataCategory>();

  for (const [category, patterns] of Object.entries(CATEGORY_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(fullText)) {
        matched.add(category as DataCategory);
        break;
      }
    }
  }

  // If nothing matched or overview matched, give a focused default set
  if (matched.size === 0) {
    matched.add("overview");
  }

  return [...matched];
}

// -- Selective data fetching -------------------------------------------------

interface StudioData {
  [key: string]: unknown;
}

async function fetchForCategories(
  supabase: SupabaseClient,
  categories: DataCategory[]
): Promise<StudioData> {
  const data: StudioData = {};
  const fetches: Promise<void>[] = [];

  const cats = new Set(categories);

  // Always fetch studio summary (1 row, tiny)
  fetches.push(
    supabase.from("v_studio_summary").select("*").single().then((r) => {
      data.studioSummary = r.data;
    })
  );

  // Always fetch active employees (20 rows max, useful for name resolution)
  fetches.push(
    supabase
      .from("employees")
      .select("id, name, role, is_partner, available_hours_per_week, hourly_cost_rate, employment_type, country")
      .eq("is_active", true)
      .then((r) => { data.employees = r.data; })
  );

  // Always fetch active clients (21 rows max)
  fetches.push(
    supabase
      .from("clients")
      .select("id, name, status, billing_rate, is_internal, is_passthrough")
      .eq("status", "active")
      .then((r) => { data.clients = r.data; })
  );

  if (cats.has("capacity") || cats.has("overview")) {
    fetches.push(
      supabase.from("v_employee_utilisation").select("*").then((r) => {
        data.employeeUtilisation = r.data;
      })
    );
    fetches.push(
      supabase
        .from("weekly_allocations")
        .select("week_start_date, employee_id, client_id, allocated_hours, notes")
        .order("week_start_date", { ascending: false })
        .limit(100)
        .then((r) => { data.weeklyAllocations = r.data; })
    );
    fetches.push(
      supabase
        .from("recurring_allocations")
        .select("employee_id, client_id, allocated_hours, start_date, end_date, cadence_days, status")
        .eq("status", "active")
        .then((r) => { data.recurringAllocations = r.data; })
    );
  }

  if (cats.has("profitability") || cats.has("overview")) {
    fetches.push(
      supabase.from("v_client_profitability").select("*").then((r) => {
        data.clientProfitability = r.data;
      })
    );
    fetches.push(
      supabase.from("v_effective_rate").select("*").then((r) => {
        data.effectiveRate = r.data;
      })
    );
  }

  if (cats.has("revenue") || cats.has("overview")) {
    fetches.push(
      supabase.from("v_receivables").select("*").limit(20).then((r) => {
        data.receivables = r.data;
      })
    );
  }

  if (cats.has("projects") || cats.has("overview")) {
    fetches.push(
      supabase.from("v_project_burn").select("*").then((r) => {
        data.projectBurn = r.data;
      })
    );
  }

  if (cats.has("pipeline") || cats.has("overview")) {
    fetches.push(
      supabase
        .from("pipeline")
        .select("prospect_name, project_name, expected_revenue, expected_hours, expected_start_date, probability, status")
        .then((r) => { data.pipeline = r.data; })
    );
    fetches.push(
      supabase.from("v_forecast").select("*").then((r) => {
        data.forecast = r.data;
      })
    );
  }

  await Promise.all(fetches);
  return data;
}

// -- System prompt builder ---------------------------------------------------

function buildSystemPrompt(today: string, categories: DataCategory[], data: StudioData): string {
  const sections: string[] = [];

  sections.push(`STUDIO SUMMARY:\n${JSON.stringify(data.studioSummary ?? {}, null, 2)}`);
  sections.push(`ACTIVE EMPLOYEES:\n${JSON.stringify(data.employees ?? [], null, 2)}`);
  sections.push(`ACTIVE CLIENTS:\n${JSON.stringify(data.clients ?? [], null, 2)}`);

  if (data.employeeUtilisation) {
    sections.push(`EMPLOYEE UTILISATION:\n${JSON.stringify(data.employeeUtilisation, null, 2)}`);
  }
  if (data.weeklyAllocations) {
    sections.push(`RECENT WEEKLY ALLOCATIONS:\n${JSON.stringify(data.weeklyAllocations, null, 2)}`);
  }
  if (data.recurringAllocations) {
    sections.push(`ACTIVE RECURRING ALLOCATIONS:\n${JSON.stringify(data.recurringAllocations, null, 2)}`);
  }
  if (data.clientProfitability) {
    sections.push(`CLIENT PROFITABILITY:\n${JSON.stringify(data.clientProfitability, null, 2)}`);
  }
  if (data.effectiveRate) {
    sections.push(`EFFECTIVE RATES:\n${JSON.stringify(data.effectiveRate, null, 2)}`);
  }
  if (data.receivables) {
    sections.push(`RECEIVABLES (top 20):\n${JSON.stringify(data.receivables, null, 2)}`);
  }
  if (data.projectBurn) {
    sections.push(`PROJECT BURN:\n${JSON.stringify(data.projectBurn, null, 2)}`);
  }
  if (data.pipeline) {
    sections.push(`PIPELINE:\n${JSON.stringify(data.pipeline, null, 2)}`);
  }
  if (data.forecast) {
    sections.push(`90-DAY FORECAST:\n${JSON.stringify(data.forecast, null, 2)}`);
  }

  return `You are the studio intelligence layer for George & Saul, a New York design studio. You have access to live operational data for the categories relevant to this question: ${categories.join(", ")}.

Your job: answer questions from Jesse (Founder) and Daniel (Director of Client Services) in plain English -- concise, direct, and immediately actionable.

Rules:
- Just answer directly. No preamble.
- Use specific numbers when they add clarity. Skip them when they don't.
- If something needs attention, say so plainly. Don't soften bad news.
- Maximum 4 sentences unless a breakdown is genuinely needed.
- If asked about capacity, reference specific people by name.
- If asked about profitability, give the margin % and whether it's healthy (target: >50% gross margin).
- Never mention internal clients (is_internal=true) -- Business Development, Internal/Admin, Management, Professional Development are overhead categories, not real clients.
- GA Group Retail Solutions / Joann Fabric is a media pass-through ($7M) -- exclude from core metrics unless specifically asked.
- Currency is USD.
- Today's date: ${today}

At the end of your answer, on a NEW LINE, output exactly this JSON and nothing else after it:
{"suggestions": ["follow-up question 1", "follow-up question 2", "follow-up question 3"]}

Make the suggestions specific to what was just asked.

--- LIVE STUDIO DATA ---

${sections.join("\n\n")}`;
}

// -- CORS --------------------------------------------------------------------

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-client-info, apikey",
};

// -- Main --------------------------------------------------------------------

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
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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

  // Classify and fetch only what's needed
  const categories = classifyQuestion(question, history);
  console.log(`[ask-claude] Question: "${question.slice(0, 80)}" → categories: ${categories.join(", ")}`);

  const data = await fetchForCategories(supabase, categories);

  const today = new Date().toISOString().split("T")[0];
  const systemPrompt = buildSystemPrompt(today, categories, data);

  console.log(`[ask-claude] Prompt size: ~${Math.round(systemPrompt.length / 4)} tokens (${categories.length} categories)`);

  const messages: Message[] = [...(history ?? []), { role: "user", content: question }];

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
      console.error(`[ask-claude] Anthropic API error ${anthropicResponse.status}: ${errorBody}`);
      return new Response(
        JSON.stringify({ error: "Claude is unavailable. Please try again." }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[ask-claude] Anthropic API request failed: ${msg}`);
    return new Response(
      JSON.stringify({ error: "Claude is unavailable. Please try again." }),
      { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
              const d = line.slice(6).trim();
              if (d === "[DONE]") continue;
              try {
                const parsed: AnthropicDelta = JSON.parse(d);
                if (parsed.type === "content_block_delta" && parsed.delta?.text) {
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({ text: parsed.delta.text })}\n\n`)
                  );
                }
              } catch { /* skip */ }
            }
          }
        }
      } catch (streamErr) {
        const msg = streamErr instanceof Error ? streamErr.message : String(streamErr);
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
