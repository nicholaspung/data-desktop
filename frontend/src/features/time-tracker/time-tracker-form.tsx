// src/features/time-tracker/time-tracker-form.tsx
import { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Play,
  Save,
  Clock,
  TimerOff,
  PlusCircle,
  History,
  Tag,
  FolderIcon,
  Check,
  Coffee,
} from "lucide-react";
import { TimeEntry } from "@/store/time-tracking-definitions";
import { ApiService } from "@/services/api";
import { calculateDurationMinutes, formatDuration } from "@/lib/time-utils";
import ReusableSelect from "@/components/reusable/reusable-select";
import { Switch } from "@/components/ui/switch";
import ReusableCard from "@/components/reusable/reusable-card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useStore } from "@tanstack/react-store";
import dataStore, { addEntry } from "@/store/data-store";
import {
  timeTrackerStore,
  getTimerData,
  startTimer as startGlobalTimer,
  stopTimer as stopGlobalTimer,
} from "./time-tracker-store";
import AutocompleteInput from "@/components/reusable/autocomplete-input";
import { SelectOption } from "@/types/types";
import { Metric } from "@/store/experiment-definitions";
import { syncTimeEntryWithMetrics } from "./time-metrics-sync";
import { Badge } from "@/components/ui/badge";
import PomodoroTimer from "./pomodoro-timer";
import { pomodoroStore, setUsePomodoroActive } from "./pomodoro-store";
import TagInput from "@/components/reusable/tag-input";
import ErrorBoundary from "@/components/reusable/error-boundary";

interface TimeTrackerFormProps {
  onDataChange: () => void;
  inPopover?: boolean;
}

