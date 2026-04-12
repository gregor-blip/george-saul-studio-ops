import { ChevronUp, ChevronDown } from "lucide-react";
import type { ClientProfitability } from "@/components/dashboard/types";
import type { SortField, SortDirection } from "./types";
import {
  formatCurrency,
  formatPct,
  marginBgColor,
  marginColor,
  marginDotColor,
} from "@/components/dashboard/format";

interface ClientsTableProps {
  clients: ClientProfitability[];
  sortField: SortField;
  sortDir: SortDirection;
  onSort: (field: SortField) => void;
  onSelectClient: (client: ClientProfitability) => void;
}

function rateColor(rate: number | null): string {
  if (rate === null) return "text-zinc-600";
  if (rate >= 300) return "text-emerald-400";
  if (rate >= 200) return "text-amber-400";
  return "text-red-400";
}

function realisationColor(pct: number | null): string {
  if (pct === null) return "text-zinc-600";
  if (pct >= 85) return "text-emerald-400";
  if (pct >= 70) return "text-amber-400";
  return "text-red-400";
}

interface SortHeaderProps {
  label: string;
  field: SortField;
  activeField: SortField;
  activeDir: SortDirection;
  onSort: (field: SortField) => void;
  align?: "left" | "right" | "center";
}

function SortHeader({
  label,
  field,
  activeField,
  activeDir,
  onSort,
  align = "left",
}: SortHeaderProps) {
  const isActive = activeField === field;
  const alignClass =
    align === "right"
      ? "justify-end"
      : align === "center"
        ? "justify-center"
        : "justify-start";

  return (
    <th
      className="px-6 py-3 cursor-pointer select-none"
      onClick={() => onSort(field)}
    >
      <div className={`flex items-center gap-1 ${alignClass}`}>
        <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-600">
          {label}
        </span>
        {isActive &&
          (activeDir === "asc" ? (
            <ChevronUp className="h-3 w-3 text-zinc-500" />
          ) : (
            <ChevronDown className="h-3 w-3 text-zinc-500" />
          ))}
      </div>
    </th>
  );
}

export function ClientsTable({
  clients,
  sortField,
  sortDir,
  onSort,
  onSelectClient,
}: ClientsTableProps) {
  return (
    <div className="bg-[#141414] rounded-xl border border-white/[0.08] overflow-hidden">
      <table className="w-full">
        <thead className="bg-white/[0.03] border-b border-white/[0.06]">
          <tr>
            <SortHeader label="Client" field="client_name" activeField={sortField} activeDir={sortDir} onSort={onSort} />
            <SortHeader label="Revenue" field="total_revenue" activeField={sortField} activeDir={sortDir} onSort={onSort} align="right" />
            <SortHeader label="Cost" field="total_allocated_cost" activeField={sortField} activeDir={sortDir} onSort={onSort} align="right" />
            <SortHeader label="Gross Margin" field="gross_margin_pct" activeField={sortField} activeDir={sortDir} onSort={onSort} align="center" />
            <SortHeader label="Hours" field="total_allocated_hours" activeField={sortField} activeDir={sortDir} onSort={onSort} align="right" />
            <SortHeader label="Eff. Rate" field="effective_hourly_rate" activeField={sortField} activeDir={sortDir} onSort={onSort} align="right" />
            <SortHeader label="Realisation" field="realisation_rate_pct" activeField={sortField} activeDir={sortDir} onSort={onSort} align="right" />
            <th className="px-6 py-3">
              <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-600 flex justify-center">
                Health
              </span>
            </th>
          </tr>
        </thead>
        <tbody>
          {clients.length === 0 && (
            <tr>
              <td colSpan={8} className="text-zinc-700 text-sm py-16 text-center">
                No clients match your search.
              </td>
            </tr>
          )}
          {clients.map((c) => (
            <tr
              key={c.client_id}
              onClick={() => onSelectClient(c)}
              className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors duration-100 cursor-pointer"
            >
              <td className="px-6 py-4 text-sm font-medium text-white">
                {c.client_name}
              </td>
              <td className="px-6 py-4 text-sm tabular-nums text-white text-right font-mono">
                {formatCurrency(c.total_revenue)}
              </td>
              <td className="px-6 py-4 text-sm tabular-nums text-zinc-400 text-right font-mono">
                {formatCurrency(c.total_allocated_cost)}
              </td>
              <td className="px-6 py-4">
                {c.gross_margin_pct !== null ? (
                  <div className="flex items-center gap-3 justify-center">
                    <div className="h-1.5 rounded-full bg-white/[0.06] w-24 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${marginBgColor(c.gross_margin_pct)}`}
                        style={{
                          width: `${Math.min(c.gross_margin_pct, 100)}%`,
                        }}
                      />
                    </div>
                    <span
                      className={`text-sm tabular-nums font-mono ${marginColor(c.gross_margin_pct)}`}
                    >
                      {formatPct(c.gross_margin_pct)}
                    </span>
                  </div>
                ) : (
                  <span className="text-xs text-zinc-600 flex justify-center">
                    No data
                  </span>
                )}
              </td>
              <td className="px-6 py-4 text-sm tabular-nums text-zinc-400 text-right font-mono">
                {Math.round(c.total_allocated_hours)}h
              </td>
              <td
                className={`px-6 py-4 text-sm tabular-nums text-right font-mono ${rateColor(c.effective_hourly_rate)}`}
              >
                {c.effective_hourly_rate !== null
                  ? `$${Math.round(c.effective_hourly_rate)}/hr`
                  : "\u2014"}
              </td>
              <td
                className={`px-6 py-4 text-sm tabular-nums text-right font-mono ${realisationColor(c.realisation_rate_pct)}`}
              >
                {c.realisation_rate_pct !== null
                  ? formatPct(c.realisation_rate_pct)
                  : "\u2014"}
              </td>
              <td className="px-6 py-4 flex justify-center">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${marginDotColor(c.gross_margin_pct)}`}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ClientsTableSkeleton() {
  return (
    <div className="bg-[#141414] rounded-xl border border-white/[0.08] overflow-hidden">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="h-14 bg-white/[0.02] border-b border-white/[0.04] animate-pulse"
        />
      ))}
    </div>
  );
}
