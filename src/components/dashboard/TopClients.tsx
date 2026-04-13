import { useNavigate } from "react-router-dom";
import type { ClientProfitability, StudioSummary } from "./types";
import { formatCurrency, formatPct, marginDotColor, marginBgColor } from "./format";

interface TopClientsProps {
  clients: ClientProfitability[];
  summary: StudioSummary;
}

export function TopClients({ clients, summary }: TopClientsProps) {
  const navigate = useNavigate();
  const agencyClients = clients
    .filter((c) => c.business_line === "agency")
    .slice(0, 6);
  const mediaClients = clients.filter((c) => c.business_line === "media");
  const mediaNames = mediaClients.map((c) => c.client_name).join(", ");

  return (
    <div className="col-span-2 bg-[#141414] rounded-xl border border-white/[0.08] overflow-hidden">
      <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Top Agency Clients</h3>
        <button
          onClick={() => navigate("/clients")}
          className="text-xs text-[#0070F3] hover:underline"
        >
          View all &rarr;
        </button>
      </div>

      <div>
        <div className="grid grid-cols-[1fr_100px_140px] px-6 py-2 border-b border-white/[0.06]">
          <span className="text-[11px] uppercase tracking-wider text-zinc-600 font-medium">
            Client
          </span>
          <span className="text-[11px] uppercase tracking-wider text-zinc-600 font-medium text-right">
            Revenue
          </span>
          <span className="text-[11px] uppercase tracking-wider text-zinc-600 font-medium text-right">
            Margin
          </span>
        </div>

        {agencyClients.map((client) => (
          <div
            key={client.client_id}
            className="grid grid-cols-[1fr_100px_140px] items-center px-6 py-3 border-b border-white/[0.04] hover:bg-white/[0.02]"
          >
            <div className="flex items-center gap-3">
              <span
                className={`h-2 w-2 rounded-full shrink-0 ${marginDotColor(client.gross_margin_pct)}`}
              />
              <span className="text-sm text-white truncate">
                {client.client_name}
              </span>
            </div>
            <span className="text-sm tabular-nums font-mono text-zinc-400 text-right">
              {formatCurrency(client.total_revenue)}
            </span>
            <div className="flex items-center justify-end gap-2">
              <div className="w-[60px] h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${marginBgColor(client.gross_margin_pct)}`}
                  style={{
                    width: `${Math.min(Math.max(client.gross_margin_pct ?? 0, 0), 100)}%`,
                  }}
                />
              </div>
              <span className="text-xs tabular-nums text-zinc-500 w-12 text-right">
                {formatPct(client.gross_margin_pct)}
              </span>
            </div>
          </div>
        ))}

        {agencyClients.length === 0 && (
          <p className="text-sm text-zinc-700 text-center py-8">
            No agency client data yet.
          </p>
        )}

        {/* Media summary row */}
        {mediaClients.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-white/[0.08] mt-2">
            <span className="text-xs text-zinc-600">
              Media clients ({mediaNames})
            </span>
            <span className="text-xs tabular-nums text-zinc-500">
              {formatCurrency(summary.media_revenue_billed)} billed
              {" \u00B7 "}
              {formatCurrency(summary.media_spread)} spread
              {" \u00B7 "}
              {formatPct(summary.media_margin_pct)} margin
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export function TopClientsSkeleton() {
  return (
    <div className="col-span-2 bg-white/[0.04] rounded-xl animate-pulse h-[340px]" />
  );
}
