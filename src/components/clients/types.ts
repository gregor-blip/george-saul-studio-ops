export interface ClientIntelligence {
  id: string;
  client_id: string;
  category: string;
  insight: string;
  importance: string;
  source: string | null;
  added_by: string | null;
  event_date: string | null;
  is_current: boolean;
  tags: string[] | null;
  created_at: string;
}

export type SortField =
  | "client_name"
  | "total_revenue"
  | "total_allocated_cost"
  | "gross_margin_pct"
  | "total_allocated_hours"
  | "effective_hourly_rate"
  | "realisation_rate_pct";

export type SortDirection = "asc" | "desc";
