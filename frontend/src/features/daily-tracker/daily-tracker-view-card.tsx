import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";
import EditableCellConfirmButtons from "@/components/data-table/editable-cell-confirm-buttons";
import { Badge } from "@/components/ui/badge";
import { Target } from "lucide-react";
import { format } from "date-fns";
import { MetricWithLog } from "@/store/experiment-definitions";
import { ProtectedContent } from "@/components/security/protected-content";
import MetricStreakDisplay from "./metric-streak-display";
import { Progress } from "@/components/ui/progress";
import NumberValueInput from "./number-input-control";
import { FEATURE_ICONS } from "@/lib/icons";

export default function DailyTrackerViewCard({
  metric,
  showNotes,
  saveChanges,
  isScheduled = true,
}: {
  metric: MetricWithLog;
  showNotes: boolean;
  saveChanges: (
    metricId: string,
    key: "value" | "notes",
    value: any
  ) => Promise<void>;
  isScheduled?: boolean;
}) {
  const [notes, setNotes] = useState(metric.notes || "");

  const startDateText = metric.schedule_start_date
    ? format(new Date(metric.schedule_start_date), "MMM d")
    : null;

  const endDateText = metric.schedule_end_date
    ? format(new Date(metric.schedule_end_date), "MMM d")
    : null;

  const hasGoal = 
    metric.goal_value !== undefined && 
    metric.goal_value !== null && 
    metric.goal_type !== undefined && 
    metric.goal_type !== null &&
    !(metric.goal_value === "" || metric.goal_value === "0");

  const getGoalProgress = () => {
    if (!hasGoal) return null;

    switch (metric.goal_type) {
      case "minimum":
        if (
          metric.type === "number" ||
          metric.type === "percentage" ||
          metric.type === "time"
        ) {
          const current = parseFloat(metric.value) || 0;
          const goal = parseFloat(metric.goal_value) || 0;
          return {
            progress: Math.min(100, (current / goal) * 100),
            text: `${current}${metric.type === "percentage" ? "%" : metric.unit ? ` ${metric.unit}` : ""}/${goal}${metric.type === "percentage" ? "%" : metric.unit ? ` ${metric.unit}` : ""} (min)`,
          };
        }
        break;
      case "maximum":
        if (
          metric.type === "number" ||
          metric.type === "percentage" ||
          metric.type === "time"
        ) {
          const current = parseFloat(metric.value) || 0;
          const goal = parseFloat(metric.goal_value) || 0;

          return {
            progress:
              goal === 0 ? 100 : Math.max(0, 100 - (current / goal) * 100),
            text: `${current}${metric.type === "percentage" ? "%" : metric.unit ? ` ${metric.unit}` : ""}/${goal}${metric.type === "percentage" ? "%" : metric.unit ? ` ${metric.unit}` : ""} (max)`,
          };
        }
        break;
      case "exact":
        if (
          metric.type === "number" ||
          metric.type === "percentage" ||
          metric.type === "time"
        ) {
          const current = parseFloat(metric.value) || 0;
          const goal = parseFloat(metric.goal_value) || 0;
          const diff = Math.abs(current - goal);
          const maxDiff = goal * 0.5;
          return {
            progress: Math.max(0, 100 - (diff / maxDiff) * 100),
            text: `${current}${metric.type === "percentage" ? "%" : metric.unit ? ` ${metric.unit}` : ""}/${goal}${metric.type === "percentage" ? "%" : metric.unit ? ` ${metric.unit}` : ""} (exact)`,
          };
        }
        break;
      case "boolean":
        if (metric.type === "boolean") {
          const isComplete = !!metric.value;
          return {
            progress: isComplete ? 100 : 0,
            text: isComplete ? "Completed" : "Not completed",
          };
        }
        break;
    }

    return null;
  };

  const goalProgress = hasGoal ? getGoalProgress() : null;

  const Content = () => (
    <>
      <div className="flex justify-between items-start mb-2">
        <div>
          <h4 className="font-medium flex items-center gap-1">
            {metric.name}
            {!isScheduled && (
              <Badge
                variant="outline"
                className="ml-1 text-xs bg-gray-100 dark:bg-gray-800"
              >
                Unscheduled
              </Badge>
            )}
          </h4>
          <p className="text-sm text-muted-foreground">{metric.description}</p>
        </div>

        {/* Show scheduling badge if schedule is defined */}
        {(metric.schedule_start_date ||
          metric.schedule_end_date ||
          (metric.schedule_days && metric.schedule_days.length > 0)) && (
          <Badge
            variant="outline"
            className="text-xs flex items-center gap-1 bg-blue-50 dark:bg-blue-950"
          >
            <FEATURE_ICONS.DAILY_TRACkER className="h-3 w-3" />
            {startDateText && !endDateText && `From ${startDateText}`}
            {!startDateText && endDateText && `Until ${endDateText}`}
            {startDateText &&
              endDateText &&
              `${startDateText} - ${endDateText}`}
            {!startDateText &&
              !endDateText &&
              metric.schedule_days &&
              `${metric.schedule_days.length === 7 ? "Daily" : "Custom schedule"}`}
          </Badge>
        )}
      </div>

      {/* Display streak information */}
      <MetricStreakDisplay
        metricId={metric.id}
        metricType={metric.type}
        size="sm"
        style="badge"
        className="mb-3"
      />

      {/* Show goal information if available */}
      {hasGoal && (
        <div className="mb-4">
          <div className="flex items-center text-sm mb-1">
            <Target className="h-4 w-4 mr-1 text-blue-500" />
            <span className="font-medium">Goal: </span>
            <span className="ml-1">{goalProgress?.text}</span>
          </div>
          {goalProgress && (
            <Progress
              value={goalProgress.progress}
              className="h-2"
              indicatorClassName={
                goalProgress.progress >= 100
                  ? "bg-green-500"
                  : goalProgress.progress >= 66
                    ? "bg-amber-500"
                    : "bg-red-500"
              }
            />
          )}
        </div>
      )}

      {/* Render appropriate input based on metric type */}
      <div className="mt-4">
        {metric.type === "boolean" ? (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={`metric-${metric.id}`}
              checked={!!metric.value}
              onCheckedChange={(checked) =>
                saveChanges(metric.id, "value", !!checked)
              }
            />
            <Label htmlFor={`metric-${metric.id}`}>Completed</Label>
          </div>
        ) : metric.type === "number" ||
          metric.type === "percentage" ||
          metric.type === "time" ? (
          <div className="space-y-2">
            <Label htmlFor={`metric-${metric.id}`}>
              Value {metric.type === "percentage" ? "(%)" : metric.unit ? `(${metric.unit})` : ""}
            </Label>
            <NumberValueInput
              value={metric.value}
              onChange={(value) => saveChanges(metric.id, "value", value)}
              unit={metric.type === "percentage" ? "%" : metric.unit}
              step={metric.type === "percentage" ? 1 : 1}
              min={0}
              max={metric.type === "percentage" ? 100 : 9999}
            />
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor={`metric-${metric.id}`}>Value</Label>
            <Input
              id={`metric-${metric.id}`}
              value={metric.value}
              onChange={(e) => saveChanges(metric.id, "value", e.target.value)}
            />
          </div>
        )}
      </div>

      {/* Notes field */}
      {showNotes && (
        <div className="mt-4 space-y-2">
          <Label htmlFor={`notes-${metric.id}`}>Notes (Optional)</Label>
          <div className="flex flex-row gap-2 items-center">
            <Input
              id={`notes-${metric.id}`}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes..."
            />
            <EditableCellConfirmButtons
              handleSave={() => saveChanges(metric.id, "notes", notes)}
              handleCancel={() => setNotes(metric.notes || "")}
              isSubmitting={false}
            />
          </div>
        </div>
      )}
      {!showNotes && metric.notes && <div className="mt-2">{metric.notes}</div>}
    </>
  );

  return (
    <Card
      className={`
        ${!!metric.value && metric.log ? "border-green-500 border" : ""}
        ${!isScheduled ? "border-dashed border-gray-300 bg-gray-50 dark:bg-gray-900" : ""}
        ${hasGoal && goalProgress?.progress === 100 ? "border-green-500 border-2" : ""}
      `}
    >
      <CardContent className="p-4">
        {metric.private ? (
          <ProtectedContent>
            <Content />
          </ProtectedContent>
        ) : (
          <Content />
        )}
      </CardContent>
    </Card>
  );
}
