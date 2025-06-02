import { useMemo, useState } from "react";
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
import { timeFilterStore, filterTimeEntries } from "@/store/time-filter-store";
import { Button } from "@/components/ui/button";
import { Calendar, CalendarDays as CalendarIcon } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

interface TimeEntriesSummaryProps {
  isLoading: boolean;
}

interface DateRange {
  from: Date;
  to: Date;
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

const formatHoursAndMinutes = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
};

export default function TimeEntriesSummary({
  isLoading,
}: TimeEntriesSummaryProps) {
  const rawEntries = useStore(dataStore, (state) => state.time_entries);
  const categories = useStore(dataStore, (state) => state.time_categories);
  const hiddenHours = useStore(timeFilterStore, (state) => state.hiddenHours);

  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const now = new Date();
    const startOfWeek = new Date(now);
    const day = now.getDay();
    startOfWeek.setDate(now.getDate() - day);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    return { from: startOfWeek, to: endOfWeek };
  });

  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const entries = useMemo(() => {
    const filtered = filterTimeEntries(rawEntries, hiddenHours);

    return filtered;
  }, [rawEntries, hiddenHours]);

  const todaySummary = useMemo(() => {
    const today = formatDateString(new Date());

    const todayEntries = entries.filter(
      (entry) => formatDateString(new Date(entry.start_time)) === today
    );

    return calculateCategorySummaries(todayEntries, categories);
  }, [entries, categories]);

  const dateRangeSummary = useMemo(() => {
    const rangeEntries = entries.filter((entry) => {
      const entryDate = new Date(entry.start_time);
      return entryDate >= dateRange.from && entryDate <= dateRange.to;
    });

    return calculateCategorySummaries(rangeEntries, categories);
  }, [entries, categories, dateRange]);

  const tagSummary = useMemo(() => {
    const rangeEntries = entries.filter((entry) => {
      const entryDate = new Date(entry.start_time);
      return entryDate >= dateRange.from && entryDate <= dateRange.to;
    });

    return calculateTagSummaries(rangeEntries);
  }, [entries, dateRange]);

  const todayUntrackedTime = useMemo(() => {
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    const totalMinutesInDay = 24 * 60;
    const elapsedMinutesToday = now.getHours() * 60 + now.getMinutes();
    const baseAvailableMinutes = Math.min(
      totalMinutesInDay,
      elapsedMinutesToday
    );

    const hiddenMinutesToday = hiddenHours.reduce((total, hour) => {
      if (
        hour < now.getHours() ||
        (hour === now.getHours() && now.getMinutes() > 0)
      ) {
        const hiddenHourStart = hour * 60;
        const hiddenHourEnd = Math.min((hour + 1) * 60, elapsedMinutesToday);
        if (hiddenHourEnd > hiddenHourStart) {
          total += hiddenHourEnd - hiddenHourStart;
        }
      }
      return total;
    }, 0);

    const availableMinutes = baseAvailableMinutes - hiddenMinutesToday;

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
  }, [todaySummary.totalMinutes, hiddenHours]);

  const dateRangeUntrackedTime = useMemo(() => {
    const now = new Date();
    let totalAvailableMinutes = 0;
    let totalHiddenMinutes = 0;

    const currentDate = new Date(dateRange.from);
    while (currentDate <= dateRange.to) {
      const isToday = formatDateString(currentDate) === formatDateString(now);
      const isFuture = currentDate > now;

      if (isFuture) {
        // Do nothing
      } else if (isToday) {
        const elapsedMinutesToday = now.getHours() * 60 + now.getMinutes();
        totalAvailableMinutes += elapsedMinutesToday;

        const hiddenMinutesToday = hiddenHours.reduce((total, hour) => {
          if (
            hour < now.getHours() ||
            (hour === now.getHours() && now.getMinutes() > 0)
          ) {
            const hiddenHourStart = hour * 60;
            const hiddenHourEnd = Math.min(
              (hour + 1) * 60,
              elapsedMinutesToday
            );
            if (hiddenHourEnd > hiddenHourStart) {
              total += hiddenHourEnd - hiddenHourStart;
            }
          }
          return total;
        }, 0);
        totalHiddenMinutes += hiddenMinutesToday;
      } else {
        totalAvailableMinutes += 24 * 60;
        totalHiddenMinutes += hiddenHours.length * 60;
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    const availableMinutes = totalAvailableMinutes - totalHiddenMinutes;
    const untrackedMinutes = Math.max(
      0,
      availableMinutes - dateRangeSummary.totalMinutes
    );

    return {
      untrackedMinutes,
      availableMinutes,
      percentageTracked:
        availableMinutes > 0
          ? (dateRangeSummary.totalMinutes / availableMinutes) * 100
          : 0,
    };
  }, [dateRangeSummary.totalMinutes, hiddenHours, dateRange]);

  const dailyTotals = useMemo(() => {
    const now = new Date();
    const dailyData = [];

    const timeDiff = dateRange.to.getTime() - dateRange.from.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

    for (let i = 0; i <= daysDiff; i++) {
      const currentDay = new Date(dateRange.from);
      currentDay.setDate(dateRange.from.getDate() + i);
      const dateString = formatDateString(currentDay);

      const dayEntries = entries.filter(
        (entry) => formatDateString(new Date(entry.start_time)) === dateString
      );

      let totalMinutes = 0;
      dayEntries.forEach((entry) => {
        totalMinutes += entry.duration_minutes;
      });

      let availableMinutes = 0;
      let untrackedMinutes = 0;

      const minutesInFullDay = 24 * 60;

      if (currentDay > now) {
        availableMinutes = 0;
      } else if (formatDateString(currentDay) === formatDateString(now)) {
        const elapsedMinutesToday = now.getHours() * 60 + now.getMinutes();

        const hiddenMinutesToday = hiddenHours.reduce((total, hour) => {
          if (
            hour < now.getHours() ||
            (hour === now.getHours() && now.getMinutes() > 0)
          ) {
            const hiddenHourStart = hour * 60;
            const hiddenHourEnd = Math.min(
              (hour + 1) * 60,
              elapsedMinutesToday
            );
            if (hiddenHourEnd > hiddenHourStart) {
              total += hiddenHourEnd - hiddenHourStart;
            }
          }
          return total;
        }, 0);
        availableMinutes = elapsedMinutesToday - hiddenMinutesToday;
      } else {
        const hiddenMinutesInDay = hiddenHours.length * 60;
        availableMinutes = minutesInFullDay - hiddenMinutesInDay;
      }

      untrackedMinutes = Math.max(0, availableMinutes - totalMinutes);

      dailyData.push({
        day: currentDay.toLocaleDateString(undefined, { weekday: "short" }),
        totalMinutes,
        untrackedMinutes,
        availableMinutes,
        date: currentDay,
      });
    }

    return dailyData;
  }, [entries, hiddenHours, dateRange]);

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
                          ...(todayUntrackedTime.untrackedMinutes > 0
                            ? [
                                {
                                  id: "untracked",
                                  name: "Untracked",
                                  color: "#e5e7eb",
                                  totalMinutes:
                                    todayUntrackedTime.untrackedMinutes,
                                  percentageOfTotal: 0,
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
              Date Range Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <div className="text-3xl font-bold">
                      {formatHoursAndMinutes(dateRangeSummary.totalMinutes)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Total time tracked in range
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xl font-semibold text-muted-foreground">
                      {formatHoursAndMinutes(
                        dateRangeUntrackedTime.untrackedMinutes
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
                      width: `${Math.min(100, dateRangeUntrackedTime.percentageTracked)}%`,
                    }}
                  ></div>
                </div>

                <div className="mt-4 space-y-4">
                  {dateRangeSummary.categories.length > 0 ? (
                    dateRangeSummary.categories.map((cat) => (
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
                      No time entries for selected range
                    </div>
                  )}
                </div>
              </div>

              <div className="h-40">
                {dateRangeSummary.categories.length > 0 ||
                dateRangeUntrackedTime.untrackedMinutes > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPreChart>
                      <Pie
                        data={[
                          ...dateRangeSummary.categories,
                          ...(dateRangeUntrackedTime.untrackedMinutes > 0
                            ? [
                                {
                                  id: "untracked",
                                  name: "Untracked",
                                  color: "#e5e7eb",
                                  totalMinutes:
                                    dateRangeUntrackedTime.untrackedMinutes,
                                  percentageOfTotal: 0,
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
                          ...dateRangeSummary.categories,
                          ...(dateRangeUntrackedTime.untrackedMinutes > 0
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

      {/* Date Range Selector */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span className="text-sm font-medium">Date Range:</span>
            </div>
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-[300px] justify-start text-left font-normal",
                    !dateRange && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {dateRange.from.toLocaleDateString()} -{" "}
                        {dateRange.to.toLocaleDateString()}
                      </>
                    ) : (
                      dateRange.from.toLocaleDateString()
                    )
                  ) : (
                    "Pick a date range"
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={{
                    from: dateRange.from,
                    to: dateRange.to,
                  }}
                  onSelect={(range) => {
                    if (range?.from && range?.to) {
                      const from = new Date(range.from);
                      from.setHours(0, 0, 0, 0);
                      const to = new Date(range.to);
                      to.setHours(23, 59, 59, 999);
                      setDateRange({ from, to });
                      setIsCalendarOpen(false);
                    }
                  }}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>
        </CardContent>
      </Card>

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
                    No time entries for selected range
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Category breakdown by day - advanced chart for detailed analysis */}
      {dateRangeSummary.totalMinutes > 0 && (
        <CategoryDailyBreakdown
          entries={entries}
          categories={categories}
          dateRange={dateRange}
        />
      )}

      {/* Tag summary for the week */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Tags Summary
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
                    Tags used in range
                  </div>
                </div>
                <div className="text-xl font-semibold">
                  {formatHoursAndMinutes(dateRangeSummary.totalMinutes)}
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
                    No tags used in selected range
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

function calculateCategorySummaries(
  entries: TimeEntry[],
  categories: TimeCategory[]
) {
  let totalMinutes = 0;
  entries.forEach((entry) => {
    totalMinutes += entry.duration_minutes;
  });

  const categoriesMap = new Map<string, CategorySummary>();

  categories.forEach((cat) => {
    categoriesMap.set(cat.id, {
      id: cat.id,
      name: cat.name,
      color: cat.color || "#3b82f6",
      totalMinutes: 0,
      percentageOfTotal: 0,
    });
  });

  categoriesMap.set("uncategorized", {
    id: "uncategorized",
    name: "Uncategorized",
    color: "#94a3b8",
    totalMinutes: 0,
    percentageOfTotal: 0,
  });

  entries.forEach((entry) => {
    const categoryId = entry.category_id || "uncategorized";

    if (!categoriesMap.has(categoryId)) return;

    const currentTotal = categoriesMap.get(categoryId)!.totalMinutes;
    const updatedTotal = currentTotal + entry.duration_minutes;

    categoriesMap.set(categoryId, {
      ...categoriesMap.get(categoryId)!,
      totalMinutes: updatedTotal,
      percentageOfTotal: totalMinutes ? (updatedTotal / totalMinutes) * 100 : 0,
    });
  });

  const categoriesArray = Array.from(categoriesMap.values())
    .filter((cat) => cat.totalMinutes > 0)
    .sort((a, b) => b.totalMinutes - a.totalMinutes);

  return {
    totalMinutes,
    categories: categoriesArray,
  };
}

function calculateTagSummaries(entries: TimeEntry[]) {
  const tagsMap = new Map<string, TagSummary>();

  const tagColors = [
    "#3b82f6",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#ec4899",
    "#0ea5e9",
    "#14b8a6",
    "#f97316",
    "#6366f1",
    "#84cc16",
    "#9333ea",
    "#06b6d4",
    "#d946ef",
    "#f43f5e",
  ];

  entries.forEach((entry) => {
    if (!entry.tags) return;

    const entryTags = entry.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);

    if (entryTags.length === 0) return;

    const minutesPerTag = entry.duration_minutes / entryTags.length;

    entryTags.forEach((tagName) => {
      if (
        tagName === "pomodoro" ||
        tagName === "overlap-fix" ||
        tagName === "pomodoro-break"
      ) {
        return;
      }

      if (tagsMap.has(tagName)) {
        const tagData = tagsMap.get(tagName)!;
        tagsMap.set(tagName, {
          ...tagData,
          totalMinutes: tagData.totalMinutes + minutesPerTag,
        });
      } else {
        const colorIndex = tagsMap.size % tagColors.length;
        tagsMap.set(tagName, {
          name: tagName,
          totalMinutes: minutesPerTag,
          percentageOfTotal: 0,
          color: tagColors[colorIndex],
        });
      }
    });
  });

  const totalTagMinutes = Array.from(tagsMap.values()).reduce(
    (total, tag) => total + tag.totalMinutes,
    0
  );

  tagsMap.forEach((tag, tagName) => {
    tagsMap.set(tagName, {
      ...tag,
      percentageOfTotal: totalTagMinutes
        ? (tag.totalMinutes / totalTagMinutes) * 100
        : 0,
    });
  });

  const tagsArray = Array.from(tagsMap.values()).sort(
    (a, b) => b.totalMinutes - a.totalMinutes
  );

  return {
    totalMinutes: totalTagMinutes,
    tags: tagsArray,
  };
}

interface CategoryDailyBreakdownProps {
  entries: TimeEntry[];
  categories: TimeCategory[];
  dateRange: DateRange;
}

function CategoryDailyBreakdown({
  entries,
  categories,
  dateRange,
}: CategoryDailyBreakdownProps) {
  const hiddenHours = useStore(timeFilterStore, (state) => state.hiddenHours);

  const chartData = useMemo(() => {
    const now = new Date();
    const dailyData = [];

    const timeDiff = dateRange.to.getTime() - dateRange.from.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

    const categoryColorMap = new Map<string, string>();
    categories.forEach((cat) => {
      categoryColorMap.set(cat.id, cat.color || "#3b82f6");
    });
    categoryColorMap.set("uncategorized", "#94a3b8");
    categoryColorMap.set("untracked", "#e5e7eb");

    for (let i = 0; i <= daysDiff; i++) {
      const currentDay = new Date(dateRange.from);
      currentDay.setDate(dateRange.from.getDate() + i);
      const dateString = formatDateString(currentDay);

      const dayEntries = entries.filter(
        (entry) => formatDateString(new Date(entry.start_time)) === dateString
      );

      const dataPoint: Record<string, any> = {
        day: currentDay.toLocaleDateString(undefined, { weekday: "short" }),
        date: currentDay,
      };

      categories.forEach((cat) => {
        dataPoint[cat.id] = 0;
      });
      dataPoint["uncategorized"] = 0;

      dayEntries.forEach((entry) => {
        const categoryId = entry.category_id || "uncategorized";
        dataPoint[categoryId] =
          (dataPoint[categoryId] || 0) + entry.duration_minutes;
      });

      let availableMinutes = 0;
      const minutesInFullDay = 24 * 60;

      if (currentDay > now) {
        availableMinutes = 0;
      } else if (formatDateString(currentDay) === formatDateString(now)) {
        const elapsedMinutesToday = now.getHours() * 60 + now.getMinutes();

        const hiddenMinutesToday = hiddenHours.reduce((total, hour) => {
          if (
            hour < now.getHours() ||
            (hour === now.getHours() && now.getMinutes() > 0)
          ) {
            const hiddenHourStart = hour * 60;
            const hiddenHourEnd = Math.min(
              (hour + 1) * 60,
              elapsedMinutesToday
            );
            if (hiddenHourEnd > hiddenHourStart) {
              total += hiddenHourEnd - hiddenHourStart;
            }
          }
          return total;
        }, 0);
        availableMinutes = elapsedMinutesToday - hiddenMinutesToday;
      } else {
        const hiddenMinutesInDay = hiddenHours.length * 60;
        availableMinutes = minutesInFullDay - hiddenMinutesInDay;
      }

      let totalTracked = 0;
      categories.forEach((cat) => {
        totalTracked += dataPoint[cat.id] || 0;
      });
      totalTracked += dataPoint["uncategorized"] || 0;

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
  }, [entries, categories, hiddenHours, dateRange]);

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
