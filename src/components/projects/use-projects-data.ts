import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { ProjectBurn, ScopeAmendment, WeeklyHours } from "./types";

export function useProjectBurn() {
  return useQuery({
    queryKey: ["project-burn"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("v_project_burn")
        .select("*")
        .order("consumed_hours", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ProjectBurn[];
    },
  });
}

export function useScopeAmendments(projectId: string | null) {
  return useQuery({
    queryKey: ["scope-amendments", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from("scope_amendments")
        .select("*")
        .eq("project_id", projectId)
        .order("amendment_date", { ascending: true });
      if (error) throw error;
      return (data ?? []) as ScopeAmendment[];
    },
    enabled: projectId !== null,
  });
}

export function useProjectAllocations(projectId: string | null) {
  return useQuery({
    queryKey: ["project-allocations", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from("weekly_allocations")
        .select("week_start_date, allocated_hours")
        .eq("project_id", projectId)
        .order("week_start_date", { ascending: true });
      if (error) throw error;

      const weekMap = new Map<string, number>();
      for (const row of data ?? []) {
        const existing = weekMap.get(row.week_start_date) ?? 0;
        weekMap.set(row.week_start_date, existing + (row.allocated_hours as number));
      }

      const result: WeeklyHours[] = [];
      for (const [week, hours] of weekMap) {
        result.push({ week_start_date: week, hours });
      }
      return result.sort((a, b) => a.week_start_date.localeCompare(b.week_start_date));
    },
    enabled: projectId !== null,
  });
}
