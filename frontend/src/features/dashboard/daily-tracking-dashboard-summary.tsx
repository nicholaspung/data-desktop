// src/features/dashboard/daily-metrics-summary.tsx
import { useState, useEffect } from "react";
import { useStore } from "@tanstack/react-store";
import { format } from "date-fns";
import { CalendarCheck, ArrowRight, CheckCircle2, Circle } from "lucide-react";
import { Link } from "@tanstack/react-router";
import dataStore from "@/store/data-store";
import {
  isMetricScheduledForDate,
  parseScheduleDays,
} from "@/features/daily-tracker/schedule-utils";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Metric, DailyLog } from "@/store/experiment-definitions";
import { ProtectedField } from "@/components/security/protected-content";

export default function DailyTrackingDashboardSummary() {
  const [todaysMetrics, setTodaysMetrics] = useState<
    Array<{
      metric: Metric;
      isCompleted: boolean;
      log: DailyLog | null;
    }>
  >([]);

  const metrics = useStore(dataStore, (state) => state.metrics) || [];
  const dailyLogs = useStore(dataStore, (state) => state.daily_logs) || [];

  const today = new Date();

  useEffect(() => {
    // Filter metrics that should be visible today
    const metricsForToday = metrics.filter((metric: Metric) => {
      if (!metric.active) return false;

      // Skip metrics that are marked as "do not show in calendar"
      const doNotShow = metric.schedule_days
        ? Boolean(metric.schedule_days.find((el) => el === -1))
        : false;

      if (doNotShow) return false;

      // Parse schedule days
      const scheduleDays = parseScheduleDays(metric.schedule_days);

      // Create a metric object with parsed schedule days
      const metricWithParsedSchedule = {
        ...metric,
        schedule_days: scheduleDays,
      };

      // Check if metric is scheduled for today
      return isMetricScheduledForDate(metricWithParsedSchedule, today);
    });

    // Find completion status for each metric
    const metricsWithStatus = metricsForToday.map((metric) => {
      const todayLogs = dailyLogs.filter((log: DailyLog) => {
        const logDate = new Date(log.date);
        return (
          format(logDate, "yyyy-MM-dd") === format(today, "yyyy-MM-dd") &&
          log.metric_id === metric.id
        );
      });

      const log = todayLogs.length > 0 ? todayLogs[0] : null;
      let isCompleted = false;

      if (log) {
        // For boolean metrics, check if value is true
        if (metric.type === "boolean") {
          try {
            isCompleted = JSON.parse(log.value) === true;
          } catch (e) {
            console.error(e);
            isCompleted = log.value === "true";
          }
        } else {
          // For other metrics, consider them completed if there's a log
          isCompleted = true;
        }
      }

      return {
        metric,
        isCompleted,
        log,
      };
    });

    setTodaysMetrics(metricsWithStatus);
  }, [metrics, dailyLogs]);

  const completedCount = todaysMetrics.filter(
    (item) => item.isCompleted
  ).length;
  const totalCount = todaysMetrics.length;
  const completionPercentage =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="border rounded-lg p-4 bg-card">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <CalendarCheck className="h-5 w-5 mr-2 text-primary" />
          <h3 className="font-medium text-lg">Today's Metrics</h3>
        </div>
        <Badge variant={completionPercentage === 100 ? "success" : "outline"}>
          {completedCount}/{totalCount} completed
        </Badge>
      </div>

      <Separator className="my-2" />

      {todaysMetrics.length === 0 ? (
        <div className="py-8 text-center text-muted-foreground">
          <p>No metrics scheduled for today</p>
          <p className="text-sm mt-1">Add metrics in the Daily Tracker</p>
        </div>
      ) : (
        <div className="space-y-2 mt-3 max-h-64 overflow-y-auto">
          {todaysMetrics.map(({ metric, isCompleted }) => (
            <div
              key={metric.id}
              className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50"
            >
              <div className="flex items-center">
                {metric.type === "boolean" ? (
                  isCompleted ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground mr-2" />
                  )
                ) : (
                  <div className="h-5 w-5 mr-2 flex items-center justify-center">
                    {isCompleted ? "✓" : "○"}
                  </div>
                )}
                <span
                  className={
                    isCompleted ? "line-through text-muted-foreground" : ""
                  }
                >
                  {metric.private ? (
                    <ProtectedField>{metric.name}</ProtectedField>
                  ) : (
                    metric.name
                  )}
                </span>
              </div>
              {metric.category_id_data && (
                <Badge variant="outline" className="text-xs">
                  {metric.category_id_data.name}
                </Badge>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-4">
        <Link to="/calendar">
          <Button variant="outline" className="w-full">
            Go to Daily Tracker
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
