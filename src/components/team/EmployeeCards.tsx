import type { Employee, EmployeeUtilisation } from "./types";
import { COUNTRY_FLAGS } from "./types";

interface EmployeeCardsProps {
  employees: Employee[];
  utilisation: EmployeeUtilisation[];
}

function healthDot(pct: number | null): string {
  if (pct === null) return "bg-zinc-600";
  if (pct >= 70) return "bg-emerald-400";
  if (pct >= 50) return "bg-amber-400";
  return "bg-red-400";
}

export function EmployeeCards({ employees, utilisation }: EmployeeCardsProps) {
  const utilMap = new Map(utilisation.map((u) => [u.employee_id, u]));

  return (
    <div className="grid grid-cols-3 gap-4 mt-8">
      {employees.map((emp) => {
        const u = utilMap.get(emp.id);
        const billable = u?.billable_hours ?? 0;
        const total = u?.total_hours ?? 0;
        const internal = total - billable;
        const billPct = u?.billable_utilisation_pct ?? 0;
        const totalPct = u?.total_utilisation_pct ?? 0;
        const free = emp.available_hours_per_week - total;
        const hasData = u !== undefined && total > 0;

        return (
          <div
            key={emp.id}
            className="bg-[#141414] rounded-xl border border-white/[0.08] p-5"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-white">
                {emp.name}
              </span>
              <span className={`h-2 w-2 rounded-full ${healthDot(u?.billable_utilisation_pct ?? null)}`} />
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">
              {emp.role ?? emp.employment_type}{" "}
              {COUNTRY_FLAGS[emp.country] ?? COUNTRY_FLAGS.OTHER}
            </p>

            {hasData ? (
              <>
                {/* Utilisation bar */}
                <div className="h-1.5 rounded-full bg-white/[0.06] mt-3 overflow-hidden">
                  <div className="h-full flex">
                    <div
                      className="bg-[#0070F3] h-full"
                      style={{ width: `${Math.min(billPct, 100)}%` }}
                    />
                    <div
                      className="bg-zinc-600 h-full"
                      style={{
                        width: `${Math.min(Math.max(totalPct - billPct, 0), 100 - Math.min(billPct, 100))}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Stats */}
                <div className="flex justify-between mt-3 text-xs tabular-nums">
                  <span className="text-zinc-400">
                    Billable: {Math.round(billable)}h
                  </span>
                  <span className="text-zinc-600">
                    Internal: {Math.round(internal)}h
                  </span>
                  <span className={free >= 0 ? "text-emerald-400" : "text-red-400"}>
                    {free >= 0
                      ? `Free: ${Math.round(free)}h`
                      : `Over: ${Math.round(Math.abs(free))}h`}
                  </span>
                </div>

                {emp.hourly_cost_rate !== null && (
                  <p className="text-[10px] text-zinc-700 mt-2">
                    ${emp.hourly_cost_rate.toFixed(0)}/hr internal cost
                  </p>
                )}
              </>
            ) : (
              <p className="text-xs text-zinc-600 mt-3">
                No data this week
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
