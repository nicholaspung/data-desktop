// frontend/src/features/daily-tracker/quick-metric-logger-list-item.tsx
import ReusableCard from "@/components/reusable/reusable-card";
import { ProtectedContent } from "@/components/security/protected-content";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Metric } from "@/store/experiment-definitions";
import { Calendar, CalendarX, Check } from "lucide-react";
import AddMetricModal from "./add-metric-modal";
import { ConfirmDeleteDialog } from "@/components/reusable/confirm-delete-dialog";
import MetricStreakDisplay from "./metric-streak-display";

export default function QuickMetricLoggerListItem({
  groupedMetrics,
  isMetricCompleted,
  toggleMetricCompletion,
  toggleCalendarTracking,
  handleDeleteMetric,
}: {
  groupedMetrics: Record<string, Metric[]>;
  isMetricCompleted: (metric: Metric) => boolean;
  toggleMetricCompletion: (metric: Metric) => Promise<void>;
  toggleCalendarTracking: (metric: Metric) => Promise<void>;
  handleDeleteMetric: (metric: Metric) => Promise<void>;
}) {
  return Object.keys(groupedMetrics)
    .sort()
    .map((category) => (
      <div key={category}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium text-lg">{category}</h3>
          <Badge variant="outline">{groupedMetrics[category].length}</Badge>
        </div>
        <Separator className="mb-4" />

        <div className="space-y-2">
          {groupedMetrics[category].map((metric) => {
            const isCompleted = isMetricCompleted(metric);
            const isCalendarTracked = !(metric.schedule_days || []).includes(
              -1
            );

            const renderContent = () => (
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  {metric.type === "boolean" ? (
                    <Checkbox
                      checked={isCompleted}
                      onCheckedChange={() => toggleMetricCompletion(metric)}
                    />
                  ) : (
                    <div className="w-4" />
                  )}

                  <div>
                    <div className="flex items-center">
                      <span className="font-medium">{metric.name}</span>
                      {isCompleted && (
                        <Badge className="ml-2 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                          <Check className="h-3 w-3 mr-1" />
                          Completed
                        </Badge>
                      )}
                    </div>
                    {metric.description && (
                      <div className="text-xs text-muted-foreground">
                        {metric.description}
                      </div>
                    )}
                    <MetricStreakDisplay
                      metricId={metric.id}
                      metricType={metric.type}
                      size="sm"
                      style="text"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge
                    variant={isCalendarTracked ? "default" : "outline"}
                    className="text-xs"
                  >
                    {isCalendarTracked ? (
                      <Calendar className="h-3 w-3 mr-1" />
                    ) : (
                      <CalendarX className="h-3 w-3 mr-1" />
                    )}
                    {isCalendarTracked ? "Tracked" : "Not tracked"}
                  </Badge>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleCalendarTracking(metric)}
                  >
                    {isCalendarTracked
                      ? "Remove from calendar"
                      : "Add to calendar"}
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
              </div>
            );

            return (
              <ReusableCard
                key={metric.id}
                showHeader={false}
                cardClassName={`mb-2 ${isCompleted ? "bg-green-50 dark:bg-green-950/30" : ""}`}
                contentClassName="p-3"
                content={
                  metric.private ? (
                    <ProtectedContent>{renderContent()}</ProtectedContent>
                  ) : (
                    renderContent()
                  )
                }
              />
            );
          })}
        </div>
      </div>
    ));
}
