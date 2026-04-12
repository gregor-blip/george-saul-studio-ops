import type { ReceivablesSummary as ReceivablesSummaryType } from "./types";
import { formatCurrency } from "./format";

interface ReceivablesSummaryProps {
  summary: ReceivablesSummaryType;
}

interface MiniCardProps {
  label: string;
  value: string;
  valueClass?: string;
}

function MiniCard({ label, value, valueClass = "text-white" }: MiniCardProps) {
  return (
    <div className="bg-[#141414] rounded-xl border border-white/[0.08] p-4">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className={`text-xl font-bold tabular-nums ${valueClass}`}>
        {value}
      </p>
    </div>
  );
}

export function ReceivablesSummaryCards({ summary }: ReceivablesSummaryProps) {
  return (
    <div>
      <div className="grid grid-cols-4 gap-4">
        <MiniCard
          label="Total Invoiced"
          value={formatCurrency(summary.totalInvoiced)}
        />
        <MiniCard
          label="Total Paid"
          value={formatCurrency(summary.totalPaid)}
        />
        <MiniCard
          label="Outstanding"
          value={formatCurrency(summary.outstanding)}
        />
        <MiniCard
          label="Overdue (30+ days)"
          value={formatCurrency(summary.overdue)}
          valueClass={summary.overdue > 0 ? "text-red-400" : "text-white"}
        />
      </div>
      <p className="text-xs text-zinc-700 mt-2">
        Payment status pending AR aging import. All invoices currently shown as
        unpaid.
      </p>
    </div>
  );
}
