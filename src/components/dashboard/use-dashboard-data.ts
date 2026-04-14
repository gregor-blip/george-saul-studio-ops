import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type {
  StudioSummary,
  ClientProfitability,
  Receivable,
  ReceivablesSummary,
} from "./types";

export type Period = "2026" | "2025" | "all";

interface DateRange {
  start: string | null; // ISO date, inclusive
  end: string | null;   // ISO date, exclusive
}

function periodToRange(period: Period): DateRange {
  if (period === "2026") return { start: "2026-01-01", end: "2027-01-01" };
  if (period === "2025") return { start: "2025-01-01", end: "2026-01-01" };
  return { start: null, end: null };
}

function periodToFiscalYears(period: Period): number[] | null {
  if (period === "2026") return [2026];
  if (period === "2025") return [2025];
  return null; // all
}

// ---------------------------------------------------------------------------
// Studio Summary — assembled from monthly views + qb_expenses + operational
// ---------------------------------------------------------------------------

async function fetchStudioSummary(period: Period): Promise<StudioSummary> {
  const range = periodToRange(period);
  const fiscalYears = periodToFiscalYears(period);

  // 1. Agency revenue from v_revenue_monthly_total
  let agencyQuery = supabase
    .from("v_revenue_monthly_total" as any)
    .select("agency_revenue, fiscal_year");
  if (fiscalYears) {
    agencyQuery = agencyQuery.in("fiscal_year", fiscalYears);
  }
  const { data: agencyRows, error: agencyErr } = await agencyQuery;
  if (agencyErr) throw agencyErr;
  const agencyRevenue = (agencyRows ?? []).reduce(
    (sum: number, r: any) => sum + (Number(r.agency_revenue) || 0),
    0
  );

  // 2. Media revenue from v_media_monthly_total
  let mediaQuery = supabase
    .from("v_media_monthly_total" as any)
    .select("media_billed, fiscal_year");
  if (fiscalYears) {
    mediaQuery = mediaQuery.in("fiscal_year", fiscalYears);
  }
  const { data: mediaRows, error: mediaErr } = await mediaQuery;
  if (mediaErr) throw mediaErr;
  const mediaRevenueBilled = (mediaRows ?? []).reduce(
    (sum: number, r: any) => sum + (Number(r.media_billed) || 0),
    0
  );

  // 3. Media spend from qb_expenses (platform vendors)
  let expenseQuery = supabase
    .from("qb_expenses")
    .select("amount, expense_date")
    .or(
      "vendor.ilike.%stackadapt%,vendor.ilike.%facebook%,vendor.ilike.%google ads%," +
      "category.ilike.%stackadapt%,category.ilike.%facebook%,category.ilike.%google%,category.ilike.%advertising%"
    );
  if (range.start) expenseQuery = expenseQuery.gte("expense_date", range.start);
  if (range.end) expenseQuery = expenseQuery.lt("expense_date", range.end);
  const { data: expenseRows, error: expenseErr } = await expenseQuery;
  if (expenseErr) throw expenseErr;
  const mediaSpend = (expenseRows ?? []).reduce(
    (sum, r) => sum + (Number(r.amount) || 0),
    0
  );

  // 4. Allocated cost from weekly_allocations (period-filtered)
  let allocQuery = supabase.rpc("get_client_profitability_by_period", {
    p_start: range.start,
    p_end: range.end,
  });
  const { data: allocRows, error: allocErr } = await allocQuery;
  if (allocErr) throw allocErr;
  const totalAllocatedCost = (allocRows ?? []).reduce(
    (sum: number, r: any) => sum + (Number(r.total_allocated_cost) || 0),
    0
  );

  // 4b. People cost and overhead from v_costs_monthly
  let costsQuery = supabase
    .from("v_costs_monthly" as any)
    .select("people_cost, overhead_cost, fiscal_year");
  if (fiscalYears) {
    costsQuery = costsQuery.in("fiscal_year", fiscalYears);
  }
  const { data: costsRows, error: costsErr } = await costsQuery;
  if (costsErr) throw costsErr;
  const peopleCost = (costsRows ?? []).reduce(
    (sum: number, r: any) => sum + (Number(r.people_cost) || 0),
    0
  );
  const overheadCost = (costsRows ?? []).reduce(
    (sum: number, r: any) => sum + (Number(r.overhead_cost) || 0),
    0
  );

  // 5. Operational fields (period-independent) from v_studio_summary
  const { data: ops, error: opsErr } = await supabase
    .from("v_studio_summary")
    .select(
      "active_headcount, avg_billable_utilisation_pct, active_projects, " +
      "allocations_current_week, financials_last_imported"
    )
    .single();
  if (opsErr) throw opsErr;

  const mediaSpread = mediaRevenueBilled - mediaSpend;
  const totalBilled = agencyRevenue + mediaRevenueBilled;

  const agencyTotalCost = peopleCost + overheadCost;

  return {
    agency_revenue: agencyRevenue,
    total_allocated_cost: totalAllocatedCost,
    agency_margin_pct:
      agencyRevenue === 0
        ? null
        : Math.round(
            ((agencyRevenue - agencyTotalCost) / agencyRevenue) * 10000
          ) / 100,
    people_cost: peopleCost,
    overhead_cost: overheadCost,
    media_revenue_billed: mediaRevenueBilled,
    media_spend: mediaSpend,
    media_spread: mediaSpread,
    media_margin_pct:
      mediaRevenueBilled === 0
        ? null
        : Math.round((mediaSpread / mediaRevenueBilled) * 10000) / 100,
    total_billed: totalBilled,
    estimated_net_income: Math.round(
      agencyRevenue + mediaSpread - agencyTotalCost
    ),
    active_headcount: Number(ops.active_headcount) || 0,
    agency_revenue_per_employee:
      Number(ops.active_headcount) > 0
        ? Math.round(agencyRevenue / Number(ops.active_headcount))
        : null,
    avg_billable_utilisation_pct: ops.avg_billable_utilisation_pct
      ? Number(ops.avg_billable_utilisation_pct)
      : null,
    active_projects: Number(ops.active_projects) || 0,
    allocations_current_week: ops.allocations_current_week,
    financials_last_imported: ops.financials_last_imported,
  };
}

