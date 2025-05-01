// src/features/time-planner/time-planner-summary.tsx
import { useMemo } from "react";
import { differenceInMinutes } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { TimeBlock } from "./types";

interface TimePlannerSummaryProps {
  timeBlocks: TimeBlock[];
}

interface CategorySummary {
  name: string;
  minutes: number;
  color: string;
}

export default function TimePlannerSummary({
  timeBlocks,
}: TimePlannerSummaryProps) {
  // Calculate summary by category
  const categorySummary = useMemo(() => {
    const summary: Record<string, CategorySummary> = {};

    timeBlocks.forEach((block) => {
      const minutes = differenceInMinutes(block.endTime, block.startTime);

      if (!summary[block.category]) {
        summary[block.category] = {
          name: block.category,
          minutes: 0,
          color: block.color || "#888888",
        };
      }

      summary[block.category].minutes += minutes;
    });

    return Object.values(summary).sort((a, b) => b.minutes - a.minutes);
  }, [timeBlocks]);

  // Calculate total hours
  const totalMinutes = useMemo(() => {
    return categorySummary.reduce((sum, category) => sum + category.minutes, 0);
  }, [categorySummary]);

  const totalHours = (totalMinutes / 60).toFixed(1);

  // Format minutes as hours and minutes
  const formatMinutes = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (hours === 0) {
      return `${minutes}m`;
    } else if (remainingMinutes === 0) {
      return `${hours}h`;
    } else {
      return `${hours}h ${remainingMinutes}m`;
    }
  };

  // Format data for chart
  const chartData = categorySummary.map((category) => ({
    name: category.name,
    value: category.minutes,
    color: category.color,
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border rounded-md shadow-md p-2 text-sm">
          <p className="font-medium">{data.name}</p>
          <p>
            {formatMinutes(data.value)} (
            {((data.value / totalMinutes) * 100).toFixed(1)}%)
          </p>
        </div>
      );
    }
    return null;
  };

  if (timeBlocks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Weekly Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            No time blocks planned for this week
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Weekly Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium mb-4">Time Allocation</h3>
            <div className="space-y-4">
              {categorySummary.map((category) => (
                <div
                  key={category.name}
                  className="flex justify-between items-center"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: category.color }}
                    ></div>
                    <span>{category.name}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-medium">
                      {formatMinutes(category.minutes)}
                    </span>
                    <span className="text-muted-foreground">
                      ({((category.minutes / totalMinutes) * 100).toFixed(1)}%)
                    </span>
                  </div>
                </div>
              ))}

              <div className="flex justify-between items-center border-t pt-2 mt-4">
                <span className="font-medium">Total</span>
                <span className="font-medium">{totalHours} hours</span>
              </div>
            </div>
          </div>

          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
