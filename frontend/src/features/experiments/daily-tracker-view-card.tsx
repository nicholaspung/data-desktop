// Updated version of frontend/src/features/experiments/daily-tracker-view-card.tsx
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";
import EditableCellConfirmButtons from "@/components/data-table/editable-cell-confirm-buttons";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { MetricWithLog } from "@/store/experiment-definitions";

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

  // Format start and end dates for display
  const startDateText = metric.schedule_start_date
    ? format(new Date(metric.schedule_start_date), "MMM d")
    : null;

  const endDateText = metric.schedule_end_date
    ? format(new Date(metric.schedule_end_date), "MMM d")
    : null;

  return (
    <Card
      className={`
        ${!!metric.value && metric.log ? "border-green-500 border" : ""}
        ${!isScheduled ? "border-dashed border-gray-300 bg-gray-50 dark:bg-gray-900" : ""}
      `}
    >
      <CardContent className="p-4">
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
            <p className="text-sm text-muted-foreground">
              {metric.description}
            </p>
          </div>

          {/* Show scheduling badge if schedule is defined */}
          {(metric.schedule_start_date ||
            metric.schedule_end_date ||
            (metric.schedule_days && metric.schedule_days.length > 0)) && (
            <Badge
              variant="outline"
              className="text-xs flex items-center gap-1 bg-blue-50 dark:bg-blue-950"
            >
              <CalendarIcon className="h-3 w-3" />
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
                Value {metric.unit ? `(${metric.unit})` : ""}
              </Label>
              <Input
                id={`metric-${metric.id}`}
                type="number"
                value={metric.value}
                onChange={(e) =>
                  saveChanges(
                    metric.id,
                    "value",
                    parseFloat(e.target.value) || 0
                  )
                }
              />
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor={`metric-${metric.id}`}>Value</Label>
              <Input
                id={`metric-${metric.id}`}
                value={metric.value}
                onChange={(e) =>
                  saveChanges(metric.id, "value", e.target.value)
                }
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
        {!showNotes && metric.notes && (
          <div className="mt-2">{metric.notes}</div>
        )}
      </CardContent>
    </Card>
  );
}
