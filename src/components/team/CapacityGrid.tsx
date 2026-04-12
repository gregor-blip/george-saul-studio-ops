import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { Employee, EmployeeWeekMap, CellData } from "./types";
import { COUNTRY_FLAGS } from "./types";
import { getEmptyCell } from "./use-team-data";

interface CapacityGridProps {
  employees: Employee[];
  weeks: string[];
  weekMap: EmployeeWeekMap;
  currentWeek: string;
}

function formatWeekLabel(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function cellColor(totalHours: number, available: number): {
  text: string;
  bar: string;
  pulse: boolean;
} {
  if (totalHours === 0) return { text: "text-zinc-700", bar: "bg-zinc-800", pulse: false };
  const pct = (totalHours / available) * 100;
  if (pct >= 100) return { text: "text-red-400", bar: "bg-red-500/40", pulse: true };
  if (pct >= 80) return { text: "text-amber-400", bar: "bg-amber-500/40", pulse: false };
  return { text: "text-emerald-400", bar: "bg-emerald-500/40", pulse: false };
}

function CellPopover({
  employee,
  weekDate,
  cell,
}: {
  employee: Employee;
  weekDate: string;
  cell: CellData;
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-white">{employee.name}</p>
      <p className="text-xs text-zinc-500">
        Week of {formatWeekLabel(weekDate)}
      </p>
      <div className="space-y-1 text-xs">
        <p className="text-zinc-400">
          Billable: {Math.round(cell.billableHours)}h
        </p>
        <p className="text-zinc-400">
          Internal: {Math.round(cell.internalHours)}h
        </p>
        <p className="text-zinc-300 font-medium">
          Total: {Math.round(cell.totalHours)}h /{" "}
          {employee.available_hours_per_week}h
        </p>
      </div>
      {cell.clients.length > 0 && (
        <div className="border-t border-white/[0.06] pt-2 space-y-1">
          {cell.clients.map((c, i) => (
            <div key={i} className="flex justify-between text-xs">
              <span className={c.isInternal ? "text-zinc-600" : "text-zinc-400"}>
                {c.name}
              </span>
              <span className="tabular-nums text-zinc-500">
                {Math.round(c.hours)}h
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function CapacityGrid({
  employees,
  weeks,
  weekMap,
  currentWeek,
}: CapacityGridProps) {
  const [openPopover, setOpenPopover] = useState<string | null>(null);

  return (
    <div className="bg-[#141414] rounded-xl border border-white/[0.08] overflow-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-[#0A0A0A] border-b border-white/[0.08] sticky top-0 z-10">
            <th className="w-48 px-4 py-3 text-left text-[11px] uppercase tracking-wider text-zinc-600 sticky left-0 bg-[#0A0A0A] z-20 border-r border-white/[0.06]">
              Team Member
            </th>
            {weeks.map((w) => (
              <th
                key={w}
                className={`min-w-[80px] px-2 py-3 text-center text-[11px] ${
                  w === currentWeek ? "text-white" : "text-zinc-600"
                }`}
              >
                {formatWeekLabel(w)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {employees.map((emp) => (
            <tr key={emp.id} className="border-b border-white/[0.04]">
              <td className="w-48 flex-shrink-0 px-4 py-3 sticky left-0 bg-[#141414] z-10 border-r border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white truncate">
                    {emp.name}
                  </span>
                  <span className="text-[10px]">
                    {COUNTRY_FLAGS[emp.country] ?? COUNTRY_FLAGS.OTHER}
                  </span>
                </div>
                <span className="text-[10px] text-zinc-600">
                  {emp.role ?? emp.employment_type}
                </span>
              </td>
              {weeks.map((w) => {
                const cell =
                  weekMap[emp.id]?.[w] ?? getEmptyCell();
                const colors = cellColor(
                  cell.totalHours,
                  emp.available_hours_per_week
                );
                const popId = `${emp.id}-${w}`;

                return (
                  <td key={w} className="min-w-[80px] p-0">
                    <Popover
                      open={openPopover === popId}
                      onOpenChange={(open) =>
                        setOpenPopover(open ? popId : null)
                      }
                    >
                      <PopoverTrigger asChild>
                        <button className="w-full px-2 py-3 flex flex-col items-center justify-center hover:bg-white/[0.04] transition-colors">
                          <span
                            className={`text-sm tabular-nums font-mono font-medium ${colors.text}`}
                          >
                            {cell.totalHours > 0
                              ? `${Math.round(cell.totalHours)}h`
                              : "\u2014"}
                          </span>
                          <span
                            className={`h-0.5 rounded-full mt-1 w-12 ${colors.bar} ${
                              colors.pulse ? "animate-pulse" : ""
                            }`}
                            style={{
                              opacity:
                                cell.totalHours > 0
                                  ? Math.min(
                                      cell.totalHours /
                                        emp.available_hours_per_week,
                                      1
                                    )
                                  : 0.2,
                            }}
                          />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-64 bg-[#1a1a1a] border-white/[0.08] p-4"
                        side="bottom"
                      >
                        <CellPopover
                          employee={emp}
                          weekDate={w}
                          cell={cell}
                        />
                      </PopoverContent>
                    </Popover>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function CapacityGridSkeleton() {
  return (
    <div className="bg-[#141414] rounded-xl border border-white/[0.08] overflow-hidden">
      {Array.from({ length: 8 }).map((_, r) => (
        <div key={r} className="flex border-b border-white/[0.04]">
          <div className="w-48 h-12 bg-white/[0.02] animate-pulse border-r border-white/[0.06]" />
          {Array.from({ length: 5 }).map((_, c) => (
            <div
              key={c}
              className="min-w-[80px] h-12 bg-white/[0.04] animate-pulse"
            />
          ))}
        </div>
      ))}
    </div>
  );
}
