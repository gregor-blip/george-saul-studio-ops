import { PieChart, Pie, Cell } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { ClientProfitability } from "./types";
import { formatCurrency } from "./format";

interface RevenueMixProps {
  clients: ClientProfitability[];
}

const COLORS = ["#3B82F6", "#34D399", "#A78BFA", "#FBBF24", "#F87171", "#71717A"];

export function RevenueMix({ clients }: RevenueMixProps) {
  const filtered = clients.filter((c) => !c.is_internal && !c.is_passthrough);
  const top5 = filtered.slice(0, 5);
  const othersRevenue = filtered
    .slice(5)
    .reduce((sum, c) => sum + c.total_revenue, 0);

  const chartData = [
    ...top5.map((c) => ({
      name: c.client_name,
      value: c.total_revenue,
    })),
    ...(othersRevenue > 0
      ? [{ name: "Others", value: othersRevenue }]
      : []),
  ];

  const chartConfig: ChartConfig = {};
  chartData.forEach((d, i) => {
    chartConfig[d.name] = {
      label: d.name,
      color: COLORS[i % COLORS.length],
    };
  });

  return (
    <div className="col-span-1 bg-[#141414] rounded-xl border border-white/[0.08] p-6">
      <h3 className="text-sm font-semibold text-white mb-4">Revenue Mix</h3>

      {chartData.length === 0 ? (
        <p className="text-sm text-zinc-700 text-center py-8">
          No revenue data yet.
        </p>
      ) : (
        <>
          <ChartContainer config={chartConfig} className="h-[180px] w-full [&_.recharts-wrapper]:!aspect-auto">
            <PieChart>
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value) => formatCurrency(Number(value))}
                  />
                }
              />
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={2}
                strokeWidth={0}
              >
                {chartData.map((_, i) => (
                  <Cell
                    key={i}
                    fill={COLORS[i % COLORS.length]}
                  />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>

          <div className="mt-4 space-y-2">
            {chartData.map((d, i) => (
              <div key={d.name} className="flex items-center gap-2">
                <span
                  className="h-2 w-2 rounded-full shrink-0"
                  style={{ backgroundColor: COLORS[i % COLORS.length] }}
                />
                <span className="text-xs text-zinc-400 flex-1 truncate">
                  {d.name}
                </span>
                <span className="text-xs tabular-nums text-zinc-500">
                  {formatCurrency(d.value)}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function RevenueMixSkeleton() {
  return (
    <div className="col-span-1 bg-white/[0.04] rounded-xl animate-pulse h-[340px]" />
  );
}
