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
import { updateEntry } from "@/store/data-store";
import { Clock, Save, ArrowLeft, Check, FolderIcon, Tag } from "lucide-react";
import { useStore } from "@tanstack/react-store";
import dataStore from "@/store/data-store";
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

  const allTimeEntries = useStore(
    dataStore,
    (state) => state.time_entries as TimeEntry[]
  );
  const metricsData = useStore(dataStore, (state) => state.metrics) || [];
  const dailyLogsData = useStore(dataStore, (state) => state.daily_logs) || [];
  const categories = useStore(dataStore, (state) => state.time_categories);

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

    const timeMetrics = metricsData
      .filter((m: any) => m.type === "time" && m.active)
      .map((metric: any) => ({
        id: `metric-${metric.id}`,
        label: metric.name,
        isMetric: true,
        metric: metric,
      }));

    const timeMetricNames = new Set(
      metricsData
        .filter((m: any) => m.type === "time" && m.active)
        .map((m: any) => m.name.toLowerCase())
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
  }, [allTimeEntries, metricsData]);

  useEffect(() => {
    const formatDateForInput = (date: Date) => {
      return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
    };

    setStartTime(formatDateForInput(new Date(entry.start_time)));
    setEndTime(formatDateForInput(new Date(entry.end_time)));
  }, [entry]);

  const handleSave = async () => {
    if (!description || !startTime || !endTime) return;

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

      const originalEntry = { ...entry };

      const updatedEntry = {
        ...entry,
        description,
        start_time: startDate.toISOString(),
        end_time: endDate.toISOString(),
        duration_minutes: durationMinutes,
        category_id: categoryId,
        tags,
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
    setStartTime(
      new Date(now.getTime() - now.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16)
    );
  };

  const setEndTimeToNow = () => {
    const now = new Date();
    setEndTime(
      new Date(now.getTime() - now.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16)
    );
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
    setStartTime(
      new Date(
        previousEndDate.getTime() - previousEndDate.getTimezoneOffset() * 60000
      )
        .toISOString()
        .slice(0, 16)
    );
  };

  const categoryOptions = categories.map((category) => ({
    id: category.id,
    label: category.name,
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
      footerActionDisabled={!description || !startTime || !endTime || isSaving}
      footerActionLoadingText="Saving..."
      loading={isSaving}
      contentClassName="sm:max-w-[550px]"
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="edit-start-time">Start Time</Label>
                <div className="flex space-x-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    title="Use previous entry end time"
                    onClick={setPreviousEntryEndTime}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    title="Set to current time"
                    onClick={setStartTimeToNow}
                  >
                    <Clock className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="flex gap-2">
                <Input
                  id="edit-start-time"
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="edit-end-time">End Time</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  title="Set to current time"
                  onClick={setEndTimeToNow}
                >
                  <Clock className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex gap-2">
                <Input
                  id="edit-end-time"
                  type="datetime-local"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-category">Category</Label>
            <ReusableSelect
              options={categoryOptions}
              value={categoryId || ""}
              onChange={setCategoryId}
              placeholder="Select category"
              title="category"
              noDefault={false}
            />
          </div>

          <div className="space-y-2">
            <TagInput
              value={tags}
              onChange={setTags}
              label="Tags"
              generalData={allTimeEntries}
              generalDataTagField="tags"
            />
          </div>
        </div>
      }
    />
  );
}
