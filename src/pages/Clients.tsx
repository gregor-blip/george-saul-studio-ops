import { useState, useMemo, useCallback } from "react";
import { useClientProfitability } from "@/components/dashboard/use-dashboard-data";
import { formatCurrency, formatPct } from "@/components/dashboard/format";
import type { ClientProfitability } from "@/components/dashboard/types";
import type { SortField, SortDirection } from "@/components/clients/types";
import { ClientsTable, ClientsTableSkeleton } from "@/components/clients/ClientsTable";
import { ClientDetailPanel } from "@/components/clients/ClientDetailPanel";

function sortClients(
  clients: ClientProfitability[],
  field: SortField,
  dir: SortDirection
): ClientProfitability[] {
  return [...clients].sort((a, b) => {
    const aVal = a[field];
    const bVal = b[field];
    if (aVal === null && bVal === null) return 0;
    if (aVal === null) return 1;
    if (bVal === null) return -1;
    const cmp = typeof aVal === "string"
      ? aVal.localeCompare(bVal as string)
      : (aVal as number) - (bVal as number);
    return dir === "asc" ? cmp : -cmp;
  });
}

export default function Clients() {
  const { data: allClients, isLoading } = useClientProfitability();
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("total_revenue");
  const [sortDir, setSortDir] = useState<SortDirection>("desc");
  const [selectedClient, setSelectedClient] = useState<ClientProfitability | null>(null);

  const coreClients = useMemo(
    () => (allClients ?? []).filter((c) => c.business_line !== "internal"),
    [allClients]
  );

  const filtered = useMemo(() => {
    if (!search.trim()) return coreClients;
    const q = search.toLowerCase();
    return coreClients.filter((c) =>
      c.client_name.toLowerCase().includes(q)
    );
  }, [coreClients, search]);

  const sorted = useMemo(
    () => sortClients(filtered, sortField, sortDir),
    [filtered, sortField, sortDir]
  );

  const handleSort = useCallback(
    (field: SortField) => {
      if (field === sortField) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setSortField(field);
        setSortDir("desc");
      }
    },
    [sortField]
  );

  // Summary KPIs
  const activeCount = coreClients.filter((c) => c.total_revenue > 0).length;
  const totalRevenue = coreClients.reduce((s, c) => s + c.total_revenue, 0);
  const marginsWithData = coreClients
    .map((c) => c.gross_margin_pct)
    .filter((m): m is number => m !== null);
  const avgMargin =
    marginsWithData.length > 0
      ? marginsWithData.reduce((s, m) => s + m, 0) / marginsWithData.length
      : null;
  const belowTarget = coreClients.filter(
    (c) => c.gross_margin_pct !== null && c.gross_margin_pct < 50
  ).length;

  return (
    <div>
      {/* Header */}
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white mb-1">
            Clients
          </h1>
          <p className="text-sm text-zinc-500">
            Per-client profitability and scope status
          </p>
        </div>
        <input
          type="text"
          placeholder="Search clients..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-[#141414] border border-white/[0.08] rounded-lg px-3 py-1.5 text-sm text-white placeholder:text-zinc-600 w-48 focus:border-white/[0.20] outline-none"
        />
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-[#141414] rounded-xl border border-white/[0.08] p-4">
          <p className="text-xs font-medium text-zinc-500 mb-1">Active Clients</p>
          <p className="text-2xl font-bold tabular-nums tracking-tight text-white">
            {isLoading ? "\u2014" : activeCount}
          </p>
        </div>
        <div className="bg-[#141414] rounded-xl border border-white/[0.08] p-4">
          <p className="text-xs font-medium text-zinc-500 mb-1">Total Agency Revenue</p>
          <p className="text-2xl font-bold tabular-nums tracking-tight text-white">
            {isLoading ? "\u2014" : formatCurrency(totalRevenue)}
          </p>
        </div>
        <div className="bg-[#141414] rounded-xl border border-white/[0.08] p-4">
          <p className="text-xs font-medium text-zinc-500 mb-1">Avg Gross Margin</p>
          <p className="text-2xl font-bold tabular-nums tracking-tight text-white">
            {isLoading ? "\u2014" : formatPct(avgMargin)}
          </p>
        </div>
        <div className="bg-[#141414] rounded-xl border border-white/[0.08] p-4">
          <p className="text-xs font-medium text-zinc-500 mb-1">Clients Below 50% Margin</p>
          <p
            className={`text-2xl font-bold tabular-nums tracking-tight ${
              belowTarget > 0 ? "text-amber-400" : "text-white"
            }`}
          >
            {isLoading ? "\u2014" : belowTarget}
          </p>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <ClientsTableSkeleton />
      ) : (
        <ClientsTable
          clients={sorted}
          sortField={sortField}
          sortDir={sortDir}
          onSort={handleSort}
          onSelectClient={setSelectedClient}
        />
      )}

      {/* Passthrough note */}
      <p className="mt-4 px-2 text-xs text-zinc-700">
        GA Group / Joann Fabric ($7.0M) is excluded from this view — media
        pass-through revenue with near-zero margin.
      </p>

      {/* Detail panel */}
      {selectedClient && (
        <ClientDetailPanel
          client={selectedClient}
          onClose={() => setSelectedClient(null)}
        />
      )}
    </div>
  );
}
