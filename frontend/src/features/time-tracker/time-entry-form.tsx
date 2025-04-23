// src/features/time-tracker/time-entry-form.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Play, Save } from "lucide-react";
import { TimeCategory } from "@/store/time-tracking-definitions";
import { ApiService } from "@/services/api";
import { calculateDurationMinutes } from "@/lib/time-utils";
import ReusableSelect from "@/components/reusable/reusable-select";

interface TimeEntryFormProps {
  onStartTimer: (
    description: string,
    categoryId?: string,
    tags?: string
  ) => void;
  onManualSave: () => void;
  categories: TimeCategory[];
}

export default function TimeEntryForm({
  onStartTimer,
  onManualSave,
  categories,
}: TimeEntryFormProps) {
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState<string | undefined>(undefined);
  const [tags, setTags] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const resetForm = () => {
    setDescription("");
    setCategoryId(undefined);
    setTags("");
    setStartTime("");
    setEndTime("");
  };

  const handleStartTimer = () => {
    if (!description) return;
    onStartTimer(description, categoryId, tags);
  };

  const handleManualSave = async () => {
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

      await ApiService.addRecord("time_entries", {
        description,
        start_time: startDate.toISOString(),
        end_time: endDate.toISOString(),
        duration_minutes: durationMinutes,
        category_id: categoryId,
        tags,
      });

      resetForm();
      onManualSave();
    } catch (error) {
      console.error("Error saving time entry:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // Set default start time to now for new entries
  const setDefaultStartTime = () => {
    if (!startTime) {
      const now = new Date();
      // Format as YYYY-MM-DDTHH:MM
      const formattedNow = new Date(
        now.getTime() - now.getTimezoneOffset() * 60000
      )
        .toISOString()
        .slice(0, 16);
      setStartTime(formattedNow);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Input
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What are you working on?"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <ReusableSelect
            options={categories.map((category) => ({
              value: category.id,
              label: category.name,
            }))}
            noDefault={false}
            value={categoryId}
            onChange={setCategoryId}
            title="category"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="tags">Tags (comma-separated)</Label>
          <Input
            id="tags"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="project, meeting, etc."
          />
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 pt-4">
        <Button
          onClick={handleStartTimer}
          disabled={!description}
          className="flex-1"
        >
          <Play className="mr-2 h-4 w-4" />
          Start Timer
        </Button>

        <div className="flex-1 space-y-2">
          <div className="text-sm font-medium">Or enter time manually:</div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="start-time" className="sr-only">
                Start Time
              </Label>
              <Input
                id="start-time"
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                onFocus={setDefaultStartTime}
              />
            </div>
            <div>
              <Label htmlFor="end-time" className="sr-only">
                End Time
              </Label>
              <Input
                id="end-time"
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>
          <Button
            variant="outline"
            onClick={handleManualSave}
            disabled={!description || !startTime || !endTime || isSaving}
            className="w-full"
          >
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? "Saving..." : "Save Entry"}
          </Button>
        </div>
      </div>
    </div>
  );
}
