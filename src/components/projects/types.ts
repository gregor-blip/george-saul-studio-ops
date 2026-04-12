export type ProjectStatus = "active" | "completed" | "on-hold";
export type StatusFilter = "active" | "all" | "completed" | "on-hold";

export interface ProjectBurn {
  project_id: string;
  project_name: string;
  client_name: string;
  status: ProjectStatus;
  start_date: string | null;
  end_date: string | null;
  original_scope_hours: number | null;
  original_scope_revenue: number | null;
  effective_scope_hours: number | null;
  effective_scope_revenue: number | null;
  amendment_count: number;
  consumed_hours: number;
  consumed_cost: number;
  hours_remaining: number;
  burn_pct: number | null;
  is_over_scope: boolean;
}

export interface ScopeAmendment {
  id: string;
  project_id: string;
  amendment_date: string | null;
  hours_change: number;
  revenue_change: number | null;
  reason: string | null;
  approved_by: string | null;
  created_at: string;
}

export interface WeeklyHours {
  week_start_date: string;
  hours: number;
}
