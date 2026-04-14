import { useState } from "react";
import {
  useStudioSummary,
  useClientProfitability,
  useReceivables,
  computeReceivablesSummary,
} from "@/components/dashboard/use-dashboard-data";
import type { Period } from "@/components/dashboard/use-dashboard-data";
import { formatDate, formatMonthYear, formatCompactCurrency } from "@/components/dashboard/format";
import { KpiCards, KpiCardsSkeleton } from "@/components/dashboard/KpiCards";
import { TopClients, TopClientsSkeleton } from "@/components/dashboard/TopClients";
import { RevenueMix, RevenueMixSkeleton } from "@/components/dashboard/RevenueMix";
import { Alerts, AlertsSkeleton } from "@/components/dashboard/Alerts";
import { ReceivablesSummaryCards } from "@/components/dashboard/ReceivablesSummary";

const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: "2026", label: "2026 YTD" },
  { value: "2025", label: "2025" },
  { value: "all", label: "All Time" },
];

function periodLabel(period: Period): string {
  if (period === "2026") return "2026 YTD \u00B7 Jan\u2013Apr 2026";
  if (period === "2025") return "Full Year 2025";
  return "2025\u20132026 Combined";
}

export default function Dashboard() {
  const [period, setPeriod] = useState<Period>("2026");

  const { data: summary, isLoading: summaryLoading } = useStudioSummary(period);
  const { data: clients, isLoading: clientsLoading } = useClientProfitability(period);
  const { data: receivables, isLoading: receivablesLoading } = useReceivables(period);

  const isLoading = summaryLoading || clientsLoading || receivablesLoading;
  const recSummary = receivables
    ? computeReceivablesSummary(receivables)
    : null;

  return (
    <div>
      {/* Header */}
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white mb-1">
            Studio Overview
          </h1>
          <p className="text-sm text-zinc-500">
            Two-engine model: agency fees + media management
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* Period selector */}
          <div className="flex items-center gap-1">
            {PERIOD_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setPeriod(opt.value)}
                className={
                  period === opt.value
                    ? "bg-white/[0.08] text-white border border-white/[0.12] rounded-full px-3 py-1.5 text-xs font-medium"
                    : "text-zinc-600 hover:text-zinc-400 rounded-full px-3 py-1.5 text-xs cursor-pointer transition-colors"
                }
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Data freshness */}
      {summary && (
        <p className="text-xs text-zinc-700 -mt-6 mb-6">
          {periodLabel(period)}
          {" \u00B7 "}
          Agency: {formatCompactCurrency(summary.agency_revenue)}
          {" \u00B7 "}
          Media: {formatCompactCurrency(summary.media_spread)} spread
          {" \u00B7 "}
          Financials: {formatMonthYear(summary.financials_last_imported)}
          {" \u00B7 "}
          Allocations:{" "}
          {summary.allocations_current_week
            ? formatDate(summary.allocations_current_week)
            : "not yet set"}
        </p>
      )}

      {/* KPI Cards */}
      {isLoading || !summary ? <KpiCardsSkeleton /> : <KpiCards summary={summary} />}

      {/* Top Clients */}
      <div className="mb-8">
        {isLoading || !clients || !summary ? (
          <TopClientsSkeleton />
        ) : (
          <TopClients clients={clients} summary={summary} />
        )}
      </div>

      {/* Revenue Flow */}
      <div className="mb-8">
        {isLoading || !summary ? (
          <RevenueMixSkeleton />
        ) : (
          <RevenueMix summary={summary} />
        )}
      </div>

      {/* Alerts */}
      {isLoading || !summary || !clients || !receivables ? (
        <AlertsSkeleton />
      ) : (
        <Alerts
          summary={summary}
          clients={clients}
          receivables={receivables}
        />
      )}

      {/* Receivables Summary */}
      {recSummary && <ReceivablesSummaryCards summary={recSummary} />}
    </div>
  );
}
