import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type {
  StudioSummary,
  ClientProfitability,
  Receivable,
  ReceivablesSummary,
} from "./types";

export function useStudioSummary() {
  return useQuery({
    queryKey: ["studio-summary"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("v_studio_summary")
        .select("*")
        .single();
      if (error) throw error;
      return data as StudioSummary;
    },
  });
}

export function useClientProfitability() {
  return useQuery({
    queryKey: ["client-profitability"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("v_client_profitability")
        .select("*")
        .order("total_revenue", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ClientProfitability[];
    },
  });
}

export function useReceivables() {
  return useQuery({
    queryKey: ["receivables"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("v_receivables")
        .select("*");
      if (error) throw error;
      return (data ?? []) as Receivable[];
    },
  });
}

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
