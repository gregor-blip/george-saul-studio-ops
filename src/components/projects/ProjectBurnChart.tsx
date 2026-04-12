import { AreaChart, Area, ReferenceLine, XAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { WeeklyHours } from "./types";

interface ProjectBurnChartProps {
  allocations: WeeklyHours[];
  effectiveScopeHours: number | null;
}

const chartConfig: ChartConfig = {
  cumulative: {
    label: "Hours consumed",
    color: "#3B82F6",
  },
};

export function ProjectBurnChart({
  allocations,
  effectiveScopeHours,
}: ProjectBurnChartProps) {
  if (allocations.length === 0) {
    return (
      <p className="text-xs text-zinc-600 italic text-center py-8">
        No allocation data yet for this project.
      </p>
    );
  }

  let cumulative = 0;
  const chartData = allocations.map((a) => {
    cumulative += a.hours;
    const d = new Date(a.week_start_date + "T00:00:00");
    return {
      week: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      cumulative: Math.round(cumulative),
    };
  });

  const pacePerWeek =
    effectiveScopeHours !== null && allocations.length > 0
      ? effectiveScopeHours / allocations.length
      : null;

  // Running pace line
  let paceAccum = 0;
  const paceData = pacePerWeek
    ? chartData.map((d) => {
        paceAccum += pacePerWeek;
        return { ...d, pace: Math.round(paceAccum) };
      })
    : chartData;

  return (
    <ChartContainer config={chartConfig} className="h-[200px] w-full [&_.recharts-wrapper]:!aspect-auto">
      <AreaChart data={paceData}>
        <defs>
          <linearGradient id="burnGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.3} />
            <stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="week"
          tick={{ fontSize: 10, fill: "#52525b" }}
          axisLine={false}
          tickLine={false}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value) => `${value}h`}
            />
          }
        />
        <Area
          type="monotone"
          dataKey="cumulative"
          stroke="#3B82F6"
          fill="url(#burnGradient)"
          strokeWidth={2}
        />
        {effectiveScopeHours !== null && (
          <ReferenceLine
            y={effectiveScopeHours}
            stroke="#EF4444"
            strokeDasharray="4 4"
            strokeOpacity={0.5}
          />
        )}
      </AreaChart>
    </ChartContainer>
  );
}
