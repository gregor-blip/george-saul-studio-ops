import { useState, useMemo } from "react";
import type { StatusFilter } from "@/components/projects/types";
import { useProjectBurn } from "@/components/projects/use-projects-data";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { formatPct } from "@/components/dashboard/format";

const FILTERS: { key: StatusFilter; label: string }[] = [
  { key: "active", label: "Active" },
  { key: "all", label: "All" },
  { key: "completed", label: "Completed" },
  { key: "on-hold", label: "On Hold" },
];

export default function Projects() {
  const [filter, setFilter] = useState<StatusFilter>("active");
  const { data: projects, isLoading } = useProjectBurn();

  const filtered = useMemo(() => {
    if (!projects) return [];
    if (filter === "all") return projects;
    return projects.filter((p) => p.status === filter);
  }, [projects, filter]);

  const activeProjects = (projects ?? []).filter((p) => p.status === "active");
  const overScope = activeProjects.filter((p) => p.is_over_scope).length;
  const burns = activeProjects
    .map((p) => p.burn_pct)
    .filter((b): b is number => b !== null);
  const avgBurn =
    burns.length > 0 ? burns.reduce((s, b) => s + b, 0) / burns.length : null;
  const totalRemaining = activeProjects.reduce(
    (s, p) => s + p.hours_remaining,
    0
  );

  return (
    <div>
      {/* Header */}
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white mb-1">
            Projects
          </h1>
          <p className="text-sm text-zinc-500">
            Scope burn and project health across active engagements
          </p>
        </div>
        <div className="flex items-center gap-1">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={
                filter === f.key
                  ? "bg-white/[0.08] text-white border border-white/[0.12] rounded-full px-3 py-1 text-xs font-medium"
                  : "text-zinc-500 hover:text-zinc-300 rounded-full px-3 py-1 text-xs cursor-pointer transition-colors"
              }
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-[#141414] rounded-xl border border-white/[0.08] p-4">
          <p className="text-xs text-zinc-500">Active Projects</p>
          <p className="text-2xl font-bold tabular-nums text-white">
            {isLoading ? "\u2014" : activeProjects.length}
          </p>
        </div>
        <div className="bg-[#141414] rounded-xl border border-white/[0.08] p-4">
          <p className="text-xs text-zinc-500">Over Scope</p>
          <p
            className={`text-2xl font-bold tabular-nums ${
              overScope > 0 ? "text-red-400" : "text-white"
            }`}
          >
            {isLoading ? "\u2014" : overScope}
          </p>
        </div>
        <div className="bg-[#141414] rounded-xl border border-white/[0.08] p-4">
          <p className="text-xs text-zinc-500">Avg Burn %</p>
          <p className="text-2xl font-bold tabular-nums text-white">
            {isLoading ? "\u2014" : formatPct(avgBurn)}
          </p>
        </div>
        <div className="bg-[#141414] rounded-xl border border-white/[0.08] p-4">
          <p className="text-xs text-zinc-500">Total Hours Remaining</p>
          <p className="text-2xl font-bold tabular-nums text-white">
            {isLoading ? "\u2014" : `${Math.round(totalRemaining)}h`}
          </p>
        </div>
      </div>

      {/* Projects List */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-32 bg-white/[0.04] rounded-xl animate-pulse"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-[#141414] rounded-xl border border-white/[0.08] p-16 text-center">
          <p className="text-zinc-700 text-sm">
            No active projects. Projects are created when Daniel sets up
            allocations.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filtered.map((p) => (
            <ProjectCard key={p.project_id} project={p} />
          ))}
        </div>
      )}
    </div>
  );
}
