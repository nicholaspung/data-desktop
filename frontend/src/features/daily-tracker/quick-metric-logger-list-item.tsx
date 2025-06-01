import ReusableCard from "@/components/reusable/reusable-card";
import { ProtectedContent } from "@/components/security/protected-content";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Metric } from "@/store/experiment-definitions";
import {
  Calendar,
  CalendarX,
  Check,
  EyeOff,
  Target,
  Edit,
  Save,
  X,
  FileText,
  Loader2,
} from "lucide-react";
import AddMetricModal from "./add-metric-modal";
import { ConfirmDeleteDialog } from "@/components/reusable/confirm-delete-dialog";
import MetricStreakDisplay from "./metric-streak-display";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { ApiService } from "@/services/api";
import { toast } from "sonner";
import { DailyLog } from "@/store/experiment-definitions";
import { format } from "date-fns";
import { addEntry, updateEntry } from "@/store/data-store";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export default function QuickMetricLoggerListItem({
  groupedMetrics,
  isMetricCompleted,
  toggleMetricCompletion,
  toggleCalendarTracking,
  handleDeleteMetric,
  selectedDate = new Date(),
  dailyLogs = [],
}: {
  groupedMetrics: Record<string, Metric[]>;
  isMetricCompleted: (metric: Metric) => boolean;
  toggleMetricCompletion: (metric: Metric) => Promise<void>;
  toggleCalendarTracking: (metric: Metric) => Promise<void>;
  handleDeleteMetric: (metric: Metric) => Promise<void>;
  selectedDate?: Date;
  dailyLogs?: DailyLog[];
}) {
  const [editingMetricId, setEditingMetricId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteValue, setNoteValue] = useState<string>("");
  const [isSubmittingNote, setIsSubmittingNote] = useState<boolean>(false);

  const getMetricValue = (metric: Metric): string => {
    const selectedDateString = format(selectedDate, "yyyy-MM-dd");

    const todayLog = dailyLogs.find((log: DailyLog) => {
      const logDate = new Date(log.date);
      const logDateString = format(logDate, "yyyy-MM-dd");
      return (
        log.metric_id === metric.id && logDateString === selectedDateString
      );
    });

    if (!todayLog) return metric.default_value || "0";

    try {
      return JSON.parse(todayLog.value).toString();
    } catch (e) {
      console.error("Error parsing metric value:", e);
      return todayLog.value;
    }
  };

  const getMetricNote = (metric: Metric): string => {
    const selectedDateString = format(selectedDate, "yyyy-MM-dd");

    const todayLog = dailyLogs.find((log: DailyLog) => {
      const logDate = new Date(log.date);
      const logDateString = format(logDate, "yyyy-MM-dd");
      return (
        log.metric_id === metric.id && logDateString === selectedDateString
      );
    });

    return todayLog?.notes || "";
  };

  const getMetricLog = (metric: Metric): DailyLog | null => {
    const selectedDateString = format(selectedDate, "yyyy-MM-dd");

    const todayLog = dailyLogs.find((log: DailyLog) => {
      const logDate = new Date(log.date);
      const logDateString = format(logDate, "yyyy-MM-dd");
      return (
        log.metric_id === metric.id && logDateString === selectedDateString
      );
    });

    return todayLog || null;
  };

  const startEditing = (metric: Metric) => {
    setEditingMetricId(metric.id);
    setEditValue(getMetricValue(metric));
  };

  const startEditingNote = (metric: Metric) => {
    setEditingNoteId(metric.id);
    setNoteValue(getMetricNote(metric));
  };

  const saveEditedValue = async (metric: Metric) => {
    if (editingMetricId !== metric.id) return;

    setIsSubmitting(true);

    const todayLog = getMetricLog(metric);

    try {
      let parsedValue: any;
      if (
        metric.type === "number" ||
        metric.type === "percentage" ||
        metric.type === "time"
      ) {
        parsedValue = parseFloat(editValue) || 0;
      } else {
        parsedValue = editValue;
      }

      if (todayLog) {
        const response = await ApiService.updateRecord(todayLog.id, {
          ...todayLog,
          value: JSON.stringify(parsedValue),
        });

        if (response) {
          updateEntry(todayLog.id, response, "daily_logs");
          toast.success(`${metric.name} updated successfully`);
        }
      } else {
        const newLog = {
          date: selectedDate,
          metric_id: metric.id,
          value: JSON.stringify(parsedValue),
          notes: "",
        };

        const response = await ApiService.addRecord("daily_logs", newLog);
        if (response) {
          addEntry(response, "daily_logs");
          toast.success(`${metric.name} logged successfully`);
        }
      }
    } catch (error) {
      console.error("Error updating metric value:", error);
      toast.error("Failed to update metric value");
    } finally {
      setIsSubmitting(false);
      setEditingMetricId(null);
    }
  };

  const saveEditedNote = async (metric: Metric) => {
    if (editingNoteId !== metric.id) return;

    setIsSubmittingNote(true);

    const todayLog = getMetricLog(metric);

    try {
      if (todayLog) {
        const response = await ApiService.updateRecord(todayLog.id, {
          ...todayLog,
          notes: noteValue,
        });

        if (response) {
          updateEntry(todayLog.id, response, "daily_logs");
          toast.success(`Note updated for ${metric.name}`);
        }
      } else {
        let defaultValue;
        if (metric.type === "boolean") {
          defaultValue = false;
        } else if (
          metric.type === "number" ||
          metric.type === "percentage" ||
          metric.type === "time"
        ) {
          defaultValue = 0;
        } else {
          defaultValue = "";
        }

        const newLog = {
          date: selectedDate,
          metric_id: metric.id,
          value: JSON.stringify(defaultValue),
          notes: noteValue,
        };

        const response = await ApiService.addRecord("daily_logs", newLog);
        if (response) {
          addEntry(response, "daily_logs");
          toast.success(`Note added for ${metric.name}`);
        }
      }
    } catch (error) {
      console.error("Error updating note:", error);
      toast.error("Failed to update note");
    } finally {
      setIsSubmittingNote(false);
      setEditingNoteId(null);
    }
  };

  const cancelEditing = () => {
    setEditingMetricId(null);
    setEditValue("");
  };

  const cancelEditingNote = () => {
    setEditingNoteId(null);
    setNoteValue("");
  };

  return Object.keys(groupedMetrics)
    .sort()
    .map((category) => (
      <div key={category}>
        <div className="flex items-center gap-2 mb-2">
          <h3 className="font-medium text-lg">{category}</h3>
          <Separator className="flex-1" />
          <Badge variant="outline">{groupedMetrics[category].length}</Badge>
        </div>

        <div className="space-y-2">
          {groupedMetrics[category].map((metric) => {
            const isCompleted = isMetricCompleted(metric);
            const isCalendarTracked = !(metric.schedule_days || []).includes(
              -1
            );
            const hasGoal =
              metric.goal_value !== undefined && metric.goal_type !== undefined;
            const isEditing = editingMetricId === metric.id;
            const isEditingNote = editingNoteId === metric.id;
            const hasNote = getMetricNote(metric).length > 0;

            const renderContent = () => (
              <div className="flex justify-between items-start">
                <div className="flex items-start gap-4">
                  {metric.type === "boolean" ? (
                    <Checkbox
                      checked={isCompleted}
                      onCheckedChange={() => toggleMetricCompletion(metric)}
                      disabled={!metric.active}
                      className="mt-1"
                    />
                  ) : (
                    <div className="w-4" />
                  )}

                  <div>
                    <div className="flex items-center flex-wrap gap-1">
                      <span
                        className={`font-medium ${!metric.active ? "text-muted-foreground" : ""}`}
                      >
                        {metric.name}
                      </span>
                      {!metric.active && (
                        <Badge
                          variant="outline"
                          className="text-xs flex items-center gap-1"
                        >
                          <EyeOff className="h-3 w-3" />
                          Inactive
                        </Badge>
                      )}
                      {isCompleted && (
                        <Badge className="ml-2 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                          <Check className="h-3 w-3 mr-1" />
                          Completed
                        </Badge>
                      )}
                      {hasGoal && (
                        <Badge className="ml-2 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
                          <Target className="h-3 w-3 mr-1" />
                          Has Goal
                        </Badge>
                      )}
                      {hasNote && (
                        <Badge className="ml-2 bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100">
                          <FileText className="h-3 w-3 mr-1" />
                          Has Note
                        </Badge>
                      )}
                    </div>
                    {metric.description && (
                      <div
                        className={`text-xs ${!metric.active ? "text-muted-foreground" : "text-muted-foreground"}`}
                      >
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

                    {/* Show value for non-boolean metrics */}
                    {metric.type !== "boolean" && (
                      <div className="mt-2">
                        {isEditing ? (
                          <div className="flex items-center gap-2">
                            <Input
                              type={
                                metric.type === "number" ||
                                metric.type === "percentage" ||
                                metric.type === "time"
                                  ? "number"
                                  : "text"
                              }
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className="h-8 max-w-[150px]"
                              disabled={isSubmitting}
                              autoFocus
                            />
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => saveEditedValue(metric)}
                                disabled={isSubmitting}
                                className="h-8 w-8"
                              >
                                {isSubmitting ? (
                                  <div className="animate-spin">
                                    <Save className="h-4 w-4" />
                                  </div>
                                ) : (
                                  <Save className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={cancelEditing}
                                disabled={isSubmitting}
                                className="h-8 w-8"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span>
                              Current Value:{" "}
                              <strong>{getMetricValue(metric)}</strong>
                              {metric.unit ? ` ${metric.unit}` : ""}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => startEditing(metric)}
                              disabled={!metric.active}
                              className="h-6 px-2"
                            >
                              <Edit className="h-3 w-3 mr-1" />
                              Edit
                            </Button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Notes section */}
                    <div className="mt-2">
                      {isEditingNote ? (
                        <div className="flex flex-col gap-2 mt-2">
                          <Textarea
                            placeholder="Add a note for today..."
                            value={noteValue}
                            onChange={(e) => setNoteValue(e.target.value)}
                            rows={3}
                            className="min-h-[80px] text-sm"
                            disabled={isSubmittingNote}
                          />
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={cancelEditingNote}
                              disabled={isSubmittingNote}
                            >
                              Cancel
                            </Button>
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => saveEditedNote(metric)}
                              disabled={isSubmittingNote}
                            >
                              {isSubmittingNote ? (
                                <div className="animate-spin mr-1">
                                  <Loader2 className="h-4 w-4" />
                                </div>
                              ) : (
                                <Save className="h-4 w-4 mr-1" />
                              )}
                              Save Note
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          {hasNote ? (
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-6"
                                >
                                  <FileText className="h-3 w-3 mr-1" />
                                  View Note
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-80">
                                <div className="space-y-2">
                                  <h4 className="font-medium text-sm">
                                    Note for{" "}
                                    {format(selectedDate, "MMM d, yyyy")}
                                  </h4>
                                  <p className="text-sm whitespace-pre-wrap">
                                    {getMetricNote(metric)}
                                  </p>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => startEditingNote(metric)}
                                    disabled={!metric.active}
                                    className="w-full mt-2"
                                  >
                                    <Edit className="h-3 w-3 mr-1" />
                                    Edit Note
                                  </Button>
                                </div>
                              </PopoverContent>
                            </Popover>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => startEditingNote(metric)}
                              disabled={!metric.active}
                              className="h-6 px-2"
                            >
                              <FileText className="h-3 w-3 mr-1" />
                              Add Note
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex flex-col items-center gap-1">
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
                      disabled={!metric.active}
                    >
                      {isCalendarTracked
                        ? "Remove from calendar"
                        : "Add to calendar"}
                    </Button>
                  </div>

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
                cardClassName={`mb-2 ${
                  isCompleted ? "bg-green-50 dark:bg-green-950/30" : ""
                } ${!metric.active ? "border-dashed opacity-70" : ""}`}
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
