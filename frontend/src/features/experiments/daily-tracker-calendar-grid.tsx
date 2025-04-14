// Updated version of frontend/src/features/experiments/daily-tracker-calendar-grid.tsx
import ReusableTooltip from "@/components/reusable/reusable-tooltip";
import {
  eachDayOfInterval,
  endOfMonth,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
} from "date-fns";
import { Beaker, Calendar } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useStore } from "@tanstack/react-store";
import dataStore from "@/store/data-store";
import { isMetricScheduledForDate, parseScheduleDays } from "./schedule-utils";

export default function DailyTrackerCalendarGrid({
  currentMonth,
  selectedDate,
  setSelectedDate,
}: {
  currentMonth: Date;
  selectedDate: Date;
  setSelectedDate: React.Dispatch<React.SetStateAction<Date>>;
}) {
  // Access data from the store
  const metricsData = useStore(dataStore, (state) => state.metrics) || [];
  const experimentsData =
    useStore(dataStore, (state) => state.experiments) || [];
  const dailyLogsData = useStore(dataStore, (state) => state.daily_logs) || [];

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

    // Calculate metrics scheduled for this day
    const scheduledMetrics = metricsData.filter((metric: any) => {
      if (!metric.active) return false;

      // Parse schedule days if needed
      const scheduleDays = parseScheduleDays(metric.schedule_days);

      // Create a metric object with parsed schedule days
      const metricWithParsedSchedule = {
        ...metric,
        schedule_days: scheduleDays,
      };

      // Check if metric is scheduled for this day
      return isMetricScheduledForDate(metricWithParsedSchedule, day);
    });

    const scheduledMetricsCount = scheduledMetrics.length;
    const totalMetricsCount = metricsData.filter((m: any) => m.active).length;

    // Get active experiments for this day
    const activeExperiments = experimentsData.filter((exp: any) => {
      const startDate = new Date(exp.start_date);
      const endDate = exp.end_date ? new Date(exp.end_date) : new Date();
      return startDate <= day && endDate >= day && exp.status === "active";
    });

    // Calculate completion percentage for boolean metrics
    const booleanMetrics = scheduledMetrics.filter(
      (m: any) => m.type === "boolean"
    );
    const loggedBooleanMetrics = logsForDay.filter((log: any) => {
      const metric = scheduledMetrics.find((m: any) => m.id === log.metric_id);
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
      scheduledMetricsCount,
      activeExperiments,
      completionPercentage,
      logsExist: logsForDay.length > 0,
    };
  };

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

    // Special styling for days with scheduled metrics
    if (stats.scheduledMetricsCount > 0) {
      className += "bg-blue-50/30 dark:bg-blue-950/30 ";
    }

    return className;
  };

  // Generate days for the current month
  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  return (
    <div className="grid grid-cols-7 gap-1 text-center">
      {/* Weekday headers */}
      {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
        <div key={day} className="py-1 font-medium w-full">
          {day}
        </div>
      ))}

      {/* Days of the month */}
      {daysInMonth.map((day) => {
        const stats = getDayMetricsStats(day);

        return (
          <ReusableTooltip
            key={day.toString()}
            renderTrigger={
              <div
                className={getDayClass(day)}
                onClick={() => {
                  setSelectedDate(day);
                }}
              >
                {/* Day number */}
                <span className="text-sm">{format(day, "d")}</span>

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

                {/* Scheduled metrics indicator */}
                {stats.scheduledMetricsCount > 0 && (
                  <div className="absolute bottom-0.5 left-0.5">
                    <Badge
                      variant="outline"
                      className="h-4 w-4 p-0 flex items-center justify-center bg-blue-100/50 dark:bg-blue-900/50"
                    >
                      <Calendar className="h-2.5 w-2.5" />
                    </Badge>
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
            }
            renderContent={
              <div className="space-y-1">
                <p className="font-medium">
                  {format(day, "EEEE, MMMM d, yyyy")}
                </p>
                <p>
                  {stats.logsExist
                    ? `${stats.loggedMetricsCount} of ${stats.scheduledMetricsCount} metrics logged`
                    : "No logs for this day"}
                </p>

                {/* Scheduled metrics information */}
                <p className="text-sm text-muted-foreground">
                  {stats.scheduledMetricsCount} of {stats.totalMetricsCount}{" "}
                  metrics scheduled
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

                {/* Add info about completion rate */}
                {stats.logsExist && stats.scheduledMetricsCount > 0 && (
                  <div className="pt-1">
                    <p className="text-sm flex items-center">
                      <span className="font-medium">Completion: </span>
                      <span className="ml-1">
                        {Math.round(stats.completionPercentage)}%
                      </span>
                    </p>
                  </div>
                )}
              </div>
            }
          />
        );
      })}
    </div>
  );
}
