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
import { Beaker } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useStore } from "@tanstack/react-store";
import dataStore from "@/store/data-store";

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
            }
          />
        );
      })}
    </div>
  );
}
