import ReusableCard from "@/components/reusable/reusable-card";
import { ProtectedContent } from "@/components/security/protected-content";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
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
  Eye,
} from "lucide-react";
import AddMetricModal from "./add-metric-modal";
import { ConfirmDeleteDialog } from "@/components/reusable/confirm-delete-dialog";
import MetricStreakDisplay from "./metric-streak-display";
import { useState, useEffect, useRef, useCallback, memo } from "react";
import { Input } from "@/components/ui/input";
import { ApiService } from "@/services/api";
import { toast } from "sonner";
import { DailyLog } from "@/store/experiment-definitions";
import { format } from "date-fns";
import { addEntry, updateEntry } from "@/store/data-store";
import { getMetricDisplayUnit } from "@/lib/utils";
import dataStore from "@/store/data-store";
import { useStore } from "@tanstack/react-store";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import MetricNoteEditor from "./metric-note-editor";

const MetricLoggerListItem = memo(function MetricLoggerListItem({
  groupedMetrics,
  isMetricCompleted,
  toggleMetricCompletion,
  toggleCalendarTracking,
  toggleMetricActiveStatus,
  handleDeleteMetric,
  selectedDate = new Date(),
  dailyLogs = [],
  minimalView = false,
}: {
  groupedMetrics: Record<string, Metric[]>;
  isMetricCompleted: (metric: Metric) => boolean;
  toggleMetricCompletion: (metric: Metric) => Promise<void>;
  toggleCalendarTracking: (metric: Metric) => Promise<void>;
  toggleMetricActiveStatus: (metric: Metric) => Promise<void>;
  handleDeleteMetric: (metric: Metric) => Promise<void>;
  selectedDate?: Date;
  dailyLogs?: DailyLog[];
  minimalView?: boolean;
}) {
  const [editingMetricId, setEditingMetricId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteValue, setNoteValue] = useState<string>("");
  const [isSubmittingNote, setIsSubmittingNote] = useState<boolean>(false);

  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const noteDebounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const experimentMetrics =
    useStore(dataStore, (state) => state.experiment_metrics) || [];
  const experiments = useStore(dataStore, (state) => state.experiments) || [];

  const findExperimentForMetric = (metricId: string): string | undefined => {
    const metricExperiments = experimentMetrics.filter(
      (em) => em.metric_id === metricId
    );

    const activeExperiments = experiments.filter(
      (exp) => exp.status === "active"
    );

    const activeExperimentMetric = metricExperiments.find((em) =>
      activeExperiments.some((exp) => exp.id === em.experiment_id)
    );

    return activeExperimentMetric?.experiment_id;
  };

  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      if (noteDebounceTimeoutRef.current) {
        clearTimeout(noteDebounceTimeoutRef.current);
      }
    };
  }, []);

  const debouncedSave = (metric: Metric, value: string) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      saveEditedValue(metric, value);
    }, 1000);
  };

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

  const startEditingNote = useCallback((metric: Metric) => {
    setEditingNoteId(metric.id);
    setNoteValue(getMetricNote(metric));
  }, [dailyLogs, selectedDate]);

  const handleNoteChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNoteValue(e.target.value);
  }, []);

  const saveEditedValue = async (metric: Metric, valueToSave?: string) => {
    if (editingMetricId !== metric.id) return;

    const valueToUse = valueToSave ?? editValue;
    setIsSubmitting(true);

    const todayLog = getMetricLog(metric);

    try {
      let parsedValue: any;
      if (
        metric.type === "number" ||
        metric.type === "percentage" ||
        metric.type === "time"
      ) {
        parsedValue = parseFloat(valueToUse) || 0;
      } else {
        parsedValue = valueToUse;
      }

      if (todayLog) {
        const experimentId = findExperimentForMetric(metric.id);
        const response = await ApiService.updateRecord(todayLog.id, {
          ...todayLog,
          value: JSON.stringify(parsedValue),
          experiment_id: experimentId,
        });

        if (response) {
          updateEntry(todayLog.id, response, "daily_logs");
          toast.success(`${metric.name} updated successfully`);
        }
      } else {
        const experimentId = findExperimentForMetric(metric.id);
        const newLog = {
          date: selectedDate,
          metric_id: metric.id,
          experiment_id: experimentId,
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
        const experimentId = findExperimentForMetric(metric.id);
        const response = await ApiService.updateRecord(todayLog.id, {
          ...todayLog,
          notes: noteValue,
          experiment_id: experimentId,
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

        const experimentId = findExperimentForMetric(metric.id);
        const newLog = {
          date: selectedDate,
          metric_id: metric.id,
          experiment_id: experimentId,
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
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    setEditingMetricId(null);
    setEditValue("");
  };

  const cancelEditingNote = useCallback(() => {
    if (noteDebounceTimeoutRef.current) {
      clearTimeout(noteDebounceTimeoutRef.current);
    }
    setEditingNoteId(null);
    setNoteValue("");
  }, []);



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
              metric.goal_value !== undefined &&
              metric.goal_value !== null &&
              metric.goal_type !== undefined &&
              metric.goal_type !== null &&
              !(metric.goal_value === "" || metric.goal_value === "0");
            const isEditing = editingMetricId === metric.id;
            const isEditingNote = editingNoteId === metric.id;
            const hasNote = getMetricNote(metric).length > 0;

            const renderMinimalContent = () => (
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  {metric.type === "boolean" ? (
                    <Checkbox
                      checked={isCompleted}
                      onCheckedChange={() => toggleMetricCompletion(metric)}
                      disabled={!metric.active}
                    />
                  ) : (
                    <div className="w-4" />
                  )}
                  <div className="flex items-center gap-3">
                    <span
                      className={`font-medium ${!metric.active ? "text-muted-foreground" : ""}`}
                    >
                      {metric.name}
                    </span>
                    {metric.type !== "boolean" && !isEditing && (
                      <>
                        <div className="flex items-baseline gap-1">
                          <span className="text-xl font-bold text-primary">
                            {getMetricValue(metric)}
                          </span>
                          {(getMetricDisplayUnit(metric) || metric.type === "percentage") && (
                            <span className="text-sm font-medium text-muted-foreground">
                              {metric.type === "percentage" ? "%" : getMetricDisplayUnit(metric)}
                            </span>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => startEditing(metric)}
                          disabled={!metric.active}
                          className="h-8 px-3 hover:bg-primary hover:text-primary-foreground transition-colors"
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                      </>
                    )}
                    {metric.type !== "boolean" && isEditing && (
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
                          onChange={(e) => {
                            setEditValue(e.target.value);
                            if (metric.type === "text") {
                              debouncedSave(metric, e.target.value);
                            }
                          }}
                          onBlur={() => {
                            if (
                              metric.type === "text" &&
                              debounceTimeoutRef.current
                            ) {
                              clearTimeout(debounceTimeoutRef.current);
                              saveEditedValue(metric);
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              if (debounceTimeoutRef.current) {
                                clearTimeout(debounceTimeoutRef.current);
                              }
                              saveEditedValue(metric);
                            } else if (e.key === "Escape") {
                              cancelEditing();
                            }
                          }}
                          className="h-8 w-24 text-center"
                          disabled={isSubmitting}
                          autoFocus
                          placeholder="Value"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => saveEditedValue(metric)}
                          disabled={isSubmitting}
                          className="h-8 px-2"
                        >
                          {isSubmitting ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Save className="h-3 w-3" />
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={cancelEditing}
                          disabled={isSubmitting}
                          className="h-8 px-2"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                    {isCompleted && (
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                        <Check className="h-3 w-3 mr-1" />
                        Completed
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            );

            const renderFullContent = () => (
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
                    {metric.type !== "boolean" && (
                      <div className="mt-2">
                        {isEditing ? (
                          <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="text-xs font-medium text-primary">
                                    Editing Value
                                  </span>
                                  {getMetricDisplayUnit(metric) && (
                                    <span className="text-xs text-muted-foreground">
                                      ({getMetricDisplayUnit(metric)})
                                    </span>
                                  )}
                                </div>
                                <Input
                                  type={
                                    metric.type === "number" ||
                                    metric.type === "percentage" ||
                                    metric.type === "time"
                                      ? "number"
                                      : "text"
                                  }
                                  value={editValue}
                                  onChange={(e) => {
                                    setEditValue(e.target.value);
                                    if (metric.type === "text") {
                                      debouncedSave(metric, e.target.value);
                                    }
                                  }}
                                  onBlur={() => {
                                    if (
                                      metric.type === "text" &&
                                      debounceTimeoutRef.current
                                    ) {
                                      clearTimeout(debounceTimeoutRef.current);
                                      saveEditedValue(metric);
                                    }
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      if (debounceTimeoutRef.current) {
                                        clearTimeout(
                                          debounceTimeoutRef.current
                                        );
                                      }
                                      saveEditedValue(metric);
                                    } else if (e.key === "Escape") {
                                      cancelEditing();
                                    }
                                  }}
                                  className="h-10 text-lg font-semibold text-center"
                                  disabled={isSubmitting}
                                  autoFocus
                                  placeholder="Enter value..."
                                />
                              </div>
                              <div className="flex flex-col gap-1">
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => saveEditedValue(metric)}
                                  disabled={isSubmitting}
                                  className="h-8 px-3"
                                >
                                  {isSubmitting ? (
                                    <div className="animate-spin mr-1">
                                      <Save className="h-3 w-3" />
                                    </div>
                                  ) : (
                                    <Save className="h-3 w-3 mr-1" />
                                  )}
                                  Save
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={cancelEditing}
                                  disabled={isSubmitting}
                                  className="h-8 px-3"
                                >
                                  <X className="h-3 w-3 mr-1" />
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="p-3 bg-muted/30 rounded-lg border w-fit min-w-[200px]">
                            <div className="flex flex-col">
                              <span className="text-xs text-muted-foreground mb-1">
                                Current Value
                              </span>
                              <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-bold text-primary">
                                  {getMetricValue(metric)}
                                </span>
                                {(getMetricDisplayUnit(metric) ||
                                  metric.type === "percentage") && (
                                  <span className="text-sm font-medium text-muted-foreground">
                                    {metric.type === "percentage"
                                      ? "%"
                                      : getMetricDisplayUnit(metric)}
                                  </span>
                                )}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => startEditing(metric)}
                                  disabled={!metric.active}
                                  className="h-8 px-3 ml-2 hover:bg-primary hover:text-primary-foreground transition-colors"
                                >
                                  <Edit className="h-3 w-3 mr-1" />
                                  Edit
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {hasNote ? (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="h-8">
                          <FileText className="h-3 w-3 mr-1" />
                          View Note
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80">
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm">
                            Note for {format(selectedDate, "MMM d, yyyy")}
                          </h4>
                          <p className="text-sm whitespace-pre-wrap">
                            {getMetricNote(metric)}
                          </p>
                          {!isEditingNote && (
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
                          )}
                          {isEditingNote && (
                            <MetricNoteEditor
                              value={noteValue}
                              onChange={handleNoteChange}
                              onSave={() => saveEditedNote(metric)}
                              onCancel={cancelEditingNote}
                              isSubmitting={isSubmittingNote}
                            />
                          )}
                        </div>
                      </PopoverContent>
                    </Popover>
                  ) : (
                    !isEditingNote && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEditingNote(metric)}
                        disabled={!metric.active}
                        className="h-8 px-2"
                      >
                        <FileText className="h-3 w-3 mr-1" />
                        Add Note
                      </Button>
                    )
                  )}
                  {!hasNote && isEditingNote && (
                    <MetricNoteEditor
                      value={noteValue}
                      onChange={handleNoteChange}
                      onSave={() => saveEditedNote(metric)}
                      onCancel={cancelEditingNote}
                      isSubmitting={isSubmittingNote}
                    />
                  )}

                  <div className="flex flex-col items-center gap-2">
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
                      <Switch
                        checked={isCalendarTracked}
                        onCheckedChange={() => toggleCalendarTracking(metric)}
                        disabled={!metric.active}
                      />
                    </div>
                    <div className="text-xs text-muted-foreground text-center">
                      Show in daily calendar
                    </div>
                  </div>
                  <div className="space-x-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleMetricActiveStatus(metric)}
                      title={
                        metric.active ? "Deactivate metric" : "Activate metric"
                      }
                    >
                      {metric.active ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                    <AddMetricModal
                      metric={metric}
                      buttonVariant="ghost"
                      buttonSize="icon"
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

            const renderContent = () =>
              minimalView ? renderMinimalContent() : renderFullContent();

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
});

export default MetricLoggerListItem;
