import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { type ImportState, type ParsedFile } from "@/components/data-management/types";
import { parseFile } from "@/components/data-management/parse-utils";
import { runImport } from "@/components/data-management/import-engine";
import { UploadZone } from "@/components/data-management/UploadZone";
import { FilePreview } from "@/components/data-management/FilePreview";
import { ImportProgress } from "@/components/data-management/ImportProgress";
import { ImportComplete } from "@/components/data-management/ImportComplete";
import { ImportHistory } from "@/components/data-management/ImportHistory";

export default function DataManagement() {
  const [state, setState] = useState<ImportState>({ phase: "upload" });
  const queryClient = useQueryClient();

  const handleFileSelected = useCallback(async (file: File) => {
    try {
      const parsed = await parseFile(file);
      setState({ phase: "preview", file: parsed });
    } catch {
      toast.error("Failed to parse file. Please check the format and try again.");
    }
  }, []);

  const handleUpdateMapping = useCallback(
    (field: string, column: string | null) => {
      if (state.phase !== "preview") return;
      const updatedMappings = state.file.mappings.map((m) =>
        m.dashboardField === field
          ? { ...m, mappedColumn: column, autoDetected: false }
          : m
      );
      setState({
        phase: "preview",
        file: { ...state.file, mappings: updatedMappings },
      });
    },
    [state]
  );

  const handleImport = useCallback(async () => {
    if (state.phase !== "preview") return;
    const { file } = state;

    setState({ phase: "importing", file, totalRows: file.rows.length });

    try {
      const result = await runImport(file.rows, file.mappings, file.fileName, file.headers);
      setState({ phase: "complete", result });
      toast.success("QuickBooks data imported successfully");
      queryClient.invalidateQueries({ queryKey: ["import-runs"] });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Import failed";
      toast.error(msg);
      setState({ phase: "preview", file });
    }
  }, [state, queryClient]);

  const handleReset = useCallback(() => {
    setState({ phase: "upload" });
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-white mb-1">
        Data Management
      </h1>
      <p className="text-sm text-zinc-500 mb-8">
        Import QuickBooks exports and manage data freshness
      </p>

      {/* QuickBooks Import Card */}
      <div className="bg-[#141414] rounded-xl border border-white/[0.08] p-6 mb-6">
        <h2 className="text-base font-semibold text-white">
          QuickBooks Import
        </h2>
        <p className="text-sm text-zinc-500 mt-0.5 mb-6">
          Upload a P&L Detail export (CSV or XLSX). Revenue rows go to
          qb_revenue, expense rows go to qb_expenses.
        </p>

        {state.phase === "upload" && (
          <UploadZone onFileSelected={handleFileSelected} />
        )}

        {state.phase === "preview" && (
          <FilePreview
            file={state.file}
            onChangeFile={handleReset}
            onUpdateMapping={handleUpdateMapping}
            onImport={handleImport}
            onCancel={handleReset}
          />
        )}

        {state.phase === "importing" && (
          <ImportProgress totalRows={state.totalRows} />
        )}

        {state.phase === "complete" && (
          <ImportComplete result={state.result} onReset={handleReset} />
        )}
      </div>

      {/* Import History */}
      <ImportHistory />
    </div>
  );
}
