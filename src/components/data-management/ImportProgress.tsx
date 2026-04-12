interface ImportProgressProps {
  totalRows: number;
}

export function ImportProgress({ totalRows }: ImportProgressProps) {
  return (
    <div className="flex items-center gap-3 py-4">
      <div className="flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full bg-[#0070F3] animate-pulse" />
        <span
          className="h-2 w-2 rounded-full bg-[#0070F3] animate-pulse"
          style={{ animationDelay: "150ms" }}
        />
        <span
          className="h-2 w-2 rounded-full bg-[#0070F3] animate-pulse"
          style={{ animationDelay: "300ms" }}
        />
      </div>
      <span className="text-sm text-zinc-400">
        Importing {totalRows} rows...
      </span>
    </div>
  );
}
