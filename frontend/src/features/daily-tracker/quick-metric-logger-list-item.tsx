import ReusableCard from "@/components/reusable/reusable-card";
import { ProtectedContent } from "@/components/security/protected-content";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Metric } from "@/store/experiment-definitions";
import { Calendar, CalendarX } from "lucide-react";
import AddMetricModal from "./add-metric-modal";
import { ConfirmDeleteDialog } from "@/components/reusable/confirm-delete-dialog";

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
  const renderCardContent = (
    isCompleted: boolean,
    metric: Metric,
    isCalendarTracked: boolean
  ) => (
    <ReusableCard
      showHeader={false}
      cardClassName={`mb-2 ${isCompleted ? "bg-green-50 dark:bg-green-950/30" : ""}`}
      contentClassName="p-3 flex justify-between items-center"
      content={
        <>
          <div className="flex items-center gap-2">
            {metric.type === "boolean" ? (
              <Checkbox
                checked={isCompleted}
                onCheckedChange={() => toggleMetricCompletion(metric)}
              />
            ) : (
              <div className="w-4" />
            )}

            <div>
              <div className="font-medium">{metric.name}</div>
              {metric.description && (
                <div className="text-xs text-muted-foreground">
                  {metric.description}
                </div>
              )}
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
              {isCalendarTracked ? "Remove from calendar" : "Add to calendar"}
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
        </>
      }
    />
  );

  return Object.keys(groupedMetrics)
    .sort()
    .map((category) => (
      <div key={category}>
        <h3 className="font-medium text-lg mb-2">{category}</h3>
        {groupedMetrics[category].map((metric) => {
          const isCompleted = isMetricCompleted(metric);
          const isCalendarTracked = !(metric.schedule_days || []).includes(-1);

          return metric.private ? (
            <ProtectedContent>
              {renderCardContent(isCompleted, metric, isCalendarTracked)}
            </ProtectedContent>
          ) : (
            renderCardContent(isCompleted, metric, isCalendarTracked)
          );
        })}
      </div>
    ));
}
