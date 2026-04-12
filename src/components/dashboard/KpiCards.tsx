import { motion } from "framer-motion";
import type { StudioSummary } from "./types";
import { formatCurrency, formatPct, marginColor, utilisationColor } from "./format";

interface KpiCardsProps {
  summary: StudioSummary;
}

interface CardProps {
  label: string;
  value: string;
  sublabel: string;
  colorClass?: string;
  index: number;
}

function KpiCard({ label, value, sublabel, colorClass = "text-white", index }: CardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut", delay: index * 0.1 }}
      className="bg-[#141414] rounded-xl border border-white/[0.08] p-6 hover:shadow-md transition-shadow duration-200"
    >
      <p className="text-xs font-medium text-zinc-500 mb-1">{label}</p>
      <p className={`text-3xl font-bold tabular-nums tracking-tight ${colorClass}`}>
        {value}
      </p>
      <p className="text-xs text-zinc-600 mt-1">{sublabel}</p>
    </motion.div>
  );
}

export function KpiCards({ summary }: KpiCardsProps) {
  return (
    <div className="grid grid-cols-4 gap-4 mb-8">
      <KpiCard
        index={0}
        label="Studio Margin"
        value={formatPct(summary.blended_margin_pct)}
        sublabel="Gross margin on agency revenue"
        colorClass={marginColor(summary.blended_margin_pct)}
      />
      <KpiCard
        index={1}
        label="Agency Revenue"
        value={formatCurrency(summary.agency_revenue)}
        sublabel="Core fees excl. media pass-through"
      />
      <KpiCard
        index={2}
        label="Avg Utilisation"
        value={formatPct(summary.avg_billable_utilisation_pct)}
        sublabel="Billable hours vs available hours"
        colorClass={utilisationColor(summary.avg_billable_utilisation_pct)}
      />
      <KpiCard
        index={3}
        label="Active Projects"
        value={String(summary.active_projects)}
        sublabel="Projects currently in scope"
      />
    </div>
  );
}

export function KpiCardsSkeleton() {
  return (
    <div className="grid grid-cols-4 gap-4 mb-8">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="h-32 bg-white/[0.04] rounded-xl animate-pulse"
        />
      ))}
    </div>
  );
}
