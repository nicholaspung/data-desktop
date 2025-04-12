// src/features/experiments/daily-tracker-calendar-view.tsx
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  CheckCircle,
  Beaker,
} from "lucide-react";
import {
  addMonths,
  subMonths,
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isToday,
  isSameMonth,
} from "date-fns";
import { useStore } from "@tanstack/react-store";
import dataStore from "@/store/data-store";
import loadingStore from "@/store/loading-store";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import DailyTrackerNavigation from "./daily-tracker-navigation";
import DailyTrackerViewCard from "./daily-tracker-view-card";
import { parseMetricValue } from "./experiments-utils";
import { MetricWithLog } from "./experiments";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ApiService } from "@/services/api";

export default function DailyTrackerCalendarView() {
  // State for calendar navigation
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [metricsWithLogs, setMetricsWithLogs] = useState<MetricWithLog[]>([]);
  const [view, setView] = useState<"calendar" | "list">("calendar");

  // Access data from the store
  const metricsData = useStore(dataStore, (state) => state.metrics) || [];
  const experimentsData =
    useStore(dataStore, (state) => state.experiments) || [];
  const experimentMetricsData =
    useStore(dataStore, (state) => state.experiment_metrics) || [];
  const dailyLogsData = useStore(dataStore, (state) => state.daily_logs) || [];

  // Loading state
  const metricsLoading =
    useStore(loadingStore, (state) => state.metrics) || false;
  const dailyLogsLoading =
    useStore(loadingStore, (state) => state.daily_logs) || false;

  // Navigation functions
  const goToPreviousMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const goToNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const goToToday = () => {
    setCurrentMonth(new Date());
    setSelectedDate(new Date());
  };

  // Effect to process logs for selected date
  useEffect(() => {
    if (metricsData.length > 0) {
      processLogsForSelectedDate(selectedDate, dailyLogsData);
    }
  }, [dailyLogsData, selectedDate, metricsData]);

  // Process logs for the selected date
  const processLogsForSelectedDate = (
    date: Date,
    logs: Record<string, any>[] = dailyLogsData
  ) => {
    // Filter logs for the selected date
    const logsForDate = logs.filter((log) => {
      const logDate = new Date(log.date);
      return isSameDay(logDate, date);
    });

    // Map logs to metrics
    const metricsWithLogsArray = (metricsData as any[]).map((metric) => {
      const log = logsForDate.find((log) => log.metric_id === metric.id);
      return {
        ...metric,
        log: log || null,
        // Parse the value based on metric type
        value: log
          ? parseMetricValue(log.value, metric.type)
          : parseMetricValue(metric.default_value, metric.type),
        notes: log?.notes || "",
        hasChanged: false,
      };
    });

    // Sort by category and then by name
    metricsWithLogsArray.sort((a, b) => {
      // First sort by category
      const catA = a.category_id_data?.name || "";
      const catB = b.category_id_data?.name || "";
      if (catA !== catB) return catA.localeCompare(catB);

      // Then by metric name
      return a.name.localeCompare(b.name);
    });

    setMetricsWithLogs(metricsWithLogsArray as MetricWithLog[]);
  };

  // Save changes to a metric log
  const saveChanges = async (
    metricId: string,
    key: "value" | "notes",
    value: any
  ) => {
    try {
      const metricWithLogs = metricsWithLogs.find((el) => el.id === metricId);
      if (metricWithLogs) {
        const experimentMetric = experimentMetricsData.filter(
          (el: any) => el.metric_id === metricId
        );
        if (metricWithLogs.log) {
          // Update existing log
          const response = await ApiService.updateRecord(
            metricWithLogs.log.id,
            {
              ...metricWithLogs.log,
              value:
                key === "value"
                  ? JSON.stringify(value)
                  : metricWithLogs.log.value,
              notes: key === "notes" ? value : metricWithLogs.log.notes,
              experiment_id: experimentMetric.length
                ? experimentMetric[0].experiment_id
                : null,
            }
          );

          // Update store with response
          if (response) {
            processLogsForSelectedDate(selectedDate);
            toast.success("Log updated successfully");
          }
        } else {
          const newLog = {
            date: selectedDate,
            metric_id: metricId,
            experiment_id: experimentMetric.length
              ? experimentMetric[0].experiment_id
              : null,
            value:
              key === "value"
                ? JSON.stringify(value)
                : JSON.stringify(metricWithLogs.value),
            notes: key === "notes" ? value : metricWithLogs.notes,
          };

          const response = await ApiService.addRecord("daily_logs", newLog);
          if (response) {
            processLogsForSelectedDate(selectedDate);
            toast.success("Log created successfully");
          }
        }
      }
    } catch (error) {
      console.error("Error saving daily log:", error);
      toast.error("Failed to save daily log");
    }
  };

  // Calculate metrics stats for a day
  const getDayMetricsStats = (day: Date) => {
    const logsForDay = dailyLogsData.filter((log: any) => {
      const logDate = new Date(log.date);
      return isSameDay(logDate, day);
    });

    // Calculate logged metrics count vs total metrics
    const loggedMetricsCount = new Set(
      logsForDay.map((log: any) => log.metric_id)
    ).size;
    const totalMetricsCount = metricsData.length;

    // Get active experiments for this day
    const activeExperiments = experimentsData.filter((exp: any) => {
      const startDate = new Date(exp.start_date);
      const endDate = exp.end_date ? new Date(exp.end_date) : new Date();
      return startDate <= day && endDate >= day && exp.status === "active";
    });

    // Calculate completion percentage for boolean metrics
    const booleanMetrics = metricsData.filter((m: any) => m.type === "boolean");
    const loggedBooleanMetrics = logsForDay.filter((log: any) => {
      const metric = metricsData.find((m: any) => m.id === log.metric_id);
      return metric && metric.type === "boolean";
    });

    // For boolean metrics, check how many are marked as true
    const completedBooleanCount = loggedBooleanMetrics.filter((log: any) => {
      try {
        return JSON.parse(log.value) === true;
      } catch {
        return false;
      }
    }).length;

    // Calculate completion percentage
    const completionPercentage =
      booleanMetrics.length > 0
        ? (completedBooleanCount / booleanMetrics.length) * 100
        : 0;

    return {
      loggedMetricsCount,
      totalMetricsCount,
      activeExperiments,
      completionPercentage,
      logsExist: logsForDay.length > 0,
    };
  };

  // Generate days for the current month
  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  // Determine class for each day cell
  const getDayClass = (day: Date) => {
    const stats = getDayMetricsStats(day);
    let className =
      "h-14 w-full rounded-md flex flex-col items-center justify-start p-1 relative border ";

    // Base styling depending on whether the day is in the current month
    if (!isSameMonth(day, currentMonth)) {
      className += "text-muted-foreground opacity-50 ";
    }

    // Today styling
    if (isToday(day)) {
      className += "bg-primary/10 font-bold ";
    }

    // Selected day styling
    if (isSameDay(day, selectedDate)) {
      className += "border-primary border-2 ";
    } else {
      className += "hover:bg-accent/50 cursor-pointer ";
    }

    // Styling based on logs
    if (stats.logsExist) {
      className += "border-primary/50 ";
    }

    return className;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Daily Tracking Calendar</CardTitle>
          <div className="flex gap-2">
            <Tabs
              defaultValue={view}
              onValueChange={(v) => setView(v as "calendar" | "list")}
            >
              <TabsList>
                <TabsTrigger value="calendar">
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  Calendar
                </TabsTrigger>
                <TabsTrigger value="list">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Details
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {metricsLoading || dailyLogsLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-4">
            {view === "calendar" ? (
              <>
                {/* Calendar navigation */}
                <div className="flex justify-between items-center mb-2">
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={goToPreviousMonth}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" onClick={goToToday}>
                      Today
                    </Button>
                    <Button variant="outline" onClick={goToNextMonth}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                  <h2 className="text-xl font-semibold">
                    {format(currentMonth, "MMMM yyyy")}
                  </h2>
                </div>

                {/* Calendar grid */}
                <div className="grid grid-cols-7 gap-1 text-center">
                  {/* Weekday headers */}
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                    (day) => (
                      <div key={day} className="py-1 font-medium w-full">
                        {day}
                      </div>
                    )
                  )}

                  {/* Days of the month */}
                  {daysInMonth.map((day) => {
                    const stats = getDayMetricsStats(day);

                    return (
                      <TooltipProvider key={day.toString()}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div
                              className={getDayClass(day)}
                              onClick={() => {
                                setSelectedDate(day);
                              }}
                            >
                              {/* Day number */}
                              <span className="text-sm">
                                {format(day, "d")}
                              </span>

                              {/* Metrics completion indicator */}
                              {stats.logsExist && (
                                <div className="mt-1 w-full">
                                  <Progress
                                    value={stats.completionPercentage}
                                    className="h-1"
                                    indicatorClassName={cn(
                                      stats.completionPercentage >= 75
                                        ? "bg-green-500"
                                        : stats.completionPercentage >= 50
                                          ? "bg-yellow-500"
                                          : stats.completionPercentage > 0
                                            ? "bg-orange-500"
                                            : "bg-red-500"
                                    )}
                                  />
                                </div>
                              )}

                              {/* Active experiments indicator */}
                              {stats.activeExperiments.length > 0 && (
                                <div className="absolute bottom-0.5 right-0.5">
                                  <Badge
                                    variant="outline"
                                    className="h-4 w-4 p-0 flex items-center justify-center bg-primary/20"
                                  >
                                    <Beaker className="h-3 w-3" />
                                  </Badge>
                                </div>
                              )}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="space-y-1">
                              <p className="font-medium">
                                {format(day, "EEEE, MMMM d, yyyy")}
                              </p>
                              <p>
                                {stats.logsExist
                                  ? `${stats.loggedMetricsCount} of ${stats.totalMetricsCount} metrics logged`
                                  : "No logs for this day"}
                              </p>

                              {stats.activeExperiments.length > 0 && (
                                <div className="pt-1">
                                  <p className="font-medium flex items-center">
                                    <Beaker className="h-3 w-3 mr-1" />
                                    Active Experiments:
                                  </p>
                                  <ul className="pl-4 text-sm">
                                    {stats.activeExperiments.map((exp: any) => (
                                      <li key={exp.id}>{exp.name}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="flex gap-4 text-sm text-muted-foreground pt-2">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-primary/10 border border-primary rounded-sm mr-1"></div>
                    <span>Today</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 border border-primary/50 rounded-sm mr-1"></div>
                    <span>Has Logs</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 border flex items-center justify-center rounded-sm mr-1">
                      <Beaker className="h-2 w-2" />
                    </div>
                    <span>Active Experiment</span>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Detail view for the selected day */}
                <DailyTrackerNavigation
                  selectedDate={selectedDate}
                  setSelectedDate={setSelectedDate}
                />

                {/* Group metrics by category */}
                <ScrollArea className="h-[600px] pr-4">
                  {metricsWithLogs.length === 0 ? (
                    <div className="text-center p-8">
                      <p className="text-muted-foreground">
                        No metrics defined yet.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Group metrics by category */}
                      {Array.from(
                        new Set(
                          metricsWithLogs.map(
                            (m) => m.category_id_data?.name || "Uncategorized"
                          )
                        )
                      ).map((category) => (
                        <div key={category} className="space-y-4">
                          <h3 className="text-lg font-semibold">{category}</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {metricsWithLogs
                              .filter(
                                (m) =>
                                  (m.category_id_data?.name ||
                                    "Uncategorized") === category
                              )
                              .map((metric) => (
                                <DailyTrackerViewCard
                                  key={metric.id}
                                  metric={metric}
                                  showNotes={true}
                                  saveChanges={saveChanges}
                                />
                              ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
