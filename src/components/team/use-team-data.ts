import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type {
  TimeHorizon,
  Employee,
  WeekAllocation,
  ClientRef,
  EmployeeUtilisation,
  EmployeeWeekMap,
  CellData,
} from "./types";

function getMonday(d: Date): Date {
  const result = new Date(d);
  const day = result.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  result.setDate(result.getDate() + diff);
  result.setHours(0, 0, 0, 0);
  return result;
}

function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function getWeekColumns(horizon: TimeHorizon): string[] {
  const now = new Date();
  const monday = getMonday(now);
  const weeks: string[] = [];

  let count: number;
  switch (horizon) {
    case "week":
      count = 1;
      break;
    case "month": {
      const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const firstMonday = getMonday(firstOfMonth);
      if (firstMonday.getMonth() < now.getMonth() && firstMonday.getDate() > 1) {
        firstMonday.setDate(firstMonday.getDate() + 7);
      }
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      const cursor = new Date(firstMonday);
      while (cursor <= lastDay) {
        weeks.push(toDateStr(cursor));
        cursor.setDate(cursor.getDate() + 7);
      }
      return weeks.length > 0 ? weeks : [toDateStr(monday)];
    }
    case "3months":
      count = 13;
      break;
    case "6months":
      count = 26;
      break;
  }

  for (let i = 0; i < count; i++) {
    const d = new Date(monday);
    d.setDate(d.getDate() + i * 7);
    weeks.push(toDateStr(d));
  }
  return weeks;
}

export function useEmployees() {
  return useQuery({
    queryKey: ["team-employees"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employees")
        .select("id, name, role, is_partner, employment_type, country, available_hours_per_week, hourly_cost_rate")
        .eq("is_active", true)
        .neq("name", "Gregor Banic")
        .order("name");
      if (error) throw error;
      return (data ?? []) as Employee[];
    },
  });
}

export function useClients() {
  return useQuery({
    queryKey: ["team-clients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("id, name, is_internal");
      if (error) throw error;
      return (data ?? []) as ClientRef[];
    },
  });
}

export function useWeeklyAllocations(weeks: string[]) {
  const startDate = weeks[0];
  const endDate = weeks[weeks.length - 1];

  return useQuery({
    queryKey: ["team-allocations", startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("weekly_allocations")
        .select("employee_id, week_start_date, client_id, allocated_hours")
        .gte("week_start_date", startDate)
        .lte("week_start_date", endDate);
      if (error) throw error;
      return (data ?? []) as WeekAllocation[];
    },
    enabled: weeks.length > 0,
  });
}

export function useEmployeeUtilisation() {
  return useQuery({
    queryKey: ["team-utilisation"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("v_employee_utilisation")
        .select("*");
      if (error) throw error;
      return (data ?? []) as EmployeeUtilisation[];
    },
  });
}

export function buildWeekMap(
  allocations: WeekAllocation[],
  clientMap: Map<string, ClientRef>
): EmployeeWeekMap {
  const result: EmployeeWeekMap = {};

  for (const a of allocations) {
    if (!result[a.employee_id]) result[a.employee_id] = {};
    const weekData = result[a.employee_id];

    if (!weekData[a.week_start_date]) {
      weekData[a.week_start_date] = {
        billableHours: 0,
        internalHours: 0,
        totalHours: 0,
        clients: [],
      };
    }

    const cell = weekData[a.week_start_date];
    const client = clientMap.get(a.client_id);
    const isInternal = client?.is_internal ?? false;

    if (isInternal) {
      cell.internalHours += a.allocated_hours;
    } else {
      cell.billableHours += a.allocated_hours;
    }
    cell.totalHours += a.allocated_hours;

    cell.clients.push({
      name: client?.name ?? "Unknown",
      hours: a.allocated_hours,
      isInternal,
    });
  }

  return result;
}

export function getEmptyCell(): CellData {
  return { billableHours: 0, internalHours: 0, totalHours: 0, clients: [] };
}
