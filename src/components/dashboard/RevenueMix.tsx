import type { StudioSummary } from "./types";
import { formatPct } from "./format";

interface RevenueMixProps {
  summary: StudioSummary;
}

function fmtM(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${Math.round(value / 1_000)}K`;
  return `$${Math.round(value)}`;
}

function Arrow() {
  return (
    <span className="text-zinc-600 mx-3 text-lg shrink-0 self-center select-none">
      &rarr;
    </span>
  );
}

export function RevenueMix({ summary }: RevenueMixProps) {
  const agencyGrossProfit = summary.agency_revenue - summary.total_allocated_cost;
  const combinedGross = summary.media_spread + agencyGrossProfit;
  const netPctOfBilled =
    summary.total_billed > 0
      ? ((summary.estimated_net_income / summary.total_billed) * 100).toFixed(1)
      : null;

  return (
    <div className="bg-[#141414] rounded-xl border border-white/[0.08] p-6">
      <h3 className="text-sm font-semibold text-white mb-5">How Money Flows</h3>

      {/* ROW 1 — Media Engine */}
      <p className="text-[11px] uppercase tracking-wider text-zinc-600 mb-3">
        Engine 1 — Media Buying
      </p>
      <div className="flex items-stretch mb-1">
        <div className="flex-1 bg-[#1a2744] border border-blue-500/30 rounded-xl p-4">
          <p className="text-[10px] uppercase tracking-wider text-blue-400/70 mb-1">
            Clients Pay G&S
          </p>
          <p className="text-2xl font-bold tabular-nums text-white">
            {fmtM(summary.media_revenue_billed)}
          </p>
        </div>
        <Arrow />
        <div className="flex-1 bg-[#2a1414] border border-red-500/30 rounded-xl p-4">
          <p className="text-[10px] uppercase tracking-wider text-red-400/70 mb-1">
            G&S Pays Platforms
          </p>
          <p className="text-2xl font-bold tabular-nums text-red-400">
            ({fmtM(summary.media_spend)})
          </p>
        </div>
        <Arrow />
        <div className="flex-1 bg-[#142a1a] border border-emerald-500/30 rounded-xl p-4">
          <p className="text-[10px] uppercase tracking-wider text-emerald-400/70 mb-1">
            Media Spread (G&S Keeps)
          </p>
          <p className="text-2xl font-bold tabular-nums text-emerald-400">
            {fmtM(summary.media_spread)}
          </p>
          <p className="text-xs text-emerald-600 mt-1">
            {formatPct(summary.media_margin_pct)} margin
          </p>
        </div>
      </div>

      {/* Separator */}
      <div className="relative my-4">
        <div className="border-t border-dashed border-white/[0.06]" />
        <span className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#141414] px-3 text-[10px] uppercase tracking-wider text-zinc-700">
          Separate Economic Engines — Not Connected
        </span>
      </div>

      {/* ROW 2 — Agency Engine */}
      <p className="text-[11px] uppercase tracking-wider text-zinc-600 mb-3">
        Engine 2 — Core Business (Creative, Retainers, Strategy)
      </p>
      <div className="flex items-stretch mb-1">
        <div className="flex-1 bg-[#1a2419] border border-amber-500/30 rounded-xl p-4">
          <p className="text-[10px] uppercase tracking-wider text-amber-400/70 mb-1">
            Core Business Revenue
          </p>
          <p className="text-2xl font-bold tabular-nums text-white">
            {fmtM(summary.agency_revenue)}
          </p>
        </div>
        <Arrow />
        <div className="flex-1 bg-[#2a1414] border border-red-500/30 rounded-xl p-4">
          <p className="text-[10px] uppercase tracking-wider text-red-400/70 mb-1">
            People Cost
          </p>
          {summary.total_allocated_cost > 0 ? (
            <p className="text-2xl font-bold tabular-nums text-red-400">
              ({fmtM(summary.total_allocated_cost)})
            </p>
          ) : (
            <p className="text-sm text-zinc-600 italic mt-1">
              Pending allocations
            </p>
          )}
        </div>
        <Arrow />
        <div className="flex-1 bg-[#1a2444] border border-blue-500/30 rounded-xl p-4">
          <p className="text-[10px] uppercase tracking-wider text-blue-400/70 mb-1">
            Agency Gross Profit
          </p>
          <p className="text-2xl font-bold tabular-nums text-blue-400">
            {fmtM(agencyGrossProfit)}
          </p>
          <p className="text-xs text-blue-600 mt-1">
            {summary.agency_margin_pct !== null
              ? `${formatPct(summary.agency_margin_pct)} margin`
              : "100% until allocations entered"}
          </p>
        </div>
      </div>

      {/* Combined Row */}
      <div className="bg-[#0f1629] rounded-xl border border-white/[0.06] p-4 mt-4 flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-zinc-600 mb-1">
            Combined Gross Profit
          </p>
          <p className="text-lg font-bold tabular-nums text-white">
            {fmtM(summary.media_spread)} (media spread) + {fmtM(agencyGrossProfit)} (agency) = {fmtM(combinedGross)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-wider text-zinc-600 mb-1">
            Est. Net Income
          </p>
          <p className="text-xl font-bold tabular-nums text-emerald-400">
            {fmtM(summary.estimated_net_income)}
          </p>
          {netPctOfBilled && (
            <p className="text-xs text-zinc-600">
              {netPctOfBilled}% of total billed
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export function RevenueMixSkeleton() {
  return (
    <div className="bg-white/[0.04] rounded-xl animate-pulse h-[400px]" />
  );
}
