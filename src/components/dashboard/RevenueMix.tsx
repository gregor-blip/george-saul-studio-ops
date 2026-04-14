import type { StudioSummary } from "./types";

interface RevenueMixProps {
  summary: StudioSummary;
}

function fmtM(value: number): string {
  const abs = Math.abs(value);
  const formatted =
    abs >= 1_000_000
      ? "$" + (abs / 1_000_000).toFixed(2) + "M"
      : abs >= 1_000
        ? "$" + Math.round(abs / 1_000) + "K"
        : "$" + Math.round(abs);
  return value < 0 ? "(" + formatted + ")" : formatted;
}

/* ── Reusable primitives ────────────────────────────────── */

function Arrow() {
  return (
    <span className="text-zinc-700 text-lg mx-3 shrink-0 self-center select-none">
      &rarr;
    </span>
  );
}

interface FlowBoxProps {
  label: string;
  value: string;
  accentColor: string;
  valueColor?: string;
  sub?: string;
  subColor?: string;
  large?: boolean;
}

function FlowBox({
  label,
  value,
  accentColor,
  valueColor = "text-white",
  sub,
  subColor = "text-zinc-600",
  large,
}: FlowBoxProps) {
  return (
    <div className="relative flex-1 overflow-hidden rounded-lg bg-[#121214] border border-[#262628] p-4">
      <div
        className="absolute left-0 top-1 bottom-1 w-0.5 rounded-full"
        style={{ backgroundColor: accentColor }}
      />
      <p className="text-[10px] font-normal uppercase tracking-widest text-zinc-600 mb-2">
        {label}
      </p>
      <p
        className={`${large ? "text-4xl" : "text-4xl"} font-bold tabular-nums tracking-tight ${valueColor}`}
      >
        {value}
      </p>
      {sub && (
        <p className={`text-[10px] ${subColor} mt-1`}>{sub}</p>
      )}
    </div>
  );
}

/* ── Main component ─────────────────────────────────────── */

