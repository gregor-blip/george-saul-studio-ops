const currencyFmt = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export function formatCurrency(value: number): string {
  return currencyFmt.format(value);
}

export function formatPct(value: number | null): string {
  if (value === null || value === undefined) return "\u2014";
  return value.toFixed(1) + "%";
}

export function formatDate(iso: string | null): string {
  if (!iso) return "Not yet imported";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function formatMonthYear(iso: string | null): string {
  if (!iso) return "Not yet imported";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

export function marginColor(pct: number | null): string {
  if (pct === null) return "text-zinc-600";
  if (pct >= 50) return "text-emerald-400";
  if (pct >= 30) return "text-amber-400";
  return "text-red-400";
}

export function marginBgColor(pct: number | null): string {
  if (pct === null) return "bg-zinc-800";
  if (pct >= 50) return "bg-emerald-500";
  if (pct >= 30) return "bg-amber-500";
  return "bg-red-500";
}

export function marginDotColor(pct: number | null): string {
  if (pct === null) return "bg-zinc-600";
  if (pct >= 50) return "bg-emerald-400";
  if (pct >= 30) return "bg-amber-400";
  return "bg-red-400";
}

export function utilisationColor(pct: number | null): string {
  if (pct === null) return "text-zinc-600";
  if (pct >= 70) return "text-emerald-400";
  if (pct >= 50) return "text-amber-400";
  return "text-red-400";
}
