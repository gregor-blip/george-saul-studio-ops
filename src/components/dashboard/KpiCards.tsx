import { motion } from "framer-motion";
import type { StudioSummary } from "./types";
import { formatCurrency, formatPct, mediaMarginColor } from "./format";

interface KpiCardsProps {
  summary: StudioSummary;
  activeClientCount?: number;
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

export function KpiCards({ summary, activeClientCount }: KpiCardsProps) {
  return (
    <div className="mb-8">
      {/* Agency Engine */}
      <p className="text-[11px] uppercase tracking-wider text-zinc-600 mb-3">
        Agency — Creative, Retainers, Strategy
      </p>
      <div className="grid grid-cols-3 gap-4 mb-3">
        <KpiCard
          index={0}
          label="Agency Revenue"
          value={formatCurrency(summary.agency_revenue)}
          sublabel="Core fees excl. media"
        />
        <KpiCard
          index={1}
          label="Revenue per Head"
          value={
            summary.agency_revenue_per_employee !== null
              ? formatCurrency(summary.agency_revenue_per_employee)
              : "\u2014"
          }
          sublabel="Agency revenue \u00F7 team"
        />
        <KpiCard
          index={2}
          label="Active Clients"
          value={activeClientCount !== undefined ? String(activeClientCount) : "\u2014"}
          sublabel="Clients billed this period"
        />
      </div>

      {/* Media Engine */}
      <p className="text-[11px] uppercase tracking-wider text-zinc-600 mb-3 mt-6">
        Media — Paid Media Management
      </p>
      <div className="grid grid-cols-3 gap-4 mb-3">
        <KpiCard
          index={3}
          label="Media Billed"
          value={formatCurrency(summary.media_revenue_billed)}
          sublabel="Billed to clients for media"
        />
        <KpiCard
          index={4}
          label="Media Spread"
          value={formatCurrency(summary.media_spread)}
          sublabel="G&S keeps after platform costs"
        />
        <KpiCard
          index={5}
          label="Media Margin"
          value={formatPct(summary.media_margin_pct)}
          sublabel="Spread \u00F7 media billed"
          colorClass={mediaMarginColor(summary.media_margin_pct)}
        />
      </div>

      {/* Combined */}
      <p className="text-[11px] uppercase tracking-wider text-zinc-600 mb-3 mt-6">
        Combined
      </p>
      <div className="grid grid-cols-2 gap-4">
        <KpiCard
          index={6}
          label="Total Billed"
          value={formatCurrency(summary.total_billed)}
          sublabel="Agency + media combined"
        />
        <KpiCard
          index={7}
          label="Active Projects"
          value={String(summary.active_projects)}
          sublabel="Projects currently in scope"
        />
      </div>
    </div>
  );
}

export function KpiCardsSkeleton() {
  return (
    <div className="mb-8">
      <div className="h-3 w-48 bg-white/[0.04] rounded animate-pulse mb-3" />
      <div className="grid grid-cols-3 gap-4 mb-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-32 bg-white/[0.04] rounded-xl animate-pulse" />
        ))}
      </div>
      <div className="h-3 w-40 bg-white/[0.04] rounded animate-pulse mb-3" />
      <div className="grid grid-cols-3 gap-4 mb-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-32 bg-white/[0.04] rounded-xl animate-pulse" />
        ))}
      </div>
      <div className="h-3 w-24 bg-white/[0.04] rounded animate-pulse mb-3" />
      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="h-32 bg-white/[0.04] rounded-xl animate-pulse" />
        ))}
      </div>
    </div>
  );
}
