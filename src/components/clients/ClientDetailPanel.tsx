import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { ClientProfitability } from "@/components/dashboard/types";
import type { ClientIntelligence } from "./types";
import {
  formatCurrency,
  formatPct,
  marginDotColor,
} from "@/components/dashboard/format";

interface ClientDetailPanelProps {
  client: ClientProfitability;
  onClose: () => void;
}

function ImportanceDot({ importance }: { importance: string }) {
  const color =
    importance === "critical"
      ? "bg-red-400"
      : importance === "high"
        ? "bg-amber-400"
        : "bg-zinc-500";
  return <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${color}`} />;
}

export function ClientDetailPanel({ client, onClose }: ClientDetailPanelProps) {
  const { data: intelligence } = useQuery({
    queryKey: ["client-intelligence", client.client_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_intelligence")
        .select("*")
        .eq("client_id", client.client_id)
        .eq("is_current", true)
        .order("importance", { ascending: true });
      if (error) throw error;
      return (data ?? []) as ClientIntelligence[];
    },
  });

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  const costRatio =
    client.total_revenue > 0
      ? (client.total_allocated_cost / client.total_revenue) * 100
      : 0;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/40 z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-[480px] z-50 bg-[#141414] border-l border-white/[0.08] overflow-y-auto transform transition-transform duration-300 ease-out translate-x-0">
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/[0.06] flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`h-2.5 w-2.5 rounded-full ${marginDotColor(client.gross_margin_pct)}`}
            />
            <h2 className="text-lg font-semibold text-white">
              {client.client_name}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4 p-6 border-b border-white/[0.06]">
          <div>
            <p className="text-xs text-zinc-500">Total Revenue</p>
            <p className="text-xl font-bold tabular-nums text-white">
              {formatCurrency(client.total_revenue)}
            </p>
          </div>
          <div>
            <p className="text-xs text-zinc-500">Gross Margin</p>
            <p className="text-xl font-bold tabular-nums text-white">
              {formatPct(client.gross_margin_pct)}
            </p>
          </div>
          <div>
            <p className="text-xs text-zinc-500">Effective Rate</p>
            <p className="text-xl font-bold tabular-nums text-white">
              {client.effective_hourly_rate !== null
                ? `$${Math.round(client.effective_hourly_rate)}/hr`
                : "\u2014"}
            </p>
          </div>
          <div>
            <p className="text-xs text-zinc-500">Total Hours</p>
            <p className="text-xl font-bold tabular-nums text-white">
              {Math.round(client.total_allocated_hours)}h
            </p>
          </div>
        </div>

        {/* Revenue vs Cost */}
        <div className="px-6 py-4 border-b border-white/[0.06]">
          <p className="text-xs uppercase tracking-wider text-zinc-600 mb-3">
            Revenue vs Cost
          </p>
          <div className="space-y-2">
            <div className="bg-white/[0.06] h-2 rounded-full w-full" />
            <div
              className="bg-[#0070F3] h-2 rounded-full"
              style={{ width: `${Math.min(costRatio, 100)}%` }}
            />
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-xs text-zinc-500">
              Revenue {formatCurrency(client.total_revenue)}
            </span>
            <span className="text-xs text-zinc-500">
              Cost {formatCurrency(client.total_allocated_cost)}
            </span>
          </div>
        </div>

        {/* Client Intelligence */}
        <div className="px-6 py-4">
          <p className="text-xs uppercase tracking-wider text-zinc-600 mb-3">
            Client Intelligence
          </p>
          {!intelligence || intelligence.length === 0 ? (
            <p className="text-sm text-zinc-600 italic">
              No client intelligence recorded yet. Ask Claude to add insights.
            </p>
          ) : (
            <div className="space-y-3">
              {intelligence.map((item) => (
                <div key={item.id} className="flex items-start gap-2">
                  <ImportanceDot importance={item.importance} />
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-zinc-600">
                      {item.category}
                    </p>
                    <p className="text-sm text-zinc-300 mt-0.5">
                      {item.insight}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
