import { useState, useMemo } from "react";
import type { TimeHorizon } from "@/components/team/types";
import {
  useEmployees,
  useClients,
  useWeeklyAllocations,
  useEmployeeUtilisation,
  getWeekColumns,
  buildWeekMap,
} from "@/components/team/use-team-data";
import { CapacityGrid, CapacityGridSkeleton } from "@/components/team/CapacityGrid";
import { EmployeeCards } from "@/components/team/EmployeeCards";
import { formatPct } from "@/components/dashboard/format";

const HORIZONS: { key: TimeHorizon; label: string }[] = [
  { key: "week", label: "This Week" },
  { key: "month", label: "This Month" },
  { key: "3months", label: "3 Months" },
  { key: "6months", label: "6 Months" },
];

function getCurrentMonday(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(monday.getDate() + diff);
  const y = monday.getFullYear();
  const m = String(monday.getMonth() + 1).padStart(2, "0");
  const d = String(monday.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default function Team() {
  const [horizon, setHorizon] = useState<TimeHorizon>("month");

  const weeks = useMemo(() => getWeekColumns(horizon), [horizon]);
  const currentWeek = getCurrentMonday();

  const { data: employees, isLoading: empLoading } = useEmployees();
  const { data: clients, isLoading: clientsLoading } = useClients();
  const { data: allocations, isLoading: allocLoading } = useWeeklyAllocations(weeks);
  const { data: utilisation } = useEmployeeUtilisation();

  const clientMap = useMemo(() => {
    const m = new Map<string, { id: string; name: string; is_internal: boolean }>();
    for (const c of clients ?? []) m.set(c.id, c);
    return m;
  }, [clients]);

  const weekMap = useMemo(
    () => buildWeekMap(allocations ?? [], clientMap),
    [allocations, clientMap]
  );

  const isLoading = empLoading || clientsLoading || allocLoading;

  // KPI calculations from utilisation view (current week only)
  const currentUtil = (utilisation ?? []).filter(
    (u) => u.employee_name !== "Gregor Banic"
  );
  const teamCount = employees?.length ?? 0;
  const avgBillable =
    currentUtil.length > 0
      ? currentUtil.reduce((s, u) => s + (u.billable_utilisation_pct ?? 0), 0) /
        currentUtil.length
      : null;
  const avgTotal =
    currentUtil.length > 0
      ? currentUtil.reduce((s, u) => s + (u.total_utilisation_pct ?? 0), 0) /
        currentUtil.length
      : null;
  const overallocated = currentUtil.filter(
    (u) => (u.total_utilisation_pct ?? 0) > 100
  ).length;

  return (
    <div>
      {/* Header */}
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white mb-1">
            Team
          </h1>
          <p className="text-sm text-zinc-500">
            Capacity, allocation, and utilisation by team member
          </p>
        </div>
        <div className="flex items-center gap-1">
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
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-[#141414] rounded-xl border border-white/[0.08] p-4">
          <p className="text-xs text-zinc-500">Team Members</p>
          <p className="text-2xl font-bold tabular-nums text-white">
            {isLoading ? "\u2014" : teamCount}
          </p>
        </div>
        <div className="bg-[#141414] rounded-xl border border-white/[0.08] p-4">
          <p className="text-xs text-zinc-500">Avg Billable Utilisation</p>
          <p className="text-2xl font-bold tabular-nums text-white">
            {avgBillable !== null ? formatPct(avgBillable) : "\u2014"}
          </p>
        </div>
        <div className="bg-[#141414] rounded-xl border border-white/[0.08] p-4">
          <p className="text-xs text-zinc-500">Avg Total Utilisation</p>
          <p className="text-2xl font-bold tabular-nums text-white">
            {avgTotal !== null ? formatPct(avgTotal) : "\u2014"}
          </p>
        </div>
        <div className="bg-[#141414] rounded-xl border border-white/[0.08] p-4">
          <p className="text-xs text-zinc-500">Overallocated</p>
          <p
            className={`text-2xl font-bold tabular-nums ${
              overallocated > 0 ? "text-red-400" : "text-white"
            }`}
          >
            {currentUtil.length > 0 ? overallocated : "\u2014"}
          </p>
        </div>
      </div>

      {/* Capacity Grid */}
      {isLoading || !employees ? (
        <CapacityGridSkeleton />
      ) : (
        <CapacityGrid
          employees={employees}
          weeks={weeks}
          weekMap={weekMap}
          currentWeek={currentWeek}
        />
      )}

      {/* Employee Cards */}
      {employees && utilisation && (
        <EmployeeCards employees={employees} utilisation={currentUtil} />
      )}
    </div>
  );
}
