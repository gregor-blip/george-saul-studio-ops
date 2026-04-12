import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ImportRun {
  id: string;
  imported_at: string;
  file_name: string | null;
  source: string;
  row_count: number | null;
  status: string;
  imported_by: string | null;
}

function StatusDot({ status }: { status: string }) {
  const color =
    status === "success"
      ? "bg-emerald-400"
      : status === "failed"
        ? "bg-red-400"
        : "bg-amber-400";
  const label =
    status === "success"
      ? "Success"
      : status === "failed"
        ? "Failed"
        : status === "in_progress"
          ? "Running"
          : "Partial";

  return (
    <span className="flex items-center gap-1.5">
      <span className={`h-1.5 w-1.5 rounded-full ${color}`} />
      <span className="text-xs text-zinc-400">{label}</span>
    </span>
  );
}

function SourceBadge({ source }: { source: string }) {
  if (source === "quickbooks") {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400 uppercase tracking-wider">
        QuickBooks
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-blue-500/10 text-blue-400 uppercase tracking-wider">
      {source}
    </span>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <tr key={i} className="border-t border-white/[0.04]">
          {Array.from({ length: 6 }).map((_, j) => (
            <td key={j} className="px-4 py-3">
              <div className="h-4 bg-white/[0.04] rounded animate-pulse" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export function ImportHistory() {
  const { data: runs, isLoading } = useQuery({
    queryKey: ["import-runs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("import_runs")
        .select("*")
        .order("imported_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      return data as ImportRun[];
    },
  });

  const lastSuccess = runs?.find((r) => r.status === "success");

  return (
    <div className="bg-[#141414] rounded-xl border border-white/[0.08] overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
        <h3 className="text-sm font-semibold text-white">Import History</h3>
        {lastSuccess && (
          <span className="text-xs text-zinc-600">
            Last import: {formatDate(lastSuccess.imported_at)} &middot;{" "}
            {lastSuccess.row_count ?? 0} rows
          </span>
        )}
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/[0.06]">
            <th className="text-left text-[11px] uppercase tracking-wider text-zinc-600 px-4 py-2 font-medium">
              Date
            </th>
            <th className="text-left text-[11px] uppercase tracking-wider text-zinc-600 px-4 py-2 font-medium">
              File
            </th>
            <th className="text-left text-[11px] uppercase tracking-wider text-zinc-600 px-4 py-2 font-medium">
              Type
            </th>
            <th className="text-right text-[11px] uppercase tracking-wider text-zinc-600 px-4 py-2 font-medium">
              Rows
            </th>
            <th className="text-left text-[11px] uppercase tracking-wider text-zinc-600 px-4 py-2 font-medium">
              Status
            </th>
            <th className="text-left text-[11px] uppercase tracking-wider text-zinc-600 px-4 py-2 font-medium">
              By
            </th>
          </tr>
        </thead>
        <tbody>
          {isLoading && <SkeletonRows />}

          {!isLoading && (!runs || runs.length === 0) && (
            <tr>
              <td
                colSpan={6}
                className="text-zinc-700 text-sm text-center py-8"
              >
                No imports yet. Upload a QuickBooks export above to get started.
              </td>
            </tr>
          )}

          {runs?.map((run) => (
            <tr key={run.id} className="border-t border-white/[0.04]">
              <td className="px-4 py-3 text-sm text-zinc-400 tabular-nums whitespace-nowrap">
                {formatDate(run.imported_at)}
              </td>
              <td className="px-4 py-3 text-xs font-mono text-white whitespace-nowrap max-w-[200px] truncate">
                {run.file_name ?? "-"}
              </td>
              <td className="px-4 py-3">
                <SourceBadge source={run.source} />
              </td>
              <td className="px-4 py-3 text-sm tabular-nums text-zinc-400 text-right">
                {run.row_count ?? "-"}
              </td>
              <td className="px-4 py-3">
                <StatusDot status={run.status} />
              </td>
              <td className="px-4 py-3 text-xs text-zinc-600">
                {run.imported_by ?? "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
