import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@radix-ui/react-checkbox";
import { MetricWithLog } from "./experiments";
import { useState } from "react";
import EditableCellConfirmButtons from "@/components/data-table/editable-cell-confirm-buttons";

export default function DailyTrackerViewCard({
  metric,
  showNotes,
  saveChanges,
}: {
  metric: MetricWithLog;
  showNotes: boolean;
  saveChanges: (
    metricId: string,
    key: "value" | "notes",
    value: any
  ) => Promise<void>;
}) {
  const [notes, setNotes] = useState(metric.notes || "");

  return (
    <Card
      className={!!metric.value && metric.log ? "border-green-500 border" : ""}
    >
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h4 className="font-medium">{metric.name}</h4>
            <p className="text-sm text-muted-foreground">
              {metric.description}
            </p>
          </div>
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