export function useStudioSummary(period: Period = "2026") {
  return useQuery({
    queryKey: ["studio-summary", period],
    queryFn: () => fetchStudioSummary(period),
  });
}

// ---------------------------------------------------------------------------
// Client Profitability — via RPC with date range
// ---------------------------------------------------------------------------

export function useClientProfitability(period: Period = "2026") {
  const range = periodToRange(period);
  return useQuery({
    queryKey: ["client-profitability", period],
    queryFn: async () => {
      const { data, error } = await supabase.rpc(
        "get_client_profitability_by_period",
        { p_start: range.start, p_end: range.end }
      );
      if (error) throw error;
      return (data ?? []) as ClientProfitability[];
    },
  });
}

// ---------------------------------------------------------------------------
// Receivables — filtered by invoice_date
// ---------------------------------------------------------------------------

export function useReceivables(period: Period = "2026") {
  const range = periodToRange(period);
  return useQuery({
    queryKey: ["receivables", period],
    queryFn: async () => {
      let query = supabase.from("v_receivables").select("*");
      if (range.start) query = query.gte("invoice_date", range.start);
      if (range.end) query = query.lt("invoice_date", range.end);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as Receivable[];
    },
  });
}

// ---------------------------------------------------------------------------
// Receivables summary computation (unchanged)
// ---------------------------------------------------------------------------

export function computeReceivablesSummary(
  receivables: Receivable[]
): ReceivablesSummary {
  let totalInvoiced = 0;
  let totalPaid = 0;
  let outstanding = 0;
  let overdue = 0;
  let overdueCount = 0;

  for (const r of receivables) {
    totalInvoiced += r.amount;
    if (r.payment_status === "paid") {
      totalPaid += r.amount;
    } else {
      outstanding += r.amount;
      if (r.is_overdue) {
        overdue += r.amount;
        overdueCount++;
      }
    }
  }

  return { totalInvoiced, totalPaid, outstanding, overdue, overdueCount };
}
