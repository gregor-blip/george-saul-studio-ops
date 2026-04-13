export interface StudioSummary {
  // Agency engine
  agency_revenue: number;
  total_allocated_cost: number;
  agency_margin_pct: number | null;

  // Media engine
  media_revenue_billed: number;
  media_spend: number;
  media_spread: number;
  media_margin_pct: number | null;

  // Combined
  total_billed: number;
  estimated_net_income: number;

  // Operational
  active_headcount: number;
  agency_revenue_per_employee: number | null;
  avg_billable_utilisation_pct: number | null;
  active_projects: number;
  allocations_current_week: string | null;
  financials_last_imported: string | null;
}

export interface ClientProfitability {
  client_id: string;
  client_name: string;
  business_line: "agency" | "media" | "internal";
  total_revenue: number;
  total_allocated_cost: number;
  gross_margin_pct: number | null;
  effective_hourly_rate: number | null;
  realisation_rate_pct: number | null;
  billing_rate: number;
  total_allocated_hours: number;
}

export interface Receivable {
  client_name: string;
  invoice_number: string | null;
  invoice_date: string | null;
  amount: number;
  payment_status: string | null;
  payment_date: string | null;
  days_outstanding: number | null;
  is_overdue: boolean | null;
}

export interface ReceivablesSummary {
  totalInvoiced: number;
  totalPaid: number;
  outstanding: number;
  overdue: number;
  overdueCount: number;
}
