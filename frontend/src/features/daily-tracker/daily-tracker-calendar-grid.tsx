import ReusableTooltip from "@/components/reusable/reusable-tooltip";
import {
  eachDayOfInterval,
  endOfMonth,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  endOfWeek,
} from "date-fns";
import { Target } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useStore } from "@tanstack/react-store";
import dataStore from "@/store/data-store";
import { isMetricScheduledForDate, parseScheduleDays } from "./schedule-utils";
import { usePin } from "@/hooks/usePin";
import { Metric } from "@/store/experiment-definitions";
import { FEATURE_ICONS } from "@/lib/icons";

export default function DailyTrackerCalendarGrid({
  currentMonth,
  selectedDate,
  setSelectedDate,
}: {
  currentMonth: Date;
  selectedDate: Date;
  setSelectedDate: React.Dispatch<React.SetStateAction<Date>>;
}) {
  const metricsData = useStore(dataStore, (state) => state.metrics) || [];
  const experimentsData =
    useStore(dataStore, (state) => state.experiments) || [];
  const dailyLogsData = useStore(dataStore, (state) => state.daily_logs) || [];
  const { isUnlocked } = usePin();

  const isLogMeaningful = (log: any, metric: Metric) => {
    if (!log || !metric) return false;

    try {
      const logValue = JSON.parse(log.value);
      const defaultValue = metric.default_value
        ? JSON.parse(metric.default_value)
        : null;

      if (metric.type === "boolean") {
        const hasNotes = log.notes && log.notes.trim().length > 0;
        return logValue === true || hasNotes || logValue !== defaultValue;
      }

      if (
        metric.type === "number" ||
        metric.type === "percentage" ||
        metric.type === "time"
      ) {
        const hasNotes = log.notes && log.notes.trim().length > 0;
        return (
          logValue !== defaultValue ||
          hasNotes ||
          (logValue !== 0 && defaultValue === 0)
        );
      }

      return logValue !== defaultValue && logValue !== "" && logValue !== null;
    } catch (e) {
      console.error("Error parsing log value:", e);
      const defaultValue = metric.default_value || "";
      const hasNotes = log.notes && log.notes.trim().length > 0;
      return (
        hasNotes ||
        (log.value !== defaultValue && log.value !== "" && log.value !== "0")
      );
    }
  };

  const getDayMetricsStats = (day: Date) => {
    const logsForDay = dailyLogsData.filter((log: any) => {
      const logDate = new Date(log.date);
      return isSameDay(logDate, day);
    });

    const meaningfulLogs = logsForDay.filter((log: any) => {
      const metric = metricsData.find((m: any) => m.id === log.metric_id);
      return metric && isLogMeaningful(log, metric);
    });

    const loggedMetricsCount = new Set(
      meaningfulLogs.map((log: any) => log.metric_id)
    ).size;

    const scheduledMetrics = metricsData.filter((metric: Metric) => {
      if (!metric.active) return false;

      const doNotShow = metric.schedule_days
        ? Boolean(metric.schedule_days.find((el) => el === -1))
        : false;

      const scheduleDays = parseScheduleDays(metric.schedule_days);

      const metricWithParsedSchedule = {
        ...metric,
        schedule_days: scheduleDays,
      };

      return doNotShow
        ? false
        : isMetricScheduledForDate(metricWithParsedSchedule, day);
    });

    const metricsWithGoals = scheduledMetrics.filter((metric: Metric) => {
      return (
        metric.goal_value !== undefined &&
        metric.goal_value !== null &&
        metric.goal_type !== undefined &&
        metric.goal_type !== null &&
        !(metric.goal_value === "" || metric.goal_value === "0")
      );
    });

    const goalMetricsCount = metricsWithGoals.length;

    const completedGoals = meaningfulLogs.filter((log: any) => {
      const metric = metricsData.find((m: any) => m.id === log.metric_id);
      if (
        !metric ||
        !metric.goal_value ||
        metric.goal_value === "" ||
        metric.goal_value === "0" ||
        !metric.goal_type
      )
        return false;

      try {
        const logValue = JSON.parse(log.value);
        const goalValue = JSON.parse(metric.goal_value);

        switch (metric.goal_type) {
          case "boolean":
            return logValue === true;
          case "minimum":
            return logValue >= goalValue;
          case "maximum":
            return logValue <= goalValue;
          case "exact":
            return logValue === goalValue;
          default:
            return false;
        }
      } catch (e) {
        console.error(e);
        return false;
      }
    }).length;

    const scheduledMetricsCount = scheduledMetrics.length;
    const totalMetricsCount = metricsData.filter((m: any) => m.active).length;

    const activeExperiments = experimentsData.filter((exp: any) => {
      const startDate = new Date(exp.start_date);
      const endDate = exp.end_date ? new Date(exp.end_date) : new Date();
      return startDate <= day && endDate >= day && exp.status === "active";
    });

    const booleanMetrics = scheduledMetrics.filter(
      (m: any) => m.type === "boolean"
    );
    const loggedBooleanMetrics = meaningfulLogs.filter((log: any) => {
      const metric = scheduledMetrics.find((m: any) => m.id === log.metric_id);
      return metric && metric.type === "boolean";
    });

    const completedBooleanCount = loggedBooleanMetrics.filter((log: any) => {
      try {
        return JSON.parse(log.value) === true;
      } catch {
        return false;
      }
    }).length;

    const completionPercentage =
      booleanMetrics.length > 0
        ? (completedBooleanCount / booleanMetrics.length) * 100
        : 0;

    const goalCompletionPercentage =
      goalMetricsCount > 0 ? (completedGoals / goalMetricsCount) * 100 : 0;

    return {
      loggedMetricsCount,
      totalMetricsCount,
      scheduledMetricsCount,
      activeExperiments,
      completionPercentage,
      logsExist: meaningfulLogs.length > 0,
      goalMetricsCount,
      completedGoals,
      goalCompletionPercentage,
    };
  };

  const getDayClass = (day: Date) => {
    const stats = getDayMetricsStats(day);
    let className =
      "h-14 w-full rounded-md flex flex-col items-center justify-start p-1 relative border ";

    if (!isSameMonth(day, currentMonth)) {
      className += "text-muted-foreground opacity-50 ";
    }

    if (isToday(day)) {
      className += "bg-primary/10 font-bold ";
    }

    if (isSameDay(day, selectedDate)) {
      className += "border-primary border-2 ";
    } else {
      className += "hover:bg-accent/50 cursor-pointer ";
    }

    if (stats.logsExist) {
      className += "border-primary/50 ";
    }

    if (stats.scheduledMetricsCount > 0) {
      className += "bg-blue-50/30 dark:bg-blue-950/30 ";
    }

    return className;
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: startDate, end: endDate });

  return (
    <div className="grid grid-cols-7 gap-1 text-center">
      {/* Weekday headers */}
      {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
        <div key={day} className="py-1 font-medium w-full">
          {day}
        </div>
      ))}

      {/* Days of the month */}
      {days.map((day) => {
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

                {/* Goal completion indicator - if there are goals */}
                {stats.goalMetricsCount > 0 && (
                  <div className="absolute bottom-0.5 right-0.5">
                    <Badge
                      variant="outline"
                      className={cn(
                        "h-4 w-4 p-0 flex items-center justify-center",
                        stats.goalCompletionPercentage >= 100
                          ? "bg-green-100/50 dark:bg-green-900/50"
                          : "bg-amber-100/50 dark:bg-amber-900/50"
                      )}
                    >
                      <Target className="h-3 w-3" />
                    </Badge>
                  </div>
                )}

                {/* Scheduled metrics indicator */}
                {stats.scheduledMetricsCount > 0 && (
                  <div className="absolute bottom-0.5 left-0.5">
                    <Badge
                      variant="outline"
                      className="h-4 w-4 p-0 flex items-center justify-center bg-blue-100/50 dark:bg-blue-900/50"
                    >
                      <FEATURE_ICONS.DAILY_TRACkER className="h-2.5 w-2.5" />
                    </Badge>
                  </div>
                )}

                {/* Active experiments indicator */}
                {stats.activeExperiments.length > 0 && (
                  <div className="absolute top-0.5 right-0.5">
                    <Badge
                      variant="outline"
                      className="h-4 w-4 p-0 flex items-center justify-center bg-primary/20"
                    >
                      <FEATURE_ICONS.EXPERIMENTS className="h-3 w-3" />
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

                {/* Goals information */}
                {stats.goalMetricsCount > 0 && (
                  <p className="text-sm">
                    <Target className="h-3 w-3 inline-block mr-1" />
                    {stats.completedGoals} of {stats.goalMetricsCount} goals
                    completed
                  </p>
                )}

                {/* Scheduled metrics information */}
                <p className="text-sm text-muted-foreground">
                  {stats.scheduledMetricsCount} of {stats.totalMetricsCount}{" "}
                  metrics scheduled
                </p>

                {stats.activeExperiments.length > 0 && (
                  <div className="pt-1">
                    <p className="font-medium flex items-center">
                      <FEATURE_ICONS.EXPERIMENTS className="h-3 w-3 mr-1" />
                      Active Experiments:
                    </p>
                    <ul className="pl-4 text-sm">
                      {stats.activeExperiments.map((exp: any) =>
                        exp.private && !isUnlocked ? (
                          <li key={exp.id}>-</li>
                        ) : (
                          <li key={exp.id}>{exp.name}</li>
                        )
                      )}
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
