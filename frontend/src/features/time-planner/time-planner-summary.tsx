import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
} from "recharts";
import { TimeBlock } from "./types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface TimePlannerSummaryProps {
  timeBlocks: TimeBlock[];
}

interface CategorySummary {
  name: string;
  minutes: number;
  color: string;
}

interface TitleSummary {
  title: string;
  category: string;
  minutes: number;
  color: string;
}

export default function TimePlannerSummary({
  timeBlocks,
}: TimePlannerSummaryProps) {
  const categorySummary = useMemo(() => {
    const summary: Record<string, CategorySummary> = {};

    timeBlocks.forEach((block) => {
      const startMinutes = block.startHour * 60 + block.startMinute;
      const endMinutes = block.endHour * 60 + block.endMinute;

      let duration = endMinutes - startMinutes;
      if (duration < 0) {
        duration += 24 * 60;
      }

      if (!summary[block.category]) {
        summary[block.category] = {
          name: block.category,
          minutes: 0,
          color: block.color || "#888888",
        };
      }

      summary[block.category].minutes += duration;
    });

    return Object.values(summary).sort((a, b) => b.minutes - a.minutes);
  }, [timeBlocks]);

  const titleSummary = useMemo(() => {
    const summary: Record<string, TitleSummary> = {};

    timeBlocks.forEach((block) => {
      const startMinutes = block.startHour * 60 + block.startMinute;
      const endMinutes = block.endHour * 60 + block.endMinute;

      let duration = endMinutes - startMinutes;
      if (duration < 0) {
        duration += 24 * 60;
      }

      if (!summary[block.title]) {
        summary[block.title] = {
          title: block.title,
          category: block.category,
          minutes: 0,
          color: block.color || "#888888",
        };
      }

      summary[block.title].minutes += duration;
    });

    return Object.values(summary).sort((a, b) => b.minutes - a.minutes);
  }, [timeBlocks]);

  const totalTrackedMinutes = useMemo(() => {
    return categorySummary.reduce((sum, category) => sum + category.minutes, 0);
  }, [categorySummary]);

  const TOTAL_WEEK_MINUTES = 24 * 7 * 60;

  const untrackedMinutes = TOTAL_WEEK_MINUTES - totalTrackedMinutes;

  const fullCategorySummary = useMemo(() => {
    if (untrackedMinutes <= 0) return categorySummary;

    return [
      ...categorySummary,
      {
        name: "Untracked Time",
        minutes: untrackedMinutes,
        color: "#e5e7eb",
      },
    ];
  }, [categorySummary, untrackedMinutes]);

  const totalTrackedHours = (totalTrackedMinutes / 60).toFixed(1);
  const untrackedHours = (untrackedMinutes / 60).toFixed(1);
  const weekTotalHours = (TOTAL_WEEK_MINUTES / 60).toFixed(1);

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

  const categoryChartData = fullCategorySummary.map((category) => ({
    name: category.name,
    value: category.minutes,
    color: category.color,
  }));

  const titleChartData = titleSummary.slice(0, 10).map((item) => ({
    name: item.title,
    value: item.minutes,
    color: item.color,
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border rounded-md shadow-md p-2 text-sm">
          <p className="font-medium">{data.name}</p>
          <p>
            {formatMinutes(data.value)} (
            {((data.value / TOTAL_WEEK_MINUTES) * 100).toFixed(1)}%)
          </p>
        </div>
      );
    }
    return null;
  };

  const BarChartTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border rounded-md shadow-md p-2 text-sm">
          <p className="font-medium truncate max-w-[200px]">{data.name}</p>
          <p>
            {formatMinutes(data.value)} (
            {((data.value / TOTAL_WEEK_MINUTES) * 100).toFixed(1)}%)
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
        <Tabs defaultValue="categories">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="categories">By Category</TabsTrigger>
            <TabsTrigger value="activities">By Activity</TabsTrigger>
          </TabsList>

          {/* Categories Tab */}
          <TabsContent value="categories">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium mb-4">
                  Category Allocation
                </h3>
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
                          (
                          {(
                            (category.minutes / TOTAL_WEEK_MINUTES) *
                            100
                          ).toFixed(1)}
                          %)
                        </span>
                      </div>
                    </div>
                  ))}

                  {/* Display untracked time */}
                  {untrackedMinutes > 0 && (
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: "#e5e7eb" }}
                        ></div>
                        <span className="text-muted-foreground">
                          Untracked Time
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <span className="font-medium text-muted-foreground">
                          {formatMinutes(untrackedMinutes)}
                        </span>
                        <span className="text-muted-foreground">
                          (
                          {(
                            (untrackedMinutes / TOTAL_WEEK_MINUTES) *
                            100
                          ).toFixed(1)}
                          %)
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="border-t pt-2 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Tracked Total</span>
                      <span className="font-medium">
                        {totalTrackedHours} hours
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="font-medium text-muted-foreground">
                        Untracked Total
                      </span>
                      <span className="font-medium text-muted-foreground">
                        {untrackedHours} hours
                      </span>
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t">
                      <span className="font-bold">Week Total</span>
                      <span className="font-bold">{weekTotalHours} hours</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      dataKey="value"
                    >
                      {categoryChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </TabsContent>

          {/* Activities Tab */}
          <TabsContent value="activities">
            <div className="grid grid-cols-1 gap-6">
              <div>
                <h3 className="text-lg font-medium mb-4">Activity Breakdown</h3>
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                  {titleSummary.map((item) => (
                    <div
                      key={item.title}
                      className="flex justify-between items-center"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: item.color }}
                        ></div>
                        <span
                          className="truncate max-w-[200px]"
                          title={item.title}
                        >
                          {item.title}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          ({item.category})
                        </span>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <span className="font-medium">
                          {formatMinutes(item.minutes)}
                        </span>
                        <span className="text-muted-foreground">
                          (
                          {((item.minutes / TOTAL_WEEK_MINUTES) * 100).toFixed(
                            1
                          )}
                          %)
                        </span>
                      </div>
                    </div>
                  ))}

                  {untrackedMinutes > 0 && (
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: "#e5e7eb" }}
                        ></div>
                        <span className="text-muted-foreground">
                          Untracked Time
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <span className="font-medium text-muted-foreground">
                          {formatMinutes(untrackedMinutes)}
                        </span>
                        <span className="text-muted-foreground">
                          (
                          {(
                            (untrackedMinutes / TOTAL_WEEK_MINUTES) *
                            100
                          ).toFixed(1)}
                          %)
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="border-t pt-2 mt-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Tracked Total</span>
                    <span className="font-medium">
                      {totalTrackedHours} hours
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="font-medium text-muted-foreground">
                      Untracked Total
                    </span>
                    <span className="font-medium text-muted-foreground">
                      {untrackedHours} hours
                    </span>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="font-bold">Week Total</span>
                    <span className="font-bold">{weekTotalHours} hours</span>
                  </div>
                </div>
              </div>

              <div className="h-[300px] mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={titleChartData}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
                  >
                    <XAxis type="number" />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={120}
                      tick={({ x, y, payload }) => (
                        <text
                          x={x}
                          y={y}
                          dy={3}
                          textAnchor="end"
                          fontSize={12}
                          fill="currentColor"
                        >
                          {payload.value.length > 15
                            ? `${payload.value.substring(0, 15)}...`
                            : payload.value}
                        </text>
                      )}
                    />
                    <Tooltip content={<BarChartTooltip />} />
                    <Bar
                      dataKey="value"
                      name="Duration"
                      fill="#8884d8"
                      barSize={20}
                    >
                      {titleChartData.map((entry, index) => (
                        <Cell key={`bar-cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
