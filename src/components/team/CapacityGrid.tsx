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
  onEmployeeClick?: (employee: Employee) => void;
}

function formatWeekLabel(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// -- Public holidays (US, CA, MX) for 2026-2027 ------------------------------

const PUBLIC_HOLIDAYS: Record<string, Record<string, string>> = {
  US: {
    "2026-01-01": "New Year's Day",
    "2026-01-19": "Martin Luther King Jr. Day",
    "2026-02-16": "Presidents' Day",
    "2026-05-25": "Memorial Day",
    "2026-06-19": "Juneteenth",
    "2026-07-04": "Independence Day",
    "2026-09-07": "Labor Day",
    "2026-10-12": "Columbus Day",
    "2026-11-11": "Veterans Day",
    "2026-11-26": "Thanksgiving",
    "2026-12-25": "Christmas Day",
    "2027-01-01": "New Year's Day",
    "2027-01-18": "Martin Luther King Jr. Day",
    "2027-02-15": "Presidents' Day",
    "2027-05-31": "Memorial Day",
    "2027-06-19": "Juneteenth",
    "2027-07-05": "Independence Day (observed)",
    "2027-09-06": "Labor Day",
    "2027-10-11": "Columbus Day",
    "2027-11-11": "Veterans Day",
    "2027-11-25": "Thanksgiving",
    "2027-12-24": "Christmas Day (observed)",
    "2027-12-25": "Christmas Day",
  },
  CA: {
    "2026-01-01": "New Year's Day",
    "2026-02-16": "Family Day",
    "2026-04-03": "Good Friday",
    "2026-05-18": "Victoria Day",
    "2026-07-01": "Canada Day",
    "2026-09-07": "Labour Day",
    "2026-10-12": "Thanksgiving",
    "2026-11-11": "Remembrance Day",
    "2026-12-25": "Christmas Day",
    "2026-12-26": "Boxing Day",
    "2027-01-01": "New Year's Day",
    "2027-04-02": "Good Friday",
    "2027-05-24": "Victoria Day",
    "2027-07-01": "Canada Day",
    "2027-09-06": "Labour Day",
    "2027-10-11": "Thanksgiving",
    "2027-11-11": "Remembrance Day",
    "2027-12-25": "Christmas Day",
    "2027-12-26": "Boxing Day",
    "2027-12-27": "Boxing Day (observed)",
  },
  MX: {
    "2026-01-01": "Ano Nuevo",
    "2026-02-02": "Dia de la Constitucion",
    "2026-03-16": "Natalicio de Benito Juarez",
    "2026-05-01": "Dia del Trabajo",
    "2026-09-16": "Dia de la Independencia",
    "2026-11-16": "Dia de la Revolucion",
    "2026-12-25": "Navidad",
    "2027-01-01": "Ano Nuevo",
    "2027-02-01": "Dia de la Constitucion",
    "2027-03-15": "Natalicio de Benito Juarez",
    "2027-05-01": "Dia del Trabajo",
    "2027-09-16": "Dia de la Independencia",
    "2027-11-15": "Dia de la Revolucion",
    "2027-12-25": "Navidad",
  },
};

function getHolidayName(dateStr: string, country: string): string | null {
  const holidays = PUBLIC_HOLIDAYS[country] ?? PUBLIC_HOLIDAYS.US;
  return holidays[dateStr] ?? null;
}

interface DayColumn {
  dateStr: string;
  dayAbbr: string;
  dateLabel: string;
}

function getWeekDayColumns(mondayStr: string): DayColumn[] {
  const DAY_ABBRS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  const monday = new Date(mondayStr + "T00:00:00");
  return DAY_ABBRS.map((abbr, i) => {
    const d = new Date(monday);
    d.setDate(d.getDate() + i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const dateLabel = d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    return { dateStr: `${y}-${m}-${day}`, dayAbbr: abbr, dateLabel };
  });
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
  onEmployeeClick,
}: CapacityGridProps) {
  const [openPopover, setOpenPopover] = useState<string | null>(null);

  const isWeeklyView = weeks.length === 1;
  const dayColumns = isWeeklyView ? getWeekDayColumns(weeks[0]) : null;

  return (
    <div className="bg-[#141414] rounded-xl border border-white/[0.08] overflow-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-[#0A0A0A] border-b border-white/[0.08] sticky top-0 z-10">
            <th className="w-48 px-4 py-3 text-left text-[11px] uppercase tracking-wider text-zinc-600 sticky left-0 bg-[#0A0A0A] z-20 border-r border-white/[0.06]">
              Team Member
            </th>
            {isWeeklyView && dayColumns
              ? dayColumns.map((col) => (
                  <th
                    key={col.dateStr}
                    className="min-w-[80px] px-2 py-2 text-center"
                  >
                    <span className="block text-xs font-medium text-zinc-400">
                      {col.dayAbbr}
                    </span>
                    <span className="block text-[10px] text-zinc-600">
                      {col.dateLabel}
                    </span>
                  </th>
                ))
              : weeks.map((w) => (
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
          {employees.map((emp) => {
            const weekCell =
              isWeeklyView
                ? weekMap[emp.id]?.[weeks[0]] ?? getEmptyCell()
                : null;
            const dailyHours =
              weekCell && weekCell.totalHours > 0
                ? Math.round((weekCell.totalHours / 5) * 10) / 10
                : 0;

            return (
              <tr key={emp.id} className="border-b border-white/[0.04]">
                <td className="w-48 flex-shrink-0 px-4 py-3 sticky left-0 bg-[#141414] z-10 border-r border-white/[0.06]">
                  <button
                    className="text-left w-full group"
                    onClick={() => onEmployeeClick?.(emp)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white truncate group-hover:text-blue-400 transition-colors">
                        {emp.name}
                      </span>
                      <span className="text-[10px]">
                        {COUNTRY_FLAGS[emp.country] ?? COUNTRY_FLAGS.OTHER}
                      </span>
                    </div>
                    <span className="text-[10px] text-zinc-600">
                      {emp.role ?? emp.employment_type}
                    </span>
                  </button>
                </td>
                {isWeeklyView && dayColumns
                  ? dayColumns.map((col) => {
                      const holiday = getHolidayName(col.dateStr, emp.country);
                      const popId = `${emp.id}-${col.dateStr}`;
                      const dailyAvailable = emp.available_hours_per_week / 5;
                      const colors = cellColor(dailyHours, dailyAvailable);

                      if (holiday) {
                        return (
                          <td
                            key={col.dateStr}
                            className="min-w-[80px] p-0 bg-white/[0.01]"
                            title={holiday}
                          >
                            <div className="w-full px-2 py-3 flex flex-col items-center justify-center">
                              <span className="text-sm tabular-nums font-mono font-medium text-zinc-700 line-through">
                                {dailyHours > 0
                                  ? `${dailyHours}h`
                                  : "\u2014"}
                              </span>
                              <span className="h-0.5 rounded-full mt-1 w-12 bg-zinc-800 opacity-20" />
                            </div>
                          </td>
                        );
                      }

                      return (
                        <td key={col.dateStr} className="min-w-[80px] p-0">
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
                                  {dailyHours > 0
                                    ? `${dailyHours}h`
                                    : "\u2014"}
                                </span>
                                <span
                                  className={`h-0.5 rounded-full mt-1 w-12 ${colors.bar} ${
                                    colors.pulse ? "animate-pulse" : ""
                                  }`}
                                  style={{
                                    opacity:
                                      dailyHours > 0
                                        ? Math.min(
                                            dailyHours / dailyAvailable,
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
                                weekDate={weeks[0]}
                                cell={weekCell!}
                              />
                            </PopoverContent>
                          </Popover>
                        </td>
                      );
                    })
                  : weeks.map((w) => {
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
            );
          })}
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
