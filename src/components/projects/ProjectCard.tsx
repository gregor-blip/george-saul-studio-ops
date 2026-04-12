import { useState } from "react";
import type { ProjectBurn } from "./types";
import { formatCurrency } from "@/components/dashboard/format";
import { useScopeAmendments, useProjectAllocations } from "./use-projects-data";
import { ProjectBurnChart } from "./ProjectBurnChart";

interface ProjectCardProps {
  project: ProjectBurn;
}

function StatusBadge({ project }: { project: ProjectBurn }) {
  if (project.is_over_scope) {
    return (
      <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-red-500/10 text-red-400">
        Over Scope
      </span>
    );
  }

  switch (project.status) {
    case "active":
      return (
        <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400">
          Active
        </span>
      );
    case "on-hold":
      return (
        <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400">
          On Hold
        </span>
      );
    case "completed":
      return (
        <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-zinc-500/10 text-zinc-400">
          Completed
        </span>
      );
  }
}

function burnBarColor(pct: number | null): { fill: string; pulse: boolean } {
  if (pct === null) return { fill: "bg-zinc-600", pulse: false };
  if (pct >= 90) return { fill: "bg-red-500", pulse: true };
  if (pct >= 70) return { fill: "bg-amber-500", pulse: false };
  return { fill: "bg-emerald-500", pulse: false };
}

function burnTextColor(pct: number | null): string {
  if (pct === null) return "text-zinc-600";
  if (pct >= 90) return "text-red-400";
  if (pct >= 70) return "text-amber-400";
  return "text-emerald-400";
}

function formatDateRange(start: string | null, end: string | null): string | null {
  if (!start || !end) return null;
  const fmt = (s: string) => {
    const d = new Date(s + "T00:00:00");
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };
  return `${fmt(start)} \u2192 ${fmt(end)}`;
}

export function ProjectCard({ project: p }: ProjectCardProps) {
  const [expanded, setExpanded] = useState(false);
  const { data: amendments } = useScopeAmendments(expanded ? p.project_id : null);
  const { data: allocations } = useProjectAllocations(expanded ? p.project_id : null);

  const borderClass = p.is_over_scope
    ? "border-red-500/30 bg-red-500/[0.02]"
    : "border-white/[0.08]";

  const bar = burnBarColor(p.burn_pct);
  const dateRange = formatDateRange(p.start_date, p.end_date);
  const amendmentHours =
    p.effective_scope_hours !== null && p.original_scope_hours !== null
      ? p.effective_scope_hours - p.original_scope_hours
      : 0;

  return (
    <div
      className={`bg-[#141414] rounded-xl border ${borderClass} p-5 cursor-pointer hover:border-white/[0.16] transition-colors duration-200`}
      onClick={() => setExpanded((e) => !e)}
    >
      {/* Top row */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-base font-semibold text-white">{p.project_name}</p>
          <p className="text-sm text-zinc-500 mt-0.5">{p.client_name}</p>
        </div>
        <StatusBadge project={p} />
      </div>

      {/* Burn bar */}
      {p.effective_scope_hours !== null ? (
        <div className="mb-3">
          <div className="flex justify-between text-xs text-zinc-600 mb-1.5">
            <span>Scope burn</span>
            <span className={burnTextColor(p.burn_pct)}>
              {p.burn_pct !== null ? p.burn_pct.toFixed(1) + "%" : "\u2014"}
            </span>
          </div>
          <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${bar.fill} ${bar.pulse ? "animate-pulse" : ""}`}
              style={{ width: `${Math.min(p.burn_pct ?? 0, 100)}%` }}
            />
          </div>
        </div>
      ) : (
        <p className="text-xs text-zinc-600 italic mb-3">No scope defined</p>
      )}

      {/* Stats row */}
      <div className="flex items-center gap-6 text-xs tabular-nums">
        <span className="text-zinc-400">
          {Math.round(p.consumed_hours)}h consumed
        </span>
        <span className={p.is_over_scope ? "text-red-400" : "text-emerald-400"}>
          {Math.round(p.hours_remaining)}h remaining
        </span>
        <span className="text-zinc-600">
          {formatCurrency(p.consumed_cost)} cost to date
        </span>
        {p.amendment_count > 0 && (
          <span className="text-amber-400">
            {p.amendment_count} scope amendment{p.amendment_count > 1 ? "s" : ""}
          </span>
        )}
        {dateRange && <span className="text-zinc-600">{dateRange}</span>}
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div
          className="border-t border-white/[0.06] mt-4 pt-4"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Scope breakdown */}
          <div className="flex items-center gap-6 mb-4">
            <div>
              <p className="text-xs text-zinc-600">Original scope</p>
              <p className="text-sm text-zinc-400">
                {p.original_scope_hours !== null
                  ? `${Math.round(p.original_scope_hours)}h`
                  : "\u2014"}
              </p>
            </div>
            <div>
              <p className="text-xs text-zinc-600">Amendments</p>
              <p className="text-sm text-amber-400">
                {amendmentHours >= 0 ? "+" : ""}
                {Math.round(amendmentHours)}h
              </p>
            </div>
            <div>
              <p className="text-xs text-zinc-600">Effective scope</p>
              <p className="text-sm font-medium text-white">
                {p.effective_scope_hours !== null
                  ? `${Math.round(p.effective_scope_hours)}h`
                  : "\u2014"}
              </p>
            </div>
          </div>

          {/* Amendments list */}
          {amendments && amendments.length > 0 ? (
            <div className="mb-4 space-y-2">
              <p className="text-xs uppercase tracking-wider text-zinc-600 mb-2">
                Scope Amendments
              </p>
              {amendments.map((a) => (
                <div key={a.id} className="flex items-start gap-3 text-xs">
                  <span className="text-zinc-600 w-16 shrink-0">
                    {a.amendment_date
                      ? new Date(a.amendment_date + "T00:00:00").toLocaleDateString(
                          "en-US",
                          { month: "short", day: "numeric" }
                        )
                      : "\u2014"}
                  </span>
                  <span
                    className={`font-mono w-10 shrink-0 ${
                      a.hours_change >= 0 ? "text-emerald-400" : "text-red-400"
                    }`}
                  >
                    {a.hours_change >= 0 ? "+" : ""}
                    {Math.round(a.hours_change)}h
                  </span>
                  <span className="text-zinc-400 flex-1">
                    {a.reason ?? "No reason given"}
                  </span>
                  {a.approved_by && (
                    <span className="text-zinc-600">{a.approved_by}</span>
                  )}
                </div>
              ))}
            </div>
          ) : amendments ? (
            <p className="text-xs text-zinc-700 italic mb-4">
              No scope amendments recorded.
            </p>
          ) : null}

          {/* Burn chart */}
          <p className="text-xs uppercase tracking-wider text-zinc-600 mb-2">
            Burn Over Time
          </p>
          <ProjectBurnChart
            allocations={allocations ?? []}
            effectiveScopeHours={p.effective_scope_hours}
          />
        </div>
      )}
    </div>
  );
}
