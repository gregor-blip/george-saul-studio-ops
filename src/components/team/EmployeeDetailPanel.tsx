import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { TimeHorizon, Employee, ClientRef } from "./types";
import { COUNTRY_FLAGS } from "./types";
import { getWeekColumns } from "./use-team-data";
import { formatPct } from "@/components/dashboard/format";

interface EmployeeDetailPanelProps {
  employee: Employee;
  onClose: () => void;
}

const HORIZONS: { key: TimeHorizon; label: string }[] = [
  { key: "week", label: "This Week" },
  { key: "month", label: "This Month" },
  { key: "3months", label: "3 Months" },
  { key: "6months", label: "6 Months" },
];

const BAR_COLORS = ["#3B82F6", "#34D399", "#A78BFA", "#FBBF24", "#F87171"];
const INTERNAL_COLOR = "rgb(63 63 70)"; // zinc-700

interface Allocation {
  employee_id: string;
  week_start_date: string;
  client_id: string;
  allocated_hours: number;
}

function formatWeekLabel(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function EmployeeDetailPanel({
  employee,
  onClose,
}: EmployeeDetailPanelProps) {
  const [horizon, setHorizon] = useState<TimeHorizon>("month");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  const weeks = useMemo(() => getWeekColumns(horizon), [horizon]);
  const startDate = weeks[0];
  const endDate = weeks[weeks.length - 1];

  const { data: allocations } = useQuery({
    queryKey: ["emp-panel-alloc", employee.id, startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("weekly_allocations")
        .select("employee_id, week_start_date, client_id, allocated_hours")
        .eq("employee_id", employee.id)
        .gte("week_start_date", startDate)
        .lte("week_start_date", endDate);
      if (error) throw error;
      return (data ?? []) as Allocation[];
    },
  });

  const { data: clients } = useQuery({
    queryKey: ["emp-panel-clients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("id, name, is_internal");
      if (error) throw error;
      return (data ?? []) as ClientRef[];
    },
  });

  const clientMap = useMemo(() => {
    const m = new Map<string, ClientRef>();
    for (const c of clients ?? []) m.set(c.id, c);
    return m;
  }, [clients]);

  // Build per-client, per-week grid data
  const { clientRows, weekTotals, periodTotals, billableTotal, internalTotal } =
    useMemo(() => {
      const byClient: Record<
        string,
        { clientId: string; name: string; isInternal: boolean; byWeek: Record<string, number> }
      > = {};

      for (const a of allocations ?? []) {
        if (!byClient[a.client_id]) {
          const c = clientMap.get(a.client_id);
          byClient[a.client_id] = {
            clientId: a.client_id,
            name: c?.name ?? "Unknown",
            isInternal: c?.is_internal ?? false,
            byWeek: {},
          };
        }
        const row = byClient[a.client_id];
        row.byWeek[a.week_start_date] =
          (row.byWeek[a.week_start_date] ?? 0) + a.allocated_hours;
      }

      const rows = Object.values(byClient).sort((a, b) => {
        if (a.isInternal !== b.isInternal) return a.isInternal ? 1 : -1;
        return a.name.localeCompare(b.name);
      });

      const wTotals: Record<string, number> = {};
      for (const w of weeks) wTotals[w] = 0;
      for (const row of rows) {
        for (const w of weeks) {
          wTotals[w] += row.byWeek[w] ?? 0;
        }
      }

      const pTotals: Record<string, number> = {};
      let bTotal = 0;
      let iTotal = 0;
      for (const row of rows) {
        let sum = 0;
        for (const w of weeks) sum += row.byWeek[w] ?? 0;
        pTotals[row.clientId] = sum;
        if (row.isInternal) iTotal += sum;
        else bTotal += sum;
      }

      return {
        clientRows: rows,
        weekTotals: wTotals,
        periodTotals: pTotals,
        billableTotal: bTotal,
        internalTotal: iTotal,
      };
    }, [allocations, clientMap, weeks]);

  const totalHours = billableTotal + internalTotal;
  const totalAvailable = employee.available_hours_per_week * weeks.length;
  const freeHours = Math.max(totalAvailable - totalHours, 0);
  const utilPct = totalAvailable > 0 ? (totalHours / totalAvailable) * 100 : 0;

  const hasAllocations = clientRows.length > 0;

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />

      <div
        className={`fixed right-0 top-0 h-full w-[480px] z-50 bg-[#141414] border-l border-white/[0.08] overflow-y-auto transform transition-transform duration-300 ease-out ${
          visible ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/[0.06] flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">
              {employee.name}
            </h2>
            <p className="text-sm text-zinc-500 mt-0.5">
              {employee.role ?? employee.employment_type}{" "}
              {COUNTRY_FLAGS[employee.country] ?? COUNTRY_FLAGS.OTHER}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Time Horizon Selector */}
        <div className="px-6 py-3 border-b border-white/[0.06] flex items-center gap-1">
          {HORIZONS.map((h) => (
            <button
              key={h.key}
              onClick={() => setHorizon(h.key)}
              className={
                horizon === h.key
                  ? "bg-white/[0.08] text-white border border-white/[0.12] rounded-full px-3 py-1 text-xs font-medium"
                  : "text-zinc-500 hover:text-zinc-300 rounded-full px-3 py-1 text-xs cursor-pointer transition-colors"
              }
            >
              {h.label}
            </button>
          ))}
        </div>

        {/* Section 1 — Utilisation Summary */}
        <div className="px-6 py-4 border-b border-white/[0.06]">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#0A0A0A] rounded-lg p-3">
              <p className="text-xs text-zinc-500">Billable Hours</p>
              <p className="text-xl font-bold tabular-nums text-white">
                {Math.round(billableTotal)}h
              </p>
            </div>
            <div className="bg-[#0A0A0A] rounded-lg p-3">
              <p className="text-xs text-zinc-500">Internal Hours</p>
              <p className="text-xl font-bold tabular-nums text-white">
                {Math.round(internalTotal)}h
              </p>
            </div>
            <div className="bg-[#0A0A0A] rounded-lg p-3">
              <p className="text-xs text-zinc-500">Total Utilisation</p>
              <p className="text-xl font-bold tabular-nums text-white">
                {formatPct(utilPct)}
              </p>
            </div>
            <div className="bg-[#0A0A0A] rounded-lg p-3">
              <p className="text-xs text-zinc-500">Free Hours Remaining</p>
              <p className="text-xl font-bold tabular-nums text-white">
                {Math.round(freeHours)}h
              </p>
            </div>
          </div>
        </div>

        {!hasAllocations ? (
          <div className="px-6 py-16 text-center">
            <p className="text-sm text-zinc-600 italic">
              No allocations recorded for this period.
            </p>
          </div>
        ) : (
          <>
            {/* Section 2 — Allocation by Client grid */}
            <div className="px-6 py-4 border-b border-white/[0.06]">
              <p className="text-xs uppercase tracking-wider text-zinc-600 mb-3">
                Allocation by Client
              </p>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr>
                      <th className="text-left text-zinc-600 font-normal pb-2 pr-3 min-w-[120px]">
                        Client
                      </th>
                      {weeks.map((w) => (
                        <th
                          key={w}
                          className="text-center text-[10px] text-zinc-600 font-normal pb-2 px-1 min-w-[48px]"
                        >
                          {formatWeekLabel(w)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {clientRows.map((row) => (
                      <tr key={row.clientId}>
                        <td
                          className={`pr-3 py-1 truncate max-w-[120px] ${
                            row.isInternal
                              ? "text-zinc-600 italic"
                              : "text-zinc-400"
                          }`}
                          title={row.name}
                        >
                          {row.name.length > 20
                            ? row.name.slice(0, 20) + "..."
                            : row.name}
                        </td>
                        {weeks.map((w) => {
                          const hrs = row.byWeek[w] ?? 0;
                          return (
                            <td
                              key={w}
                              className={`text-center tabular-nums px-1 py-1 ${
                                row.isInternal
                                  ? "text-zinc-600"
                                  : "text-white"
                              }`}
                            >
                              {hrs > 0 ? hrs : "\u2014"}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                    {/* Total row */}
                    <tr className="border-t border-white/[0.06]">
                      <td className="pr-3 py-1 font-medium text-zinc-400">
                        Total
                      </td>
                      {weeks.map((w) => {
                        const t = weekTotals[w] ?? 0;
                        const over = t > employee.available_hours_per_week;
                        return (
                          <td
                            key={w}
                            className={`text-center tabular-nums px-1 py-1 font-medium ${
                              over ? "text-red-400" : "text-emerald-400"
                            }`}
                          >
                            {t > 0 ? t : "\u2014"}
                          </td>
                        );
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section 3 — Time Distribution bar */}
            <div className="px-6 py-4">
              <p className="text-xs uppercase tracking-wider text-zinc-600 mb-3">
                Time Distribution
              </p>
              {totalHours > 0 && (
                <>
                  <div className="h-3 rounded-full overflow-hidden flex">
                    {clientRows.map((row, i) => {
                      const hrs = periodTotals[row.clientId] ?? 0;
                      if (hrs === 0) return null;
                      const pct = (hrs / totalHours) * 100;
                      const color = row.isInternal
                        ? INTERNAL_COLOR
                        : BAR_COLORS[i % BAR_COLORS.length];
                      return (
                        <div
                          key={row.clientId}
                          style={{
                            width: `${pct}%`,
                            backgroundColor: color,
                          }}
                        />
                      );
                    })}
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                    {clientRows.map((row, i) => {
                      const hrs = periodTotals[row.clientId] ?? 0;
                      if (hrs === 0) return null;
                      const color = row.isInternal
                        ? INTERNAL_COLOR
                        : BAR_COLORS[i % BAR_COLORS.length];
                      return (
                        <div
                          key={row.clientId}
                          className="flex items-center gap-1.5"
                        >
                          <span
                            className="h-2 w-2 rounded-full shrink-0"
                            style={{ backgroundColor: color }}
                          />
                          <span className="text-xs text-zinc-500">
                            {row.name.length > 20
                              ? row.name.slice(0, 20) + "..."
                              : row.name}
                          </span>
                          <span className="text-xs tabular-nums text-zinc-600">
                            {Math.round(hrs)}h
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
