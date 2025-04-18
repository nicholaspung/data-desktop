// frontend/src/features/daily-tracker/quick-metric-logger-card-item.tsx
import ReusableCard from "@/components/reusable/reusable-card";
import { ProtectedContent } from "@/components/security/protected-content";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { DailyLog, Metric } from "@/store/experiment-definitions";
import { format } from "date-fns";
import { Calendar, CalendarX, CheckCircle, Circle } from "lucide-react";
import AddMetricModal from "./add-metric-modal";
import { ConfirmDeleteDialog } from "@/components/reusable/confirm-delete-dialog";
import MetricStreakDisplay from "./metric-streak-display";

export default function QuickMetricLoggerCardItem({
  groupedMetrics,
  isMetricCompleted,
  toggleMetricCompletion,
  toggleCalendarTracking,
  dailyLogs,
  selectedDate,
  handleDeleteMetric,
}: {
  groupedMetrics: Record<string, Metric[]>;
  isMetricCompleted: (metric: Metric) => boolean;
  toggleMetricCompletion: (metric: Metric) => Promise<void>;
  toggleCalendarTracking: (metric: Metric) => Promise<void>;
  dailyLogs: DailyLog[];
  selectedDate: Date;
  handleDeleteMetric: (metric: Metric) => Promise<void>;
}) {
  // Get the current value for a metric on the selected date
  const getMetricValue = (metric: Metric) => {
    const todayLog = dailyLogs.find(
      (log: DailyLog) =>
        log.metric_id === metric.id &&
        format(new Date(log.date), "yyyy-MM-dd") ===
          format(selectedDate, "yyyy-MM-dd")
    );

    if (!todayLog) return null;

    try {
      return JSON.parse(todayLog.value);
    } catch (e) {
      console.error(e);
      return todayLog.value;
    }
  };

  // Render the content of a card
  const renderCardContent = (
    metric: Metric,
    isCompleted: boolean,
    isCalendarTracked: boolean
  ) => (
    <>
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          {metric.type === "boolean" ? (
            <Button
              size="sm"
              variant={isCompleted ? "default" : "outline"}
              className="h-8 w-8 p-0 rounded-full"
              onClick={() => toggleMetricCompletion(metric)}
            >
              {isCompleted ? (
                <CheckCircle className="h-5 w-5" />
              ) : (
                <Circle className="h-5 w-5" />
              )}
            </Button>
          ) : (
            <div className="h-8 w-8 flex items-center justify-center text-sm font-medium">
              {getMetricValue(metric) ?? "—"}
              {metric.unit ? ` ${metric.unit}` : ""}
            </div>
          )}

          <div>
            <div className="font-medium">{metric.name}</div>
            <div className="text-xs text-muted-foreground">
              {metric.description}
            </div>
          </div>
        </div>

        <Button
          size="sm"
          variant="ghost"
          className="h-7 w-7 p-0 rounded-full"
          onClick={() => toggleCalendarTracking(metric)}
        >
          {isCalendarTracked ? (
            <Calendar className="h-4 w-4 text-primary" />
          ) : (
            <CalendarX className="h-4 w-4 text-muted-foreground" />
          )}
        </Button>
        <div className="space-x-1">
          <AddMetricModal
            metric={metric}
            buttonVariant="ghost"
            buttonSize="icon"
            showIcon={true}
          />

          <ConfirmDeleteDialog
            onConfirm={() => handleDeleteMetric(metric)}
            triggerText=""
            title="Delete Metric"
            description={`Are you sure you want to delete "${metric.name}"? This action cannot be undone.`}
            size="icon"
            variant="ghost"
          />
        </div>
      </div>

      {/* Add streak display */}
      <MetricStreakDisplay
        metricId={metric.id}
        metricType={metric.type}
        size="sm"
        className="mt-1 mb-1"
      />

      <div className="mt-2 text-xs flex items-center justify-between">
        <Badge
          variant={
            metric.type === "boolean"
              ? isCompleted
                ? "success"
                : "outline"
              : "outline"
          }
        >
          {metric.type === "boolean"
            ? isCompleted
              ? "Completed"
              : "Incomplete"
            : metric.type}
        </Badge>
        <span className="text-muted-foreground">
          {isCalendarTracked ? "Shows in calendar" : "Hidden from calendar"}
        </span>
      </div>
    </>
  );

  return Object.keys(groupedMetrics)
    .sort()
    .map((category) => (
      <div key={category} className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <h3 className="font-medium text-lg">{category}</h3>
          <Separator className="flex-1" />
          <Badge variant="outline">{groupedMetrics[category].length}</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {groupedMetrics[category].map((metric) => {
            const isCompleted = isMetricCompleted(metric);
            const isCalendarTracked = !(metric.schedule_days || []).includes(
              -1
            );

            return (
              <ReusableCard
                key={metric.id}
                showHeader={false}
                cardClassName={`${isCompleted ? "bg-green-50 dark:bg-green-950/30" : ""} ${metric.private ? "border-amber-300" : ""}`}
                contentClassName="p-3"
                content={
                  metric.private ? (
                    <ProtectedContent>
                      {renderCardContent(
                        metric,
                        isCompleted,
                        isCalendarTracked
                      )}
                    </ProtectedContent>
                  ) : (
                    renderCardContent(metric, isCompleted, isCalendarTracked)
                  )
                }
              />
            );
          })}
        </div>
      </div>
    ));
}
