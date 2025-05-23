// src/features/time-tracker/time-entries-summary.tsx
import { useMemo } from "react";
import { TimeEntry, TimeCategory } from "@/store/time-tracking-definitions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PieChart,
  BarChart,
  Clock,
  CalendarDays,
  Clock3,
  Tag,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateString } from "@/lib/time-utils";
import {
  PieChart as RechartsPreChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import { useStore } from "@tanstack/react-store";
import dataStore from "@/store/data-store";

interface TimeEntriesSummaryProps {
  isLoading: boolean;
}

interface CategorySummary {
  id: string;
  name: string;
  color: string;
  totalMinutes: number;
  percentageOfTotal: number;
}

interface TagSummary {
  name: string;
  totalMinutes: number;
  percentageOfTotal: number;
  color: string;
}

// Format minutes as hours and minutes in a human-readable format
const formatHoursAndMinutes = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
};

export default function TimeEntriesSummary({
  isLoading,
}: TimeEntriesSummaryProps) {
  const entries = useStore(dataStore, (state) => state.time_entries);
  const categories = useStore(dataStore, (state) => state.time_categories);

  // Calculate time totals for today
  const todaySummary = useMemo(() => {
    const today = formatDateString(new Date());

    const todayEntries = entries.filter(
      (entry) => formatDateString(new Date(entry.start_time)) === today
    );

    return calculateCategorySummaries(todayEntries, categories);
  }, [entries, categories]);

  // Calculate time totals for this week
  const weekSummary = useMemo(() => {
    const now = new Date();
    const startOfWeek = new Date(now);
    // Get the day of the week (0 = Sunday, 6 = Saturday)
    const day = now.getDay();
    // Set to the previous Sunday
    startOfWeek.setDate(now.getDate() - day);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const weekEntries = entries.filter((entry) => {
      const entryDate = new Date(entry.start_time);
      return entryDate >= startOfWeek && entryDate <= endOfWeek;
    });

    return calculateCategorySummaries(weekEntries, categories);
  }, [entries, categories]);

  // Calculate tag summaries for this week
  const tagSummary = useMemo(() => {
    const now = new Date();
    const startOfWeek = new Date(now);
    const day = now.getDay();
    startOfWeek.setDate(now.getDate() - day);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const weekEntries = entries.filter((entry) => {
      const entryDate = new Date(entry.start_time);
      return entryDate >= startOfWeek && entryDate <= endOfWeek;
    });

    return calculateTagSummaries(weekEntries);
  }, [entries]);

  // Calculate untracked time for today
  const todayUntrackedTime = useMemo(() => {
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    // Full 24 hours = 1440 minutes
    const totalMinutesInDay = 24 * 60;

    // If the day isn't over yet, calculate how many minutes have passed
    const elapsedMinutesToday = now.getHours() * 60 + now.getMinutes();

    // Available minutes is what has elapsed so far today
    const availableMinutes = Math.min(totalMinutesInDay, elapsedMinutesToday);

    // Calculate untracked time
    const untrackedMinutes = Math.max(
      0,
      availableMinutes - todaySummary.totalMinutes
    );

    return {
      untrackedMinutes,
      availableMinutes,
      percentageTracked:
        availableMinutes > 0
          ? (todaySummary.totalMinutes / availableMinutes) * 100
          : 0,
    };
  }, [todaySummary.totalMinutes]);

  // Calculate untracked time for the week
  const weekUntrackedTime = useMemo(() => {
    const now = new Date();
    const today = now.getDay(); // 0 = Sunday, 6 = Saturday

    // Minutes in full days since beginning of week
    const fullDaysSinceStartOfWeek = today;
    const minutesInFullDays = fullDaysSinceStartOfWeek * 24 * 60;

    // Minutes in current partial day
    const currentDayMinutes = now.getHours() * 60 + now.getMinutes();

    // Total available minutes = full days + partial day
    const availableMinutes = minutesInFullDays + currentDayMinutes;

    // Calculate untracked time
    const untrackedMinutes = Math.max(
      0,
      availableMinutes - weekSummary.totalMinutes
    );

    return {
      untrackedMinutes,
      availableMinutes,
      percentageTracked:
        availableMinutes > 0
          ? (weekSummary.totalMinutes / availableMinutes) * 100
          : 0,
    };
  }, [weekSummary.totalMinutes]);

  // Calculate daily totals for the week
  const dailyTotals = useMemo(() => {
    const now = new Date();
    const startOfWeek = new Date(now);
    const day = now.getDay();
    startOfWeek.setDate(now.getDate() - day);
    startOfWeek.setHours(0, 0, 0, 0);

    const dailyData = [];

    // Generate data for each day of the week
    for (let i = 0; i < 7; i++) {
      const currentDay = new Date(startOfWeek);
      currentDay.setDate(startOfWeek.getDate() + i);
      const dateString = formatDateString(currentDay);

      // Get entries for this day
      const dayEntries = entries.filter(
        (entry) => formatDateString(new Date(entry.start_time)) === dateString
      );

      // Calculate total for this day
      let totalMinutes = 0;
      dayEntries.forEach((entry) => {
        totalMinutes += entry.duration_minutes;
      });

      // Calculate available and untracked time
      let availableMinutes = 0;
      let untrackedMinutes = 0;

      const minutesInFullDay = 24 * 60;

      // Is this day in the future?
      if (currentDay > now) {
        // Future day, no available time yet
        availableMinutes = 0;
      } else if (formatDateString(currentDay) === formatDateString(now)) {
        // Today - calculate minutes elapsed so far
        availableMinutes = now.getHours() * 60 + now.getMinutes();
      } else {
        // Past day - full 24 hours available
        availableMinutes = minutesInFullDay;
      }

      untrackedMinutes = Math.max(0, availableMinutes - totalMinutes);

      // Add data point
      dailyData.push({
        day: currentDay.toLocaleDateString(undefined, { weekday: "short" }),
        totalMinutes,
        untrackedMinutes,
        availableMinutes,
        date: currentDay,
      });
    }

    return dailyData;
  }, [entries]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-80 w-full" />
          <Skeleton className="h-80 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Top summary stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Today's Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <div className="text-3xl font-bold">
                      {formatHoursAndMinutes(todaySummary.totalMinutes)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Total time tracked today
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xl font-semibold text-muted-foreground">
                      {formatHoursAndMinutes(
                        todayUntrackedTime.untrackedMinutes
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground flex items-center justify-end gap-1">
                      <Clock3 className="h-3 w-3" />
                      <span>Untracked</span>
                    </div>
                  </div>
                </div>

                {/* Tracking progress bar */}
                <div className="h-2 bg-muted rounded-full overflow-hidden mb-4">
                  <div
                    className="h-full bg-green-500 rounded-full"
                    style={{
                      width: `${Math.min(100, todayUntrackedTime.percentageTracked)}%`,
                    }}
                  ></div>
                </div>

                <div className="mt-4 space-y-4">
                  {todaySummary.categories.length > 0 ? (
                    todaySummary.categories.map((cat) => (
                      <div
                        key={cat.id}
                        className="flex justify-between items-center"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: cat.color }}
                          />
                          <span className="text-sm truncate max-w-[150px]">
                            {cat.name}
                          </span>
                        </div>
                        <div className="text-sm font-medium">
                          {formatHoursAndMinutes(cat.totalMinutes)} (
                          {Math.round(cat.percentageOfTotal)}%)
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No time entries for today
                    </div>
                  )}
                </div>
              </div>

              <div className="h-40">
                {todaySummary.categories.length > 0 ||
                todayUntrackedTime.untrackedMinutes > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPreChart>
                      <Pie
                        data={[
                          ...todaySummary.categories,
                          // Only include untracked if there's available time
                          ...(todayUntrackedTime.untrackedMinutes > 0
                            ? [
                                {
                                  id: "untracked",
                                  name: "Untracked",
                                  color: "#e5e7eb", // gray-200
                                  totalMinutes:
                                    todayUntrackedTime.untrackedMinutes,
                                  percentageOfTotal: 0, // This will be calculated by the chart
                                },
                              ]
                            : []),
                        ]}
                        dataKey="totalMinutes"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius="100%"
                        innerRadius="60%"
                        paddingAngle={2}
                      >
                        {[
                          ...todaySummary.categories,
                          ...(todayUntrackedTime.untrackedMinutes > 0
                            ? [
                                {
                                  id: "untracked",
                                  color: "#e5e7eb",
                                },
                              ]
                            : []),
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) =>
                          formatHoursAndMinutes(value as number)
                        }
                      />
                    </RechartsPreChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <PieChart className="h-16 w-16 text-muted-foreground/30" />
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              This Week's Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <div className="text-3xl font-bold">
                      {formatHoursAndMinutes(weekSummary.totalMinutes)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Total time tracked this week
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xl font-semibold text-muted-foreground">
                      {formatHoursAndMinutes(
                        weekUntrackedTime.untrackedMinutes
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground flex items-center justify-end gap-1">
                      <Clock3 className="h-3 w-3" />
                      <span>Untracked</span>
                    </div>
                  </div>
                </div>

                {/* Tracking progress bar */}
                <div className="h-2 bg-muted rounded-full overflow-hidden mb-4">
                  <div
                    className="h-full bg-green-500 rounded-full"
                    style={{
                      width: `${Math.min(100, weekUntrackedTime.percentageTracked)}%`,
                    }}
                  ></div>
                </div>

                <div className="mt-4 space-y-4">
                  {weekSummary.categories.length > 0 ? (
                    weekSummary.categories.map((cat) => (
                      <div
                        key={cat.id}
                        className="flex justify-between items-center"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: cat.color }}
                          />
                          <span className="text-sm truncate max-w-[150px]">
                            {cat.name}
                          </span>
                        </div>
                        <div className="text-sm font-medium">
                          {formatHoursAndMinutes(cat.totalMinutes)} (
                          {Math.round(cat.percentageOfTotal)}%)
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No time entries for this week
                    </div>
                  )}
                </div>
              </div>

              <div className="h-40">
                {weekSummary.categories.length > 0 ||
                weekUntrackedTime.untrackedMinutes > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPreChart>
                      <Pie
                        data={[
                          ...weekSummary.categories,
                          // Only include untracked if there's available time
                          ...(weekUntrackedTime.untrackedMinutes > 0
                            ? [
                                {
                                  id: "untracked",
                                  name: "Untracked",
                                  color: "#e5e7eb", // gray-200
                                  totalMinutes:
                                    weekUntrackedTime.untrackedMinutes,
                                  percentageOfTotal: 0, // This will be calculated by the chart
                                },
                              ]
                            : []),
                        ]}
                        dataKey="totalMinutes"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius="100%"
                        innerRadius="60%"
                        paddingAngle={2}
                      >
                        {[
                          ...weekSummary.categories,
                          ...(weekUntrackedTime.untrackedMinutes > 0
                            ? [
                                {
                                  id: "untracked",
                                  color: "#e5e7eb",
                                },
                              ]
                            : []),
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) =>
                          formatHoursAndMinutes(value as number)
                        }
                      />
                    </RechartsPreChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <PieChart className="h-16 w-16 text-muted-foreground/30" />
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily activity chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <BarChart className="h-5 w-5" />
            Daily Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            {dailyTotals.some(
              (day) => day.totalMinutes > 0 || day.untrackedMinutes > 0
            ) ? (
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart
                  data={dailyTotals}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <XAxis dataKey="day" />
                  <YAxis
                    tickFormatter={(minutes) => `${Math.floor(minutes / 60)}h`}
                    label={{
                      value: "Hours",
                      angle: -90,
                      position: "insideLeft",
                    }}
                  />
                  <Tooltip
                    formatter={(value) =>
                      formatHoursAndMinutes(value as number)
                    }
                    labelFormatter={(label, payload) => {
                      if (payload && payload.length > 0) {
                        const date = (payload[0].payload as any).date;
                        return date.toLocaleDateString();
                      }
                      return label;
                    }}
                  />
                  <Legend />
                  <Bar
                    dataKey="totalMinutes"
                    fill="#3b82f6"
                    name="Time Tracked"
                    stackId="a"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="untrackedMinutes"
                    fill="#e5e7eb"
                    name="Untracked Time"
                    stackId="a"
                    radius={[4, 4, 0, 0]}
                  />
                </RechartsBarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <BarChart className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    No time entries for this week
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Category breakdown by day - advanced chart for detailed analysis */}
      {weekSummary.totalMinutes > 0 && (
        <CategoryDailyBreakdown entries={entries} categories={categories} />
      )}

      {/* Tag summary for the week */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Weekly Tags Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-xl font-semibold">
                    {tagSummary.tags.length}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Tags used this week
                  </div>
                </div>
                <div className="text-xl font-semibold">
                  {formatHoursAndMinutes(weekSummary.totalMinutes)}
                </div>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                {tagSummary.tags.length > 0 ? (
                  tagSummary.tags.map((tag) => (
                    <div
                      key={tag.name}
                      className="flex justify-between items-center p-2 rounded-md hover:bg-accent/50"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: tag.color }}
                        />
                        <span className="text-sm font-medium">{tag.name}</span>
                      </div>
                      <div className="text-sm">
                        {formatHoursAndMinutes(tag.totalMinutes)} (
                        {Math.round(tag.percentageOfTotal)}%)
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No tags used this week
                  </div>
                )}
              </div>
            </div>

            <div className="h-60">
              {tagSummary.tags.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPreChart>
                    <Pie
                      data={tagSummary.tags}
                      dataKey="totalMinutes"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius="70%"
                      innerRadius="40%"
                      paddingAngle={1}
                      label={({ name, percent }) =>
                        `${name} (${(percent * 100).toFixed(0)}%)`
                      }
                      labelLine={false}
                    >
                      {tagSummary.tags.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) =>
                        formatHoursAndMinutes(value as number)
                      }
                    />
                  </RechartsPreChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <Tag className="h-16 w-16 text-muted-foreground/30" />
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Helper function to calculate category summaries
function calculateCategorySummaries(
  entries: TimeEntry[],
  categories: TimeCategory[]
) {
  // Calculate total minutes
  let totalMinutes = 0;
  entries.forEach((entry) => {
    totalMinutes += entry.duration_minutes;
  });

  // Calculate per-category totals
  const categoriesMap = new Map<string, CategorySummary>();

  // Initialize with all categories (even those with zero time)
  categories.forEach((cat) => {
    categoriesMap.set(cat.id, {
      id: cat.id,
      name: cat.name,
      color: cat.color || "#3b82f6",
      totalMinutes: 0,
      percentageOfTotal: 0,
    });
  });

  // Add uncategorized entry if needed
  categoriesMap.set("uncategorized", {
    id: "uncategorized",
    name: "Uncategorized",
    color: "#94a3b8", // slate-400
    totalMinutes: 0,
    percentageOfTotal: 0,
  });

  // Calculate totals for each category
  entries.forEach((entry) => {
    const categoryId = entry.category_id || "uncategorized";

    // Skip if category doesn't exist (shouldn't happen with proper initialization)
    if (!categoriesMap.has(categoryId)) return;

    const currentTotal = categoriesMap.get(categoryId)!.totalMinutes;
    const updatedTotal = currentTotal + entry.duration_minutes;

    categoriesMap.set(categoryId, {
      ...categoriesMap.get(categoryId)!,
      totalMinutes: updatedTotal,
      percentageOfTotal: totalMinutes ? (updatedTotal / totalMinutes) * 100 : 0,
    });
  });

  // Convert to array and sort by total time (descending)
  const categoriesArray = Array.from(categoriesMap.values())
    .filter((cat) => cat.totalMinutes > 0)
    .sort((a, b) => b.totalMinutes - a.totalMinutes);

  return {
    totalMinutes,
    categories: categoriesArray,
  };
}

// Helper function to calculate tag summaries
function calculateTagSummaries(entries: TimeEntry[]) {
  // Get total minutes tracked
  let totalMinutes = 0;
  entries.forEach((entry) => {
    totalMinutes += entry.duration_minutes;
  });

  // Map to store tag totals
  const tagsMap = new Map<string, TagSummary>();

  // Color palette for tags
  const tagColors = [
    "#3b82f6", // blue
    "#10b981", // green
    "#f59e0b", // amber
    "#ef4444", // red
    "#8b5cf6", // purple
    "#ec4899", // pink
    "#0ea5e9", // sky
    "#14b8a6", // teal
    "#f97316", // orange
    "#6366f1", // indigo
    "#84cc16", // lime
    "#9333ea", // violet
    "#06b6d4", // cyan
    "#d946ef", // fuchsia
    "#f43f5e", // rose
  ];

  // Process all entries
  entries.forEach((entry) => {
    if (!entry.tags) return;

    const entryTags = entry.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);

    // If no valid tags, skip
    if (entryTags.length === 0) return;

    // If multiple tags, we'll split the time equally among them
    const minutesPerTag = entry.duration_minutes / entryTags.length;

    entryTags.forEach((tagName) => {
      if (tagsMap.has(tagName)) {
        // Update existing tag
        const tagData = tagsMap.get(tagName)!;
        const newTotal = tagData.totalMinutes + minutesPerTag;
        tagsMap.set(tagName, {
          ...tagData,
          totalMinutes: newTotal,
          percentageOfTotal: totalMinutes ? (newTotal / totalMinutes) * 100 : 0,
        });
      } else {
        // Create new tag
        const colorIndex = tagsMap.size % tagColors.length;
        tagsMap.set(tagName, {
          name: tagName,
          totalMinutes: minutesPerTag,
          percentageOfTotal: totalMinutes
            ? (minutesPerTag / totalMinutes) * 100
            : 0,
          color: tagColors[colorIndex],
        });
      }
    });
  });

  // Convert to array and sort by total time (descending)
  const tagsArray = Array.from(tagsMap.values()).sort(
    (a, b) => b.totalMinutes - a.totalMinutes
  );

  return {
    totalMinutes,
    tags: tagsArray,
  };
}

interface CategoryDailyBreakdownProps {
  entries: TimeEntry[];
  categories: TimeCategory[];
}

// Component for showing category breakdown by day
function CategoryDailyBreakdown({
  entries,
  categories,
}: CategoryDailyBreakdownProps) {
  // Prepare data for stacked bar chart
  const chartData = useMemo(() => {
    const now = new Date();
    const startOfWeek = new Date(now);
    const day = now.getDay();
    startOfWeek.setDate(now.getDate() - day);
    startOfWeek.setHours(0, 0, 0, 0);

    const dailyData = [];

    // Create a map for category colors
    const categoryColorMap = new Map<string, string>();
    categories.forEach((cat) => {
      categoryColorMap.set(cat.id, cat.color || "#3b82f6");
    });
    // Add uncategorized
    categoryColorMap.set("uncategorized", "#94a3b8");
    // Add untracked
    categoryColorMap.set("untracked", "#e5e7eb");

    // Generate data for each day of the week
    for (let i = 0; i < 7; i++) {
      const currentDay = new Date(startOfWeek);
      currentDay.setDate(startOfWeek.getDate() + i);
      const dateString = formatDateString(currentDay);

      // Get entries for this day
      const dayEntries = entries.filter(
        (entry) => formatDateString(new Date(entry.start_time)) === dateString
      );

      // Create data point with category breakdowns
      const dataPoint: Record<string, any> = {
        day: currentDay.toLocaleDateString(undefined, { weekday: "short" }),
        date: currentDay,
      };

      // Initialize all categories to 0
      categories.forEach((cat) => {
        dataPoint[cat.id] = 0;
      });
      dataPoint["uncategorized"] = 0;

      // Calculate totals per category
      dayEntries.forEach((entry) => {
        const categoryId = entry.category_id || "uncategorized";
        dataPoint[categoryId] =
          (dataPoint[categoryId] || 0) + entry.duration_minutes;
      });

      // Calculate untracked time
      let availableMinutes = 0;
      const minutesInFullDay = 24 * 60;

      // Is this day in the future?
      if (currentDay > now) {
        // Future day, no available time yet
        availableMinutes = 0;
      } else if (formatDateString(currentDay) === formatDateString(now)) {
        // Today - calculate minutes elapsed so far
        availableMinutes = now.getHours() * 60 + now.getMinutes();
      } else {
        // Past day - full 24 hours available
        availableMinutes = minutesInFullDay;
      }

      // Calculate total tracked time
      let totalTracked = 0;
      categories.forEach((cat) => {
        totalTracked += dataPoint[cat.id] || 0;
      });
      totalTracked += dataPoint["uncategorized"] || 0;

      // Add untracked time
      dataPoint["untracked"] = Math.max(0, availableMinutes - totalTracked);

      dailyData.push(dataPoint);
    }

    return {
      dailyData,
      categories: [
        ...categories,
        { id: "uncategorized", name: "Uncategorized", color: "#94a3b8" },
        { id: "untracked", name: "Untracked", color: "#e5e7eb" },
      ],
    };
  }, [entries, categories]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <BarChart className="h-5 w-5" />
          Category Breakdown by Day
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsBarChart
              data={chartData.dailyData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              stackOffset="expand"
            >
              <XAxis dataKey="day" />
              <YAxis tickFormatter={(value) => `${Math.round(value * 100)}%`} />
              <Tooltip
                formatter={(value, name) => {
                  const matchingCategory = chartData.categories.find(
                    (c) => c.id === name
                  );
                  return [
                    formatHoursAndMinutes(value as number),
                    matchingCategory?.name || name,
                  ];
                }}
                labelFormatter={(label, payload) => {
                  if (payload && payload.length > 0) {
                    const date = (payload[0].payload as any).date;
                    return date.toLocaleDateString();
                  }
                  return label;
                }}
              />
              <Legend
                formatter={(value) => {
                  const matchingCategory = chartData.categories.find(
                    (c) => c.id === value
                  );
                  return matchingCategory?.name || value;
                }}
              />
              {chartData.categories
                .filter((cat) =>
                  chartData.dailyData.some((day) => (day as any)[cat.id] > 0)
                )
                .map((category) => (
                  <Bar
                    key={category.id}
                    dataKey={category.id}
                    stackId="a"
                    fill={category.color}
                    name={category.id}
                  />
                ))}
            </RechartsBarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
