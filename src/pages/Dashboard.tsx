import {
  useStudioSummary,
  useClientProfitability,
  useReceivables,
  computeReceivablesSummary,
} from "@/components/dashboard/use-dashboard-data";
import { formatDate, formatMonthYear, formatCompactCurrency } from "@/components/dashboard/format";
import { KpiCards, KpiCardsSkeleton } from "@/components/dashboard/KpiCards";
import { TopClients, TopClientsSkeleton } from "@/components/dashboard/TopClients";
import { RevenueMix, RevenueMixSkeleton } from "@/components/dashboard/RevenueMix";
import { Alerts, AlertsSkeleton } from "@/components/dashboard/Alerts";
import { ReceivablesSummaryCards } from "@/components/dashboard/ReceivablesSummary";

export default function Dashboard() {
  const { data: summary, isLoading: summaryLoading } = useStudioSummary();
  const { data: clients, isLoading: clientsLoading } = useClientProfitability();
  const { data: receivables, isLoading: receivablesLoading } = useReceivables();

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
        {summary && (
          <p className="text-xs text-zinc-700">
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
      </div>

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
