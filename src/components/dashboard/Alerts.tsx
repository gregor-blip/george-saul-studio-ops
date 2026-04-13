import { AlertTriangle } from "lucide-react";
import type { ClientProfitability, Receivable, StudioSummary } from "./types";
import { formatCurrency, formatPct } from "./format";

interface AlertItem {
  severity: "red" | "amber";
  title: string;
  body: string;
}

function buildAlerts(
  summary: StudioSummary,
  clients: ClientProfitability[],
  receivables: Receivable[]
): AlertItem[] {
  const alerts: AlertItem[] = [];
  const external = clients.filter((c) => c.business_line === "agency");

  // Media concentration risk
  if (summary.total_billed > 0) {
    const mediaPct = (summary.media_revenue_billed / summary.total_billed) * 100;
    if (mediaPct > 80) {
      alerts.push({
        severity: "amber",
        title: "Media concentration high",
        body: `Media accounts for ${mediaPct.toFixed(0)}% of total revenue. Agency diversification recommended.`,
      });
    }
  }

  // Critical margin (< 30%)
  for (const c of external) {
    if (c.gross_margin_pct !== null && c.gross_margin_pct < 30) {
      alerts.push({
        severity: "red",
        title: `${c.client_name} margin critical`,
        body: `Gross margin at ${formatPct(c.gross_margin_pct)} \u2014 below the 30% minimum threshold.`,
      });
    }
  }

  // Warning margin (30-50%)
  for (const c of external) {
    if (
      c.gross_margin_pct !== null &&
      c.gross_margin_pct >= 30 &&
      c.gross_margin_pct < 50
    ) {
      alerts.push({
        severity: "amber",
        title: `${c.client_name} margin warning`,
        body: `Gross margin at ${formatPct(c.gross_margin_pct)} \u2014 below the 50% target.`,
      });
    }
  }

  // Overdue invoices
  const overdueItems = receivables.filter((r) => r.is_overdue);
  if (overdueItems.length > 0) {
    const total = overdueItems.reduce((s, r) => s + r.amount, 0);
    alerts.push({
      severity: "red",
      title: `${overdueItems.length} invoices overdue`,
      body: `Total outstanding: ${formatCurrency(total)} over 30 days`,
    });
  }

  // No allocations this week
  if (summary.allocations_current_week) {
    const weekDate = new Date(summary.allocations_current_week);
    const now = new Date();
    const diffDays = (now.getTime() - weekDate.getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays > 7) {
      alerts.push({
        severity: "amber",
        title: "No allocations for current week",
        body: "Daniel hasn't set this week's allocations yet.",
      });
    }
  } else {
    alerts.push({
      severity: "amber",
      title: "No allocations for current week",
      body: "Daniel hasn't set this week's allocations yet.",
    });
  }

  return alerts;
}

interface AlertsProps {
  summary: StudioSummary;
  clients: ClientProfitability[];
  receivables: Receivable[];
}

export function Alerts({ summary, clients, receivables }: AlertsProps) {
  const alerts = buildAlerts(summary, clients, receivables);
  const visible = alerts.slice(0, 5);
  const remaining = alerts.length - 5;

  return (
    <div className="mb-8">
      <h3 className="text-sm font-semibold text-white mb-3">
        Needs Attention
      </h3>

      {alerts.length === 0 ? (
        <p className="text-sm text-zinc-600 py-4">
          No alerts. Studio is healthy.
        </p>
      ) : (
        <>
          {visible.map((alert, i) => (
            <div
              key={i}
              className={`bg-[#141414] rounded-xl px-5 py-4 mb-3 flex items-start gap-3 ${
                alert.severity === "red"
                  ? "border-l-[3px] border-l-red-500"
                  : "border-l-[3px] border-l-amber-500"
              }`}
            >
              <AlertTriangle
                className={`h-4 w-4 shrink-0 mt-0.5 ${
                  alert.severity === "red"
                    ? "text-red-400"
                    : "text-amber-400"
                }`}
              />
              <div>
                <p className="text-sm font-medium text-white">
                  {alert.title}
                </p>
                <p className="text-xs text-zinc-500">{alert.body}</p>
              </div>
            </div>
          ))}
          {remaining > 0 && (
            <p className="text-xs text-zinc-600 mt-1">
              {remaining} more issues
            </p>
          )}
        </>
      )}
    </div>
  );
}

export function AlertsSkeleton() {
  return (
    <div className="mb-8">
      <div className="h-4 w-32 bg-white/[0.04] rounded animate-pulse mb-3" />
      {Array.from({ length: 2 }).map((_, i) => (
        <div
          key={i}
          className="h-16 bg-white/[0.04] rounded-xl animate-pulse mb-3"
        />
      ))}
    </div>
  );
}