function TimeTrackerForm({
  onDataChange,
  inPopover = false,
}: TimeTrackerFormProps) {
  // Get time entries from store for previous entry reference
  const timeEntries = useStore(dataStore, (state) => state.time_entries);
  const categories = useStore(dataStore, (state) => state.time_categories);
  const metricsData = useStore(dataStore, (state) => state.metrics) || [];
  const dailyLogsData = useStore(dataStore, (state) => state.daily_logs) || [];
  const isPomodoroActive = useStore(pomodoroStore, (state) => state.isActive);
  const isPomodoroBreak = useStore(pomodoroStore, (state) => state.isBreak);
  const isTimerActive = useStore(
    timeTrackerStore,
    (state) => state.isTimerActive
  );
  const usePomodoroActive = useStore(
    pomodoroStore,
    (state) => state.usePomodoroActive
  );

  // Get global timer state
  const globalTimerData = getTimerData();

  // Initialize form with global timer data if timer is active
  const [description, setDescription] = useState(
    globalTimerData.isActive ? globalTimerData.description : ""
  );
  const [categoryId, setCategoryId] = useState<string | undefined>(
    globalTimerData.isActive ? globalTimerData.categoryId : undefined
  );
  const [tags, setTags] = useState(
    globalTimerData.isActive ? globalTimerData.tags : ""
  );
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  // Timer state - sync with global state if timer is active
  const [timerStartTime, setTimerStartTime] = useState<Date | null>(
    globalTimerData.isActive ? globalTimerData.startTime : null
  );
  const [elapsedSeconds, setElapsedSeconds] = useState(
    globalTimerData.isActive ? globalTimerData.elapsedSeconds : 0
  );

  // Loading state
  const [isSaving, setIsSaving] = useState(false);

  // Add state
  const [addState, setAddState] = useState<"timer" | "manual">("timer");

  // Generate options for autocomplete from previous entries
  const descriptionOptions = useMemo(() => {
    const uniqueDescriptions = new Map<string, TimeEntry>();

    // Get the most recent entry for each unique description
    timeEntries.forEach((entry) => {
      if (!uniqueDescriptions.has(entry.description) && entry.description) {
        uniqueDescriptions.set(entry.description, entry);
      }
    });

    // Get time-type metrics to add to suggestions
    const timeMetrics = metricsData
      .filter((m: any) => m.type === "time" && m.active)
      .map((metric: any) => ({
        id: `metric-${metric.id}`,
        label: metric.name,
        isMetric: true,
        metric: metric,
      }));

    // Create a set of time metric names for easy lookup
    const timeMetricNames = new Set(
      metricsData
        .filter((m: any) => m.type === "time" && m.active)
        .map((m: any) => m.name.toLowerCase())
    );

    // Convert to options array for the autocomplete with all related data
    const entryOptions = Array.from(uniqueDescriptions.values()).map(
      (entry) => {
        // Check if this entry matches a time metric name
        const isTimeMetric = timeMetricNames.has(
          entry.description.toLowerCase()
        );

        return {
          id: entry.id,
          label: entry.description,
          entry: entry,
          isMetric: isTimeMetric, // Set to true if it matches a time metric
          // Include category information if available (from relation data)
          category_id_data: entry.category_id_data,
        };
      }
    );

    // Combine metrics first, then previous entries
    return [...timeMetrics, ...entryOptions];
  }, [timeEntries, metricsData]);

  // Reset form to initial state
  const resetForm = useCallback(() => {
    setDescription("");
    setCategoryId(undefined);
    setTags("");
    setStartTime("");
    setEndTime("");
    setTimerStartTime(null);
    setElapsedSeconds(0);

    // Make sure we're also in sync with the global state
    if (globalTimerData.isActive) {
      stopGlobalTimer();
    }
  }, [globalTimerData.isActive]);

  // Initialize current time when switching to manual mode
  useEffect(() => {
    if (addState === "manual" && !startTime) {
      setCurrentTimeAsStartTime();
    }
  }, [addState]);

  useEffect(() => {
    // If both pomodoro and regular timer are inactive, reset the form
    if (!isPomodoroActive && !isTimerActive) {
      resetForm();
    }
  }, [isPomodoroActive, isTimerActive]);

  // Update local timer state when global state changes
  useEffect(() => {
    const unsubscribe = timeTrackerStore.subscribe((state) => {
      // Only update if state actually changed
      if (state.currentVal === state.prevVal) return;

      const currentState = state.currentVal;
      const prevStateVal = state.prevVal;

      if (currentState.isTimerActive) {
        // Only update if values actually changed
        if (currentState.description !== prevStateVal.description) {
          setDescription(currentState.description);
        }
        if (currentState.categoryId !== prevStateVal.categoryId) {
          setCategoryId(currentState.categoryId);
        }
        if (currentState.tags !== prevStateVal.tags) {
          setTags(currentState.tags);
        }
        if (currentState.startTime !== prevStateVal.startTime) {
          setTimerStartTime(currentState.startTime);
          if (currentState.startTime) {
            const formattedTime = formatDateForInput(currentState.startTime);
            setStartTime(formattedTime);
          }
        }
        if (currentState.elapsedSeconds !== prevStateVal.elapsedSeconds) {
          setElapsedSeconds(currentState.elapsedSeconds);
        }
      } else {
        // Only reset if we were previously tracking time and not in pomodoro mode
        if (prevStateVal.isTimerActive && !isPomodoroActive) {
          resetForm();
        }
      }
    });

    return () => unsubscribe();
  }, [isPomodoroActive, resetForm]);

  // Local timer tick for immediate feedback
  useEffect(() => {
    // Timer interval for active timer
    if (isTimerActive && timerStartTime) {
      const interval = setInterval(() => {
        const now = new Date();
        const secondsDiff = Math.floor(
          (now.getTime() - timerStartTime.getTime()) / 1000
        );
        setElapsedSeconds(secondsDiff);
      }, 1000);

      return () => {
        clearInterval(interval);
      };
    }
    // Reset if timer becomes inactive
    else if (!isTimerActive) {
      setElapsedSeconds(0);
    }
  }, [isTimerActive, timerStartTime]);

  // Start the timer
  const handleStartTimer = () => {
    const now = new Date();
    const formattedNow = formatDateForInput(now);
    setStartTime(formattedNow);

    // Only call the global store function
    startGlobalTimer(description, categoryId, tags);

    // No need to set local state, it will come from the store
  };

  // Helper to format date for datetime-local input
  const formatDateForInput = (date: Date): string => {
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
  };

  // Set current time as start time
  const setCurrentTimeAsStartTime = () => {
    const now = new Date();
    const formattedNow = formatDateForInput(now);
    setStartTime(formattedNow);
  };

  // Set end time of last entry as start time for this entry
  const setLastEntryEndTimeAsStartTime = () => {
    if (timeEntries.length === 0) {
      // If no previous entries, use current time
      setCurrentTimeAsStartTime();
      return;
    }

    // Sort entries by end time, descending
    const sortedEntries = [...timeEntries].sort((a, b) => {
      return new Date(b.end_time).getTime() - new Date(a.end_time).getTime();
    });

    // Get the most recent entry
    const lastEntry = sortedEntries[0];
    if (lastEntry && lastEntry.end_time) {
      const lastEndTime = new Date(lastEntry.end_time);
      const formattedTime = formatDateForInput(lastEndTime);
      setStartTime(formattedTime);
    }
  };

  const handleSaveTimer = async () => {
    if (!timerStartTime) return;

    try {
      setIsSaving(true);

      const endTime = new Date();
      const durationMinutes = Math.ceil(elapsedSeconds / 60);
      const sortedTags = getSortedTags();

      const newEntry = {
        description,
        start_time: timerStartTime.toISOString(),
        end_time: endTime.toISOString(),
        duration_minutes: durationMinutes,
        category_id: categoryId,
        tags: sortedTags,
        private: false,
      };

      const response = await ApiService.addRecord("time_entries", newEntry);

      if (response) {
        addEntry(response, "time_entries");

        // Add timeout for sync operation to prevent freezing
        await Promise.race([
          syncTimeEntryWithMetrics(
            response as TimeEntry,
            metricsData,
            dailyLogsData
          ),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Sync timeout")), 5000)
          ),
        ]).catch((error) => {
          console.warn("Metrics sync failed or timed out:", error);
          // Continue with saving even if sync fails
        });
      }

      // Reset global timer state
      stopGlobalTimer();

      // Reset local form state
      resetForm();

      // Add a small delay before triggering onDataChange to prevent race conditions
      setTimeout(() => {
        onDataChange();
      }, 100);
    } catch (error) {
      console.error("Error saving time entry:", error);
      // Don't freeze the UI on error
      alert("Failed to save time entry. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleManualSave = async () => {
    if (!startTime || !endTime) return;

    try {
      setIsSaving(true);

      const startDate = new Date(startTime);
      const endDate = new Date(endTime);

      if (startDate >= endDate) {
        alert("End time must be after start time");
        setIsSaving(false);
        return;
      }

      const durationMinutes = calculateDurationMinutes(startDate, endDate);
      const sortedTags = getSortedTags();

      const newEntry = {
        description,
        start_time: startDate.toISOString(),
        end_time: endDate.toISOString(),
        duration_minutes: durationMinutes,
        category_id: categoryId,
        tags: sortedTags,
        private: false,
      };

      const response = await ApiService.addRecord("time_entries", newEntry);

      if (response) {
        addEntry(response, "time_entries");

        // Sync with time metrics
        await syncTimeEntryWithMetrics(
          response as TimeEntry,
          metricsData,
          dailyLogsData
        );
      }

      resetForm();
      onDataChange();
    } catch (error) {
      console.error("Error saving time entry:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle selection of a previous entry from autocomplete
  const handleDescriptionSelect = (
    option: SelectOption & {
      entry?: TimeEntry;
      isMetric?: boolean;
      metric?: Metric;
    }
  ) => {
    setDescription(option.label);

    // If selecting a metric
    if (option.isMetric && option.metric) {
      // For metrics, no need to set category automatically
    }
    // For previous entries
    else if (option.entry) {
      if (option.entry.category_id) {
        setCategoryId(option.entry.category_id);
      }
      if (option.entry.tags) {
        setTags(option.entry.tags);
      }
    }
  };

  // Add this new function to sort tags alphabetically when saving
  const getSortedTags = () => {
    if (!tags) return "";

    return tags
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag)
      .sort()
      .join(", ");
  };

  const isTimeMetric = (description: string) => {
    return metricsData.some(
      (metric: any) =>
        metric.type === "time" &&
        metric.active &&
        metric.name.toLowerCase() === description.toLowerCase()
    );
  };

  return (
    <ReusableCard
      showHeader={false}
      cardClassName={cn(
        inPopover
          ? "border-0 shadow-none"
          : "border-2 shadow-lg transition-all duration-300",
        // Apply different styling based on timer state
        isPomodoroActive && isPomodoroBreak
          ? "border-blue-500 dark:border-blue-600 shadow-blue-100 dark:shadow-blue-900/20"
          : isPomodoroActive && !isPomodoroBreak
            ? "border-red-500 dark:border-red-600 shadow-red-100 dark:shadow-red-900/20"
            : isTimerActive
              ? "border-green-500 dark:border-green-600 shadow-green-100 dark:shadow-green-900/20"
              : "border-blue-400 dark:border-blue-600 shadow-blue-100 dark:shadow-blue-900/10 hover:border-blue-500"
      )}
      content={
        <div className="flex flex-col gap-4 p-4">
          <div className="flex flex-row justify-between pt-2">
            <h3 className="text-xl font-bold flex items-center">
              {isPomodoroActive && isPomodoroBreak ? (
                <span className="text-blue-600 dark:text-blue-500 flex items-center">
                  <Coffee className="mr-2 h-5 w-5" />
                  Break Time
                </span>
              ) : isPomodoroActive && !isPomodoroBreak ? (
                <span className="text-red-600 dark:text-red-500 flex items-center">
                  <Clock className="mr-2 h-5 w-5 animate-pulse" />
                  Pomodoro
                </span>
              ) : isTimerActive ? (
                <span className="text-green-600 dark:text-green-500 flex items-center">
                  <Clock className="mr-2 h-5 w-5 animate-pulse" />
                  Recording Time
                </span>
              ) : (
                <span className="text-blue-600 dark:text-blue-500 flex items-center">
                  <PlusCircle className="mr-2 h-5 w-5 text-blue-500 dark:text-blue-400" />
                  New Time Entry
                </span>
              )}
            </h3>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 bg-muted/50 rounded-full px-3 py-1 shadow-sm">
                {!isPomodoroActive && (
                  <div className="flex items-center gap-2">
                    <Label
                      htmlFor="add-state"
                      className={cn(
                        "cursor-pointer text-sm font-medium",
                        addState !== "timer" && "text-primary"
                      )}
                    >
                      Manual
                    </Label>
                    <Switch
                      id="add-state"
                      checked={addState === "timer"}
                      onCheckedChange={(value) => {
                        if (value) {
                          setAddState("timer");
                        } else {
                          setAddState("manual");
                          setUsePomodoroActive(false);
                        }
                      }}
                    />
                    <Label
                      htmlFor="add-state"
                      className={cn(
                        "cursor-pointer text-sm font-medium",
                        addState === "timer" && "text-primary"
                      )}
                    >
                      Timer
                    </Label>
                  </div>
                )}
              </div>
              {!isPomodoroActive && addState === "timer" && (
                <div className="flex items-center gap-2 bg-muted/50 rounded-full px-3 py-1 shadow-sm">
                  <div className="flex items-center gap-2">
                    <Switch
                      id="pomodoro-state"
                      checked={usePomodoroActive}
                      onCheckedChange={(value) => setUsePomodoroActive(value)}
                    />
                    <Label
                      htmlFor="pomodoro-state"
                      className={cn("cursor-pointer text-sm font-medium")}
                    >
                      Use Pomodoro
                    </Label>
                  </div>
                </div>
              )}
            </div>
          </div>
          <Separator className="bg-muted" />
          <div className="flex flex-row gap-4 items-end flex-wrap">
            <div className="flex-2 space-y-2">
              <Label
                htmlFor="description"
                className="text-sm font-medium flex items-center"
              >
                What are you working on?
                {isTimeMetric(description) && (
                  <Badge
                    variant="outline"
                    className="ml-2 bg-blue-100 dark:bg-blue-900 text-xs"
                  >
                    Time Metric
                  </Badge>
                )}
              </Label>
              <AutocompleteInput
                id="description"
                value={description}
                onChange={setDescription}
                onSelect={handleDescriptionSelect}
                options={descriptionOptions}
                placeholder="Task description"
                inputClassName={`h-10 focus:ring-2 focus:ring-primary/50 ${
                  isTimeMetric(description) ? "border-blue-500" : ""
                }`}
                emptyMessage="Type to start tracking a new task or select a previous one"
                showRecentOptions={true}
                maxRecentOptions={7}
                renderItem={(option, isActive) => {
                  const entry = option.entry;

                  return (
                    <div
                      className={cn(
                        "w-full",
                        isActive ? "bg-accent text-accent-foreground" : ""
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{option.label}</span>
                        {option.label.toLowerCase() ===
                          description.toLowerCase() && (
                          <Check className="h-4 w-4 text-primary" />
                        )}
                        {option.isMetric && (
                          <Badge
                            variant="outline"
                            className="bg-blue-100 dark:bg-blue-900 text-xs"
                          >
                            Time Metric
                          </Badge>
                        )}
                      </div>

                      {entry && (
                        <div className="flex flex-wrap gap-1 mt-1 text-xs text-muted-foreground">
                          {entry.category_id_data && (
                            <div className="flex items-center gap-1">
                              <FolderIcon className="h-3 w-3" />
                              <span>{entry.category_id_data.name}</span>
                            </div>
                          )}

                          {entry.tags && (
                            <div className="flex items-center gap-1">
                              <Tag className="h-3 w-3" />
                              <div className="flex flex-wrap gap-1">
                                {entry.tags
                                  .split(",")
                                  .map((tag: string, idx: number) => (
                                    <Badge
                                      key={idx}
                                      variant="outline"
                                      className="text-[0.65rem] py-0 px-1"
                                    >
                                      {tag.trim()}
                                    </Badge>
                                  ))}
                              </div>
                            </div>
                          )}

                          {entry.lastModified && (
                            <div className="flex items-center gap-1 ml-auto">
                              <Clock className="h-3 w-3" />
                              <span>
                                {new Date(
                                  entry.lastModified
                                ).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category" className="text-sm font-medium">
                Category
              </Label>
              <ReusableSelect
                options={categories.map((category) => ({
                  id: category.id,
                  label: category.name,
                }))}
                noDefault={false}
                value={categoryId}
                onChange={setCategoryId}
                title="category"
                placeholder="Select category"
                triggerClassName="h-10"
              />
            </div>

            <TagInput
              value={tags}
              onChange={setTags}
              generalData={timeEntries}
              generalDataTagField="tags"
            />

            {usePomodoroActive && (
              <div className="space-x-2">
                <PomodoroTimer
                  onDataChange={onDataChange}
                  description={description}
                  categoryId={categoryId}
                  tags={tags}
                />
              </div>
            )}

            {addState === "timer" && !usePomodoroActive && (
              <div
                className={cn(
                  "text-3xl font-mono font-bold tracking-tight text-center px-3 py-1 rounded-lg",
                  isTimerActive
                    ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                    : "text-muted-foreground"
                )}
              >
                {formatDuration(elapsedSeconds)}
              </div>
            )}

            {!usePomodoroActive && (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="start-time" className="text-sm font-medium">
                    Start Time
                  </Label>
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={setCurrentTimeAsStartTime}
                      title="Set to current time"
                    >
                      Now
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs flex items-center"
                      onClick={setLastEntryEndTimeAsStartTime}
                      title="Continue from last entry"
                      disabled={timeEntries.length === 0}
                    >
                      <History className="h-3 w-3 mr-1" />
                      Last
                    </Button>
                  </div>
                </div>
                <Input
                  id="start-time"
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="h-10 focus:ring-2 focus:ring-primary/50"
                />
              </div>
            )}

            {addState === "manual" && (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="end-time" className="text-sm font-medium">
                    End Time
                  </Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={() => {
                      const now = new Date();
                      const formattedNow = formatDateForInput(now);
                      setEndTime(formattedNow);
                    }}
                    title="Set to current time"
                  >
                    Now
                  </Button>
                </div>
                <Input
                  id="end-time"
                  type="datetime-local"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="h-10 focus:ring-2 focus:ring-primary/50"
                />
              </div>
            )}

            {!usePomodoroActive && (
              <div>
                {!isTimerActive && addState === "timer" ? (
                  <Button
                    onClick={handleStartTimer}
                    size="sm"
                    className="px-6 py-5 bg-blue-600 hover:bg-blue-700 font-medium"
                  >
                    <Play className="mr-2 h-4 w-4" />
                    Start Timer
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={async () => {
                      if (isTimerActive && addState === "timer") {
                        await handleSaveTimer();
                      } else {
                        await handleManualSave();
                      }
                    }}
                    disabled={
                      addState === "timer"
                        ? isSaving
                        : !startTime || !endTime || isSaving
                    }
                    className={cn(
                      "px-6 py-5 font-medium",
                      isTimerActive
                        ? "bg-green-600 hover:bg-green-700"
                        : "bg-blue-600 hover:bg-blue-700"
                    )}
                  >
                    {isTimerActive ? (
                      <>
                        <TimerOff className="h-4 w-4 mr-2" />
                        {isSaving ? "Saving..." : "Stop & Save"}
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        {isSaving ? "Saving..." : "Save"}
                      </>
                    )}
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      }
    />
  );
}

export default function TimeTrackerFormWrapper(props: TimeTrackerFormProps) {
  return (
    <ErrorBoundary>
      <TimeTrackerForm {...props} />
    </ErrorBoundary>
  );
}
