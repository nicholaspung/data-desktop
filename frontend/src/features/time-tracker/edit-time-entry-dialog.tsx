import { useState, useEffect, useMemo } from "react";
import { TimeEntry } from "@/store/time-tracking-definitions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ReusableDialog from "@/components/reusable/reusable-dialog";
import ReusableSelect from "@/components/reusable/reusable-select";
import TagInput from "@/components/reusable/tag-input";
import { ApiService } from "@/services/api";
import { calculateDurationMinutes } from "@/lib/time-utils";
import { updateEntry, addEntry } from "@/store/data-store";
import { Clock, Save, Check, FolderIcon, Tag, History, AlertCircle } from "lucide-react";
import { useStore } from "@tanstack/react-store";
import dataStore from "@/store/data-store";
import settingsStore, { isMetricsEnabled } from "@/store/settings-store";
import { syncTimeEntryWithMetrics } from "./time-metrics-sync";
import AutocompleteInput from "@/components/reusable/autocomplete-input";
import { SelectOption } from "@/types/types";
import { Metric } from "@/store/experiment-definitions";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface EditTimeEntryDialogProps {
  entry: TimeEntry;
  onSave: () => void;
  onCancel: () => void;
}

export default function EditTimeEntryDialog({
  entry,
  onSave,
  onCancel,
}: EditTimeEntryDialogProps) {
  const [description, setDescription] = useState(entry.description);
  const [categoryId, setCategoryId] = useState<string | undefined>(
    entry.category_id
  );
  const [tags, setTags] = useState(entry.tags || "");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showStartTimeWarning, setShowStartTimeWarning] = useState(false);
  const [startTimeError, setStartTimeError] = useState<string>("");
  const [endTimeError, setEndTimeError] = useState<string>("");

  const allTimeEntries = useStore(
    dataStore,
    (state) => state.time_entries as TimeEntry[]
  );
  const metricsDataRaw = useStore(dataStore, (state) => state.metrics);
  const dailyLogsData = useStore(dataStore, (state) => state.daily_logs) || [];
  const categories = useStore(dataStore, (state) => state.time_categories);
  const visibleRoutes = useStore(settingsStore, (state) => state.visibleRoutes);
  const metricsEnabled = isMetricsEnabled(visibleRoutes);

  const metricsData = useMemo(() => metricsDataRaw || [], [metricsDataRaw]);

  const descriptionOptions = useMemo(() => {
    const uniqueDescriptions = new Map<string, TimeEntry>();

    allTimeEntries.forEach((timeEntry) => {
      if (
        !uniqueDescriptions.has(timeEntry.description) &&
        timeEntry.description
      ) {
        uniqueDescriptions.set(timeEntry.description, timeEntry);
      }
    });

    const timeMetrics = metricsEnabled
      ? metricsData
          .filter((m: any) => m.type === "time" && m.active)
          .map((metric: any) => ({
            id: `metric-${metric.id}`,
            label: metric.name,
            isMetric: true,
            metric: metric,
          }))
      : [];

    const timeMetricNames = new Set(
      metricsEnabled
        ? metricsData
            .filter((m: any) => m.type === "time" && m.active)
            .map((m: any) => m.name.toLowerCase())
        : []
    );

    const entryOptions = Array.from(uniqueDescriptions.values()).map(
      (timeEntry) => {
        const isTimeMetric = timeMetricNames.has(
          timeEntry.description.toLowerCase()
        );

        return {
          id: timeEntry.id,
          label: timeEntry.description,
          entry: timeEntry,
          isMetric: isTimeMetric,
          category_id_data: timeEntry.category_id_data,
        };
      }
    );

    return [...timeMetrics, ...entryOptions];
  }, [allTimeEntries, metricsData, metricsEnabled]);

  useEffect(() => {
    const formatDateForInput = (date: Date) => {
      return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
    };

    setStartTime(formatDateForInput(new Date(entry.start_time)));
    setEndTime(formatDateForInput(new Date(entry.end_time)));
  }, [entry]);

  const handleStartTimeChange = (newStartTime: string) => {
    setStartTime(newStartTime);
    setStartTimeError("");

    if (newStartTime && endTime) {
      const newStartDate = new Date(newStartTime);
      const endDate = new Date(endTime);
      const now = new Date();

      if (newStartDate > now) {
        setStartTimeError("Start time cannot be in the future");
        return;
      }

      if (newStartDate >= endDate) {
        setStartTimeError("Start time must be before end time");
        return;
      }
    }
  };

  const handleEndTimeChange = (newEndTime: string) => {
    setEndTime(newEndTime);
    setEndTimeError("");

    if (newEndTime && startTime) {
      const endDate = new Date(newEndTime);
      const startDate = new Date(startTime);
      const now = new Date();

      if (endDate > now) {
        setEndTimeError("End time cannot be in the future");
        return;
      }

      if (endDate <= startDate) {
        setEndTimeError("End time must be after start time");
        return;
      }
    }
  };

  const handleSave = async () => {
    if (!description || !startTime || !endTime) return;

    setStartTimeError("");
    setEndTimeError("");

    try {
      setIsSaving(true);

      const startDate = new Date(startTime);
      const endDate = new Date(endTime);
      const now = new Date();

      let hasError = false;

      if (startDate > now) {
        setStartTimeError("Start time cannot be in the future");
        hasError = true;
      }

      if (endDate > now) {
        setEndTimeError("End time cannot be in the future");
        hasError = true;
      }

      if (startDate >= endDate) {
        setEndTimeError("End time must be after start time");
        hasError = true;
      }

      if (hasError) {
        setIsSaving(false);
        return;
      }

      const durationMinutes = calculateDurationMinutes(startDate, endDate);
      const sortedTags = getSortedTags();

      const originalEntry = { ...entry };

      const updatedEntry = {
        ...entry,
        description,
        start_time: startDate.toISOString(),
        end_time: endDate.toISOString(),
        duration_minutes: durationMinutes,
        category_id: categoryId,
        tags: sortedTags,
      };

      const response = await ApiService.updateRecord(entry.id, updatedEntry);

      if (response) {
        updateEntry(entry.id, response, "time_entries");

        await syncTimeEntryWithMetrics(
          response as TimeEntry,
          metricsData,
          dailyLogsData,
          originalEntry
        );
      }

      onSave();
    } catch (error) {
      console.error("Error updating time entry:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const setStartTimeToNow = () => {
    const now = new Date();
    const formattedNow = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    handleStartTimeChange(formattedNow);
    setShowStartTimeWarning(false);
  };

  const setEndTimeToNow = () => {
    const now = new Date();
    const formattedNow = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    handleEndTimeChange(formattedNow);
  };

  const findPreviousEntryEndTime = () => {
    const currentStartTime = new Date(entry.start_time).getTime();

    const earlierEntries = allTimeEntries.filter(
      (e) =>
        e.id !== entry.id && new Date(e.end_time).getTime() <= currentStartTime
    );

    if (earlierEntries.length === 0) return null;

    earlierEntries.sort(
      (a, b) => new Date(b.end_time).getTime() - new Date(a.end_time).getTime()
    );

    return earlierEntries[0];
  };

  const setPreviousEntryEndTime = () => {
    const previousEntry = findPreviousEntryEndTime();
    if (!previousEntry) {
      alert("No previous entries found");
      return;
    }

    const previousEndDate = new Date(previousEntry.end_time);
    const bufferSeconds = Math.floor(Math.random() * 31) + 30;
    const bufferedStartTime = new Date(
      previousEndDate.getTime() + bufferSeconds * 1000
    );
    const formattedTime = new Date(
      bufferedStartTime.getTime() - bufferedStartTime.getTimezoneOffset() * 60000
    )
      .toISOString()
      .slice(0, 16);
    handleStartTimeChange(formattedTime);
  };

  const generateRandomColor = () => {
    const colors = [
      "#ef4444", // red
      "#f97316", // orange
      "#f59e0b", // amber
      "#eab308", // yellow
      "#84cc16", // lime
      "#22c55e", // green
      "#10b981", // emerald
      "#14b8a6", // teal
      "#06b6d4", // cyan
      "#0ea5e9", // sky
      "#3b82f6", // blue
      "#6366f1", // indigo
      "#8b5cf6", // violet
      "#a855f7", // purple
      "#d946ef", // fuchsia
      "#ec4899", // pink
      "#f43f5e", // rose
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const handleCreateCategory = async (categoryName: string) => {
    try {
      const newCategory = {
        name: categoryName,
        color: generateRandomColor(),
        private: false,
      };

      const response = await ApiService.addRecord(
        "time_categories",
        newCategory
      );

      if (response) {
        addEntry(response, "time_categories");
        setCategoryId(response.id);
      }
    } catch (error) {
      console.error("Error creating category:", error);
      alert("Failed to create category. Please try again.");
    }
  };

  const categoryOptions = categories.map((category) => ({
    id: category.id,
    label: category.name,
    color: category.color,
  }));

  const handleDescriptionSelect = (
    option: SelectOption & {
      entry?: TimeEntry;
      isMetric?: boolean;
      metric?: Metric;
    }
  ) => {
    setDescription(option.label);

    if (option.isMetric && option.metric) {
      // For metrics, no need to set category automatically
    } else if (option.entry) {
      if (option.entry.category_id) {
        setCategoryId(option.entry.category_id);
      }
      if (option.entry.tags) {
        setTags(option.entry.tags);
      }
    }
  };

  const isTimeMetric = (description: string) => {
    return metricsData.some(
      (metric: any) =>
        metric.type === "time" &&
        metric.active &&
        metric.name.toLowerCase() === description.toLowerCase()
    );
  };

  const getSortedTags = () => {
    if (!tags) return "";

    return tags
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag)
      .sort()
      .join(", ");
  };

  return (
    <ReusableDialog
      title="Edit Time Entry"
      open={true}
      onOpenChange={(open) => !open && onCancel()}
      showTrigger={false}
      confirmText="Save Changes"
      confirmIcon={<Save className="h-4 w-4" />}
      onConfirm={handleSave}
      onCancel={onCancel}
      footerActionDisabled={!description || !startTime || !endTime || isSaving || !!startTimeError || !!endTimeError}
      footerActionLoadingText="Saving..."
      loading={isSaving}
      contentClassName="sm:max-w-[550px]"
      fixedFooter={true}
      customContent={
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label
              htmlFor="edit-description"
              className="text-sm font-medium flex items-center"
            >
              Description
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
              id="edit-description"
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
                const entry = option.entry as TimeEntry;

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
                      {option.isMetric ? (
                        <Badge
                          variant="outline"
                          className="bg-blue-100 dark:bg-blue-900 text-xs"
                        >
                          Time Metric
                        </Badge>
                      ) : null}
                    </div>

                    {entry ? (
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
                    ) : null}
                  </div>
                );
              }}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="edit-start-time" className="text-sm font-medium">Start Time</Label>
                <div className="flex items-center space-x-1">
                  {showStartTimeWarning && (
                    <div className="pl-2 flex items-center gap-1 text-amber-600 dark:text-amber-500 animate-pulse mr-2">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-xs font-medium">
                        Old start time!
                      </span>
                    </div>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "h-6 px-2 text-xs",
                      showStartTimeWarning &&
                        "ring-2 ring-amber-500 ring-offset-2 animate-pulse"
                    )}
                    onClick={setStartTimeToNow}
                    title="Set to current time"
                  >
                    Now
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs flex items-center"
                    onClick={setPreviousEntryEndTime}
                    title="Continue from last entry"
                    disabled={allTimeEntries.length === 0}
                  >
                    <History className="h-3 w-3 mr-1" />
                    Last
                  </Button>
                </div>
              </div>
              <Input
                id="edit-start-time"
                type="datetime-local"
                value={startTime}
                onChange={(e) => handleStartTimeChange(e.target.value)}
                className={cn(
                  "h-10 focus:ring-2 focus:ring-primary/50",
                  showStartTimeWarning &&
                    "border-amber-500 dark:border-amber-500",
                  startTimeError && "border-red-500 dark:border-red-500"
                )}
              />
              {startTimeError && (
                <div className="flex items-center gap-1 mt-1 text-red-600 dark:text-red-500">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-xs">{startTimeError}</span>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="edit-end-time" className="text-sm font-medium">End Time</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={setEndTimeToNow}
                  title="Set to current time"
                >
                  Now
                </Button>
              </div>
              <Input
                id="edit-end-time"
                type="datetime-local"
                value={endTime}
                onChange={(e) => handleEndTimeChange(e.target.value)}
                className={cn(
                  "h-10 focus:ring-2 focus:ring-primary/50",
                  endTimeError && "border-red-500 dark:border-red-500"
                )}
              />
              {endTimeError && (
                <div className="flex items-center gap-1 mt-1 text-red-600 dark:text-red-500">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-xs">{endTimeError}</span>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-category" className="text-sm font-medium">
              Category
            </Label>
            <ReusableSelect
              searchSelect={true}
              options={categoryOptions}
              noDefault={false}
              value={categoryId}
              onChange={setCategoryId}
              onCreateNew={handleCreateCategory}
              title="category"
              placeholder="Search or create category..."
              createNewLabel="Create category"
              triggerClassName="h-10"
              usePortal={true}
              renderItem={(option) => (
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full border"
                    style={{ backgroundColor: option.color || "#3b82f6" }}
                  />
                  <span>{option.label}</span>
                </div>
              )}
            />
          </div>

          <div className="space-y-2">
            <TagInput
              value={tags}
              onChange={setTags}
              label="Tags"
              generalData={allTimeEntries}
              generalDataTagField="tags"
              usePortal={true}
            />
          </div>
        </div>
      }
    />
  );
}
