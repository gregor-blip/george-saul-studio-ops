export type TimeHorizon = "week" | "month" | "3months" | "6months";

export interface Employee {
  id: string;
  name: string;
  role: string | null;
  is_partner: boolean;
  employment_type: string;
  country: string;
  available_hours_per_week: number;
  hourly_cost_rate: number | null;
}

export interface WeekAllocation {
  employee_id: string;
  week_start_date: string;
  client_id: string;
  allocated_hours: number;
}

export interface ClientRef {
  id: string;
  name: string;
  is_internal: boolean;
}

export interface EmployeeUtilisation {
  employee_id: string;
  employee_name: string;
  billable_hours: number | null;
  total_hours: number | null;
  billable_utilisation_pct: number | null;
  total_utilisation_pct: number | null;
  billable_hours_remaining: number | null;
  week_start_date: string | null;
}

export interface CellData {
  billableHours: number;
  internalHours: number;
  totalHours: number;
  clients: { name: string; hours: number; isInternal: boolean }[];
}

export interface EmployeeWeekMap {
  [employeeId: string]: {
    [weekDate: string]: CellData;
  };
}

export const COUNTRY_FLAGS: Record<string, string> = {
  US: "\u{1F1FA}\u{1F1F8}",
  CA: "\u{1F1E8}\u{1F1E6}",
  MX: "\u{1F1F2}\u{1F1FD}",
  ZA: "\u{1F1FF}\u{1F1E6}",
  EU: "\u{1F1EA}\u{1F1FA}",
  OTHER: "\u{1F30D}",
};
