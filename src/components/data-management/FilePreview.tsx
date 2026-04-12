import { FileSpreadsheet, Check, AlertTriangle } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { type ParsedFile, type ColumnMapping, REQUIRED_FIELDS } from "./types";
import { formatFileSize } from "./parse-utils";

interface FilePreviewProps {
  file: ParsedFile;
  onChangeFile: () => void;
  onUpdateMapping: (field: string, column: string | null) => void;
  onImport: () => void;
  onCancel: () => void;
}

function ImportTypeBadge({ file }: { file: ParsedFile }) {
  switch (file.importType) {
    case "revenue":
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400">
          Revenue import detected
        </span>
      );
    case "expense":
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400">
          Expense import detected
        </span>
      );
    case "mixed":
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-500/10 text-purple-400">
          Mixed import — revenue and expenses
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-zinc-500/10 text-zinc-400">
          Unknown import type
        </span>
      );
  }
}

function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max) + "..." : s;
}

function hasAllRequiredMappings(mappings: ColumnMapping[]): boolean {
  return REQUIRED_FIELDS.every((f) => {
    const m = mappings.find((mapping) => mapping.dashboardField === f);
    return m?.mappedColumn !== null;
  });
}

export function FilePreview({
  file,
  onChangeFile,
  onUpdateMapping,
  onImport,
  onCancel,
}: FilePreviewProps) {
  const previewRows = file.rows.slice(0, 5);
  const previewHeaders = file.headers.slice(0, 8);
  const canImport = hasAllRequiredMappings(file.mappings);
  const unmappedRequired = file.mappings.filter(
    (m) => m.required && !m.mappedColumn
  );

  return (
    <div>
      {/* File info */}
      <div className="flex items-center gap-3 mb-6">
        <FileSpreadsheet className="h-[18px] w-[18px] text-zinc-500 shrink-0" />
        <span className="text-sm font-medium text-white">{file.fileName}</span>
        <span className="text-xs text-zinc-600">
          {formatFileSize(file.fileSize)}
        </span>
        <button
          onClick={onChangeFile}
          className="text-xs text-[#0070F3] hover:underline cursor-pointer ml-auto"
        >
          Change file
        </button>
      </div>

      {/* Column mapping table */}
      <div className="bg-[#0A0A0A] rounded-lg border border-white/[0.06] overflow-hidden mb-6">
        <div className="grid grid-cols-[1fr_1fr_80px] text-[11px] uppercase tracking-wider text-zinc-600 px-4 py-2 bg-white/[0.02]">
          <span>Dashboard Field</span>
          <span>QuickBooks Column</span>
          <span className="text-center">Status</span>
        </div>
        {file.mappings.map((mapping) => (
          <div
            key={mapping.dashboardField}
            className="grid grid-cols-[1fr_1fr_80px] items-center px-4 py-3 border-t border-white/[0.04]"
          >
            <span className="text-sm text-zinc-300">
              {mapping.label}
              {mapping.required && (
                <span className="text-red-400 ml-1">*</span>
              )}
            </span>
            <Select
              value={mapping.mappedColumn ?? "__none__"}
              onValueChange={(val) =>
                onUpdateMapping(
                  mapping.dashboardField,
                  val === "__none__" ? null : val
                )
              }
            >
              <SelectTrigger className="bg-[#141414] border-white/[0.08] text-white text-sm rounded-lg h-8">
                <SelectValue placeholder="Select column..." />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a1a] border-white/[0.08]">
                <SelectItem value="__none__" className="text-zinc-500">
                  Not mapped
                </SelectItem>
                {file.headers.map((h) => (
                  <SelectItem key={h} value={h}>
                    {h}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex justify-center">
              {mapping.mappedColumn ? (
                <Check className="h-4 w-4 text-emerald-400" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-amber-400" />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Data preview */}
      <p className="text-xs uppercase tracking-wider text-zinc-600 mb-2">
        Preview (first 5 rows)
      </p>
      <div className="bg-[#0A0A0A] rounded-lg border border-white/[0.06] overflow-x-auto mb-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.06]">
              {previewHeaders.map((h) => (
                <th
                  key={h}
                  className="text-left text-[11px] uppercase tracking-wider text-zinc-600 px-3 py-2 font-medium whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {previewRows.map((row, i) => (
              <tr key={i} className="border-t border-white/[0.04]">
                {previewHeaders.map((h) => (
                  <td
                    key={h}
                    className="px-3 py-2 text-zinc-400 whitespace-nowrap"
                  >
                    {truncate(row[h] ?? "", 40)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Import type badge */}
      <ImportTypeBadge file={file} />

      {/* Action row */}
      <div className="flex items-center justify-between mt-6 pt-6 border-t border-white/[0.06]">
        <div className="text-sm text-zinc-500">
          {file.rows.length} rows detected ({file.revenuRowCount} revenue,{" "}
          {file.expenseRowCount} expense)
          {!canImport && unmappedRequired.length > 0 && (
            <span className="block text-xs text-red-400 mt-1">
              Missing required mappings:{" "}
              {unmappedRequired.map((m) => m.label).join(", ")}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            className="text-zinc-400 hover:text-white text-sm px-4 py-2 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onImport}
            disabled={!canImport}
            className="bg-[#0070F3] hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors"
          >
            Import
          </button>
        </div>
      </div>
    </div>
  );
}
