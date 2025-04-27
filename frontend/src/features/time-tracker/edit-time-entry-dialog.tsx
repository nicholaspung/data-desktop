// src/features/time-tracker/edit-time-entry-dialog.tsx
import { useState, useEffect } from "react";
import { TimeEntry, TimeCategory } from "@/store/time-tracking-definitions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ReusableDialog from "@/components/reusable/reusable-dialog";
import ReusableSelect from "@/components/reusable/reusable-select";
import { ApiService } from "@/services/api";
import { calculateDurationMinutes } from "@/lib/time-utils";
import { updateEntry } from "@/store/data-store";
import { Clock, Save, ArrowLeft } from "lucide-react";
import { useStore } from "@tanstack/react-store";
import dataStore from "@/store/data-store";
import { syncTimeEntryWithMetrics } from "./time-metrics-sync";

interface EditTimeEntryDialogProps {
  entry: TimeEntry;
  categories: TimeCategory[];
  onSave: () => void;
  onCancel: () => void;
}

export default function EditTimeEntryDialog({
  entry,
  categories,
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

  // Get all time entries to find the previous entry
  const allTimeEntries = useStore(
    dataStore,
    (state) => state.time_entries as TimeEntry[]
  );
  const metricsData = useStore(dataStore, (state) => state.metrics) || [];
  const dailyLogsData = useStore(dataStore, (state) => state.daily_logs) || [];

  useEffect(() => {
    // Format dates for datetime-local inputs
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

      // Store the original entry for comparison
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

        // Sync with time metrics, passing the original entry for comparison
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
    // Get the current entry's start time
    const currentStartTime = new Date(entry.start_time).getTime();

    // Find all entries that ended before this one started
    const earlierEntries = allTimeEntries.filter(
      (e) =>
        e.id !== entry.id && new Date(e.end_time).getTime() <= currentStartTime
    );

    if (earlierEntries.length === 0) return null;

    // Sort by end time in descending order and take the most recent one
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

  // Convert categories to format expected by ReusableSelect
  const categoryOptions = categories.map((category) => ({
    id: category.id,
    label: category.name,
  }));

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
            <Label htmlFor="edit-description">Description</Label>
            <Input
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
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
            <Label htmlFor="edit-tags">Tags (comma-separated)</Label>
            <Input
              id="edit-tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="project, meeting, etc."
            />
          </div>
        </div>
      }
    />
  );
}
