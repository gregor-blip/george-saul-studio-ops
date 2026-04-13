import { PieChart, Pie, Cell } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { ClientProfitability, StudioSummary } from "./types";
import { formatCurrency } from "./format";

interface RevenueMixProps {
  clients: ClientProfitability[];
  summary: StudioSummary;
}

const AGENCY_COLORS = ["#3B82F6", "#34D399", "#A78BFA", "#FBBF24", "#F87171", "#71717A"];

export function RevenueMix({ clients, summary }: RevenueMixProps) {
  // Agency donut: top 5 agency clients + Others
  const agencyClients = clients.filter((c) => c.business_line === "agency");
  const top5 = agencyClients.slice(0, 5);
  const othersRevenue = agencyClients
    .slice(5)
    .reduce((sum, c) => sum + c.total_revenue, 0);

  const agencyData = [
    ...top5.map((c) => ({ name: c.client_name, value: c.total_revenue })),
    ...(othersRevenue > 0 ? [{ name: "Others", value: othersRevenue }] : []),
  ];

  const agencyConfig: ChartConfig = {};
  agencyData.forEach((d, i) => {
    agencyConfig[d.name] = { label: d.name, color: AGENCY_COLORS[i % AGENCY_COLORS.length] };
  });

  // Media donut: spread vs platform costs
  const mediaData = [
    { name: "G&S Spread", value: summary.media_spread },
    { name: "Platform Costs", value: summary.media_spend },
  ];
  const MEDIA_COLORS = ["#10B981", "#3B82F6"];
  const mediaConfig: ChartConfig = {
    "G&S Spread": { label: "G&S Spread", color: "#10B981" },
    "Platform Costs": { label: "Platform Costs", color: "#3B82F6" },
  };

  const hasAgencyData = agencyData.length > 0;
  const hasMediaData = summary.media_revenue_billed > 0;

  return (
    <div className="col-span-1 bg-[#141414] rounded-xl border border-white/[0.08] p-6">
      <h3 className="text-sm font-semibold text-white mb-4">Revenue Mix</h3>

      {!hasAgencyData && !hasMediaData ? (
        <p className="text-sm text-zinc-700 text-center py-8">
          No revenue data yet.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {/* Agency Revenue Mix */}
          <div>
            <p className="text-xs text-zinc-500 text-center mb-2">Agency Revenue</p>
            {hasAgencyData ? (
              <>
                <ChartContainer config={agencyConfig} className="h-[140px] w-full [&_.recharts-wrapper]:!aspect-auto">
                  <PieChart>
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          formatter={(value) => formatCurrency(Number(value))}
                        />
                      }
                    />
                    <Pie
                      data={agencyData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={35}
                      outerRadius={55}
                      paddingAngle={2}
                      strokeWidth={0}
                    >
                      {agencyData.map((_, i) => (
                        <Cell key={i} fill={AGENCY_COLORS[i % AGENCY_COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ChartContainer>
                <div className="mt-2 space-y-1">
                  {agencyData.map((d, i) => (
                    <div key={d.name} className="flex items-center gap-1.5">
                      <span
                        className="h-2 w-2 rounded-full shrink-0"
                        style={{ backgroundColor: AGENCY_COLORS[i % AGENCY_COLORS.length] }}
                      />
                      <span className="text-[10px] text-zinc-400 flex-1 truncate">
                        {d.name}
                      </span>
                      <span className="text-[10px] tabular-nums text-zinc-500">
                        {formatCurrency(d.value)}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-xs text-zinc-700 text-center py-8">No data</p>
            )}
          </div>

          {/* Media Economics */}
          <div>
            <p className="text-xs text-zinc-500 text-center mb-2">Media Economics</p>
            {hasMediaData ? (
              <>
                <ChartContainer config={mediaConfig} className="h-[140px] w-full [&_.recharts-wrapper]:!aspect-auto">
                  <PieChart>
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          formatter={(value) => formatCurrency(Number(value))}
                        />
                      }
                    />
                    <Pie
                      data={mediaData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={35}
                      outerRadius={55}
                      paddingAngle={2}
                      strokeWidth={0}
                    >
                      {mediaData.map((_, i) => (
                        <Cell key={i} fill={MEDIA_COLORS[i]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ChartContainer>
                <div className="mt-2 space-y-1">
                  {mediaData.map((d, i) => (
                    <div key={d.name} className="flex items-center gap-1.5">
                      <span
                        className="h-2 w-2 rounded-full shrink-0"
                        style={{ backgroundColor: MEDIA_COLORS[i] }}
                      />
                      <span className="text-[10px] text-zinc-400 flex-1 truncate">
                        {d.name}
                      </span>
                      <span className="text-[10px] tabular-nums text-zinc-500">
                        {formatCurrency(d.value)}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-xs text-zinc-700 text-center py-8">No data</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function RevenueMixSkeleton() {
  return (
    <div className="col-span-1 bg-white/[0.04] rounded-xl animate-pulse h-[340px]" />
  );
}
