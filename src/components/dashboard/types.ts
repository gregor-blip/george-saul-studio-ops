export interface StudioSummary {
  total_billed: number;
  agency_revenue: number;
  total_allocated_cost: number;
  blended_margin_pct: number | null;
  active_headcount: number;
  revenue_per_employee: number | null;
  avg_billable_utilisation_pct: number | null;
  active_projects: number;
  allocations_current_week: string | null;
  financials_last_imported: string | null;
}

export interface ClientProfitability {
  client_id: string;
  client_name: string;
  is_internal: boolean;
  total_revenue: number;
  total_allocated_cost: number;
  gross_margin_pct: number | null;
  effective_hourly_rate: number | null;
  realisation_rate_pct: number | null;
  billing_rate: number;
  total_allocated_hours: number;
  is_passthrough: boolean;
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
