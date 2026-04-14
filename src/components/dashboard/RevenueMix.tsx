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
    <span className="text-white/40 mx-4 text-xl shrink-0 self-center select-none">
      &rarr;
    </span>
  );
}

export function RevenueMix({ summary }: RevenueMixProps) {
  const agencyGrossProfit = summary.agency_revenue - summary.production_cost;
  const combinedGross = summary.media_spread + agencyGrossProfit;
  const opex = summary.people_cost + summary.overhead_cost;
  const netMarginPct =
    combinedGross > 0
      ? ((summary.estimated_net_income / combinedGross) * 100).toFixed(1)
      : null;

  return (
    <div className="bg-[#141414] rounded-xl border border-white/[0.08] p-6">
      <h3 className="text-base font-semibold text-white mb-6">How Money Flows</h3>

      {/* ROW 1 -- Media Engine */}
      <p className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-4">
        Engine 1 -- Media Buying
      </p>
      <div className="flex items-stretch mb-1">
        <div className="flex-1 bg-[#1B3A6B] border border-blue-400/50 rounded-xl p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/70 mb-2">
            Clients Pay G&S
          </p>
          <p className="text-3xl font-bold tabular-nums tracking-tight text-white">
            {fmtM(summary.media_revenue_billed)}
          </p>
        </div>
        <Arrow />
        <div className="flex-1 bg-[#6B1B1B] border border-red-400/50 rounded-xl p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/70 mb-2">
            G&S Pays Platforms
          </p>
          <p className="text-3xl font-bold tabular-nums tracking-tight text-white">
            ({fmtM(summary.media_spend)})
          </p>
        </div>
        <Arrow />
        <div className="flex-1 bg-[#1B5C2E] border border-emerald-400/50 rounded-xl p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/70 mb-2">
            Media Spread (G&S Keeps)
          </p>
          <p className="text-3xl font-bold tabular-nums tracking-tight text-white">
            {fmtM(summary.media_spread)}
          </p>
          <p className="text-sm font-medium text-emerald-400 mt-1">
            {formatPct(summary.media_margin_pct)} margin
          </p>
        </div>
      </div>

      {/* Separator */}
      <div className="relative my-6">
        <div className="border-t border-dashed border-white/[0.08]" />
        <span className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#141414] px-3 text-xs text-white/25 tracking-widest uppercase">
          Separate Economic Engines -- Not Connected
        </span>
      </div>

      {/* ROW 2 -- Agency Engine */}
      <p className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-4">
        Engine 2 -- Core Business (Creative, Retainers, Strategy)
      </p>
      <div className="flex items-stretch mb-1">
        <div className="flex-1 bg-[#4A3500] border border-amber-400/50 rounded-xl p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/70 mb-2">
            Core Business Revenue
          </p>
          <p className="text-3xl font-bold tabular-nums tracking-tight text-white">
            {fmtM(summary.agency_revenue)}
          </p>
        </div>
        <Arrow />
        <div className="flex-1 bg-[#5C2B2B] border border-rose-400/50 rounded-xl p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/70 mb-2">
            Production Costs
          </p>
          <p className="text-3xl font-bold tabular-nums tracking-tight text-white">
            ({fmtM(summary.production_cost)})
          </p>
        </div>
        <Arrow />
        <div className="flex-1 bg-[#134040] border border-teal-400/50 rounded-xl p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/70 mb-2">
            Agency Gross Profit
          </p>
          <p className="text-3xl font-bold tabular-nums tracking-tight text-teal-400">
            {fmtM(agencyGrossProfit)}
          </p>
        </div>
      </div>

      {/* Combined Gross Profit */}
      <div className="bg-[#0D1F3C] rounded-xl border border-white/[0.12] p-5 mt-6">
        <p className="text-xs uppercase tracking-wider text-white/50 mb-2">
          Combined Gross Profit
        </p>
        <p className="text-xl font-bold tabular-nums text-white">
          {fmtM(summary.media_spread)} (media) + {fmtM(agencyGrossProfit)} (core business) = {fmtM(combinedGross)}
        </p>

        {/* Arrow down */}
        <div className="flex justify-center my-4">
          <span className="text-white/40 text-xl select-none">&darr;</span>
        </div>

        {/* OpEx and Net Income side by side */}
        <div className="flex items-stretch gap-4">
          <div className="flex-1 bg-[#6B1B1B] border border-red-400/50 rounded-xl p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-white/70 mb-2">
              Operating Expenses
            </p>
            <p className="text-2xl font-bold tabular-nums tracking-tight text-red-300">
              ({fmtM(opex)})
            </p>
          </div>
          <span className="text-white/40 text-2xl shrink-0 self-center select-none font-light">
            =
          </span>
          <div className="flex-1 bg-[#4A3500] border border-amber-400/50 rounded-xl p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-white/70 mb-2">
              Net Income
            </p>
            <p className="text-2xl font-bold tabular-nums tracking-tight text-amber-400">
              {fmtM(summary.estimated_net_income)}
            </p>
            {netMarginPct && (
              <p className="text-sm text-white/40 mt-1">
                {netMarginPct}% net margin
              </p>
            )}
          </div>
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