export function RevenueMix({ summary }: RevenueMixProps) {
  const agencyGrossProfit = summary.agency_revenue - summary.production_cost;
  const combinedGross = summary.media_spread + agencyGrossProfit;
  const netMarginPct =
    summary.total_billed > 0
      ? ((summary.estimated_net_income / summary.total_billed) * 100).toFixed(1)
      : null;

  return (
    <div className="bg-[#121214] rounded-lg border border-[#262628] p-6">
      {/* Header */}
      <p className="text-[10px] uppercase tracking-widest text-zinc-700">
        How Money Flows
      </p>
      <div className="border-t border-zinc-900 mt-2 mb-4" />

      {/* ── ENGINE 1 ── */}
      <div className="bg-[#0D1C3A] rounded-md px-3 py-1 mb-3 w-fit">
        <span className="text-[11px] font-semibold text-[#6496ED] uppercase tracking-wider">
          Engine 1 &mdash; Media Buying
        </span>
      </div>

      <div className="flex items-stretch">
        <FlowBox
          label="Clients Pay G&S"
          value={fmtM(summary.media_revenue_billed)}
          accentColor="#6496ED"
        />
        <Arrow />
        <FlowBox
          label="G&S Pays Platforms"
          value={`(${fmtM(summary.media_spend)})`}
          accentColor="#B44B4B"
          valueColor="text-[#B44B4B]"
        />
        <Arrow />
        <FlowBox
          label="Media Spread (G&S Keeps)"
          value={fmtM(summary.media_spread)}
          accentColor="#41B972"
          valueColor="text-[#41B972]"
          sub={
            summary.media_margin_pct !== null
              ? `${summary.media_margin_pct.toFixed(1)}% margin`
              : undefined
          }
          subColor="text-[#2D7A4E]"
        />
      </div>

      {/* Separator */}
      <div className="relative my-4">
        <div className="border-t border-zinc-900" />
        <span className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#121214] px-3 text-[9px] uppercase tracking-widest text-zinc-800">
          Separate Economic Engines &mdash; Not Connected
        </span>
      </div>

      {/* ── ENGINE 2 ── */}
      <div className="bg-[#1A1505] rounded-md px-3 py-1 mb-3 w-fit">
        <span className="text-[11px] font-semibold text-[#C49B37] uppercase tracking-wider">
          Engine 2 &mdash; Core Business (Creative, Retainers, Strategy)
        </span>
      </div>

      <div className="flex items-stretch">
        <FlowBox
          label="Core Business Revenue"
          value={fmtM(summary.agency_revenue)}
          accentColor="#C49B37"
        />
        <Arrow />
        <FlowBox
          label="Production Costs"
          value={`(${fmtM(summary.production_cost)})`}
          accentColor="#8C3C3C"
          valueColor="text-[#8C3C3C]"
        />
        <Arrow />
        <FlowBox
          label="Agency Gross Profit"
          value={fmtM(agencyGrossProfit)}
          accentColor="#41AEB9"
          valueColor="text-[#41AEB9]"
        />
      </div>

      {/* ── COMBINED SECTION ── */}
      <div className="bg-[#0D0D11] rounded-lg border border-zinc-900 p-5 mt-4">
        <div className="flex items-stretch">
          {/* Media Spread */}
          <div className="relative flex-1 overflow-hidden rounded-lg bg-[#121214] border border-[#262628] p-4">
            <div className="absolute left-0 top-1 bottom-1 w-0.5 rounded-full bg-[#41B972]" />
            <p className="text-[9px] uppercase tracking-widest text-zinc-600 mb-2">
              Media Spread
            </p>
            <p className="text-2xl font-bold tabular-nums text-[#41B972]">
              {fmtM(summary.media_spread)}
            </p>
          </div>

          <span className="text-zinc-700 text-base self-center mx-2 select-none">+</span>

          {/* Agency Gross Profit */}
          <div className="relative flex-1 overflow-hidden rounded-lg bg-[#121214] border border-[#262628] p-4">
            <div className="absolute left-0 top-1 bottom-1 w-0.5 rounded-full bg-[#41AEB9]" />
            <p className="text-[9px] uppercase tracking-widest text-zinc-600 mb-2">
              Agency Gross Profit
            </p>
            <p className="text-2xl font-bold tabular-nums text-[#41AEB9]">
              {fmtM(agencyGrossProfit)}
            </p>
          </div>

          <span className="text-zinc-700 text-base self-center mx-2 select-none">=</span>

          {/* Combined Gross Profit */}
          <div className="relative flex-1 overflow-hidden rounded-lg bg-[#121214] border border-[#262628] p-4">
            <div className="absolute left-0 top-1 bottom-1 w-0.5 rounded-full bg-zinc-600" />
            <p className="text-[9px] uppercase tracking-widest text-zinc-600 mb-2">
              Combined Gross Profit
            </p>
            <p className="text-2xl font-bold tabular-nums text-white">
              {fmtM(combinedGross)}
            </p>
          </div>
        </div>

        <div className="border-t border-zinc-900 my-4" />

        <div className="flex items-stretch">
          {/* People Cost */}
          <div className="relative flex-1 overflow-hidden rounded-lg bg-[#121214] border border-[#262628] p-4">
            <div className="absolute left-0 top-1 bottom-1 w-0.5 rounded-full bg-[#B44B4B]" />
            <p className="text-[9px] uppercase tracking-widest text-zinc-600 mb-2">
              People Cost
            </p>
            <p className="text-2xl font-bold tabular-nums text-[#B44B4B]">
              ({fmtM(summary.people_cost)})
            </p>
          </div>

          <span className="text-zinc-700 text-base self-center mx-2 select-none">+</span>

          {/* Overhead & Other */}
          <div className="relative flex-1 overflow-hidden rounded-lg bg-[#121214] border border-[#262628] p-4">
            <div className="absolute left-0 top-1 bottom-1 w-0.5 rounded-full bg-[#6B2B2B]" />
            <p className="text-[9px] uppercase tracking-widest text-zinc-700 mb-2">
              Overhead & Other
            </p>
            <p className="text-2xl font-bold tabular-nums text-[#6B2B2B]">
              ({fmtM(summary.overhead_cost)})
            </p>
          </div>

          <span className="text-zinc-700 text-base self-center mx-2 select-none">=</span>

          {/* Net Income */}
          <div className="relative flex-1 overflow-hidden rounded-lg bg-[#121214] border border-[#262628] p-4">
            <div className="absolute left-0 top-1 bottom-1 w-0.5 rounded-full bg-[#C49B37]" />
            <p className="text-[9px] uppercase tracking-widest text-zinc-600 mb-2">
              Net Income
            </p>
            <p
              className={`text-3xl font-bold tabular-nums ${
                summary.estimated_net_income >= 0 ? "text-[#C49B37]" : "text-[#B44B4B]"
              }`}
            >
              {fmtM(summary.estimated_net_income)}
            </p>
            {netMarginPct && (
              <p className="text-[9px] text-zinc-700 mt-1">
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
    <div className="bg-[#121214] rounded-lg border border-[#262628] animate-pulse h-[480px]" />
  );
}
