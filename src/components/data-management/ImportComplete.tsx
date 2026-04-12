import { CheckCircle2 } from "lucide-react";
import { type ImportResult } from "./types";

interface ImportCompleteProps {
  result: ImportResult;
  onReset: () => void;
}

export function ImportComplete({ result, onReset }: ImportCompleteProps) {
  return (
    <div className="flex flex-col items-center justify-center py-8 gap-3">
      <CheckCircle2 className="h-8 w-8 text-emerald-400" />
      <p className="text-base font-semibold text-white">Import complete</p>
      <p className="text-sm text-zinc-500">
        {result.revenueRows} revenue rows &middot; {result.expenseRows} expense
        rows &middot; {result.skippedRows} rows skipped
      </p>
      {result.skipReasons.length > 0 && (
        <div className="text-xs text-zinc-600 text-center max-w-md">
          {result.skipReasons.map((reason, i) => (
            <p key={i}>{reason}</p>
          ))}
        </div>
      )}
      <button
        onClick={onReset}
        className="text-[#0070F3] text-sm hover:underline mt-2"
      >
        Import another file
      </button>
    </div>
  );
}
