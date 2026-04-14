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

function Operator({ char }: { char: string }) {
  return (
    <span className="text-zinc-700 text-base self-center mx-2 select-none">
      {char}
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
}

function FlowBox({
  label,
  value,
  accentColor,
  valueColor = "text-white",
  sub,
  subColor = "text-zinc-600",
}: FlowBoxProps) {
  return (
    <div className="relative flex-1 overflow-hidden rounded-lg bg-[#121214] border border-[#262628] p-5">
      <div
        className="absolute left-0 top-0 bottom-0 w-0.5"
        style={{ backgroundColor: accentColor }}
      />
      <p className="text-[10px] font-normal uppercase tracking-widest text-zinc-600 mb-2">
        {label}
      </p>
      <p className={`text-3xl font-bold tabular-nums tracking-tight ${valueColor}`}>
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
      <div className="inline-flex items-center px-3 py-1 rounded-md mb-4 bg-[#0A1628] border border-[#1E3A6E]">
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
      <div className="inline-flex items-center px-3 py-1 rounded-md mb-4 bg-[#1A1400] border border-[#4A3800]">
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
      <div className="bg-[#0D0D11] rounded-lg border border-[#1E1E24] p-5 mt-4">
        {/* Gross profit label pill */}
        <div className="bg-zinc-900 rounded px-2 py-0.5 w-fit mb-3">
          <span className="text-[9px] uppercase tracking-widest text-zinc-500">
            Combined Gross Profit
          </span>
        </div>

        {/* Gross profit row */}
        <div className="flex items-stretch">
          <FlowBox
            label="Media Spread"
            value={fmtM(summary.media_spread)}
            accentColor="#41B972"
            valueColor="text-[#41B972]"
          />
          <Operator char="+" />
          <FlowBox
            label="Agency Gross Profit"
            value={fmtM(agencyGrossProfit)}
            accentColor="#41AEB9"
            valueColor="text-[#41AEB9]"
          />
          <Operator char="=" />
          <FlowBox
            label="Gross Profit"
            value={fmtM(combinedGross)}
            accentColor="#71717a"
          />
        </div>

        <div className="border-t border-zinc-900 my-4" />

        {/* Bottom row label */}
        <p className="text-[9px] uppercase tracking-widest text-zinc-500 mb-3">
          Gross Profit &minus; Operating Costs = Net Income
        </p>

        {/* Bottom row */}
        <div className="flex items-stretch">
          <FlowBox
            label="People Cost"
            value={`(${fmtM(summary.people_cost)})`}
            accentColor="#B44B4B"
            valueColor="text-[#B44B4B]"
          />
          <Operator char="+" />
          <FlowBox
            label="Overhead & Other"
            value={`(${fmtM(summary.overhead_cost)})`}
            accentColor="#6B2B2B"
            valueColor="text-[#6B2B2B]"
          />
          <Operator char="=" />
          <FlowBox
            label="Net Income"
            value={fmtM(summary.estimated_net_income)}
            accentColor="#C49B37"
            valueColor={
              summary.estimated_net_income >= 0
                ? "text-[#C49B37]"
                : "text-[#B44B4B]"
            }
            sub={netMarginPct ? `${netMarginPct}% net margin` : undefined}
            subColor="text-zinc-600"
          />
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
