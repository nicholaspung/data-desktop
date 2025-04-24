// src/features/time-tracker/time-tracker-form.tsx
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Play, Save } from "lucide-react";
import { TimeCategory } from "@/store/time-tracking-definitions";
import { ApiService } from "@/services/api";
import { calculateDurationMinutes, formatDuration } from "@/lib/time-utils";
import ReusableSelect from "@/components/reusable/reusable-select";
import { Switch } from "@/components/ui/switch";
import ReusableCard from "@/components/reusable/reusable-card";

interface TimeTrackerFormProps {
  categories: TimeCategory[];
  onDataChange: () => void;
}

export default function TimeTrackerForm({
  categories,
  onDataChange,
}: TimeTrackerFormProps) {
  // Form state
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState<string | undefined>(undefined);
  const [tags, setTags] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  // Timer state
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [timerStartTime, setTimerStartTime] = useState<Date | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Loading state
  const [isSaving, setIsSaving] = useState(false);

  // Add state
  const [addState, setAddState] = useState<"timer" | "manual">("timer");

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

      return () => clearInterval(interval);
    }
  }, [isTimerActive, timerStartTime]);

  // Reset form to initial state
  const resetForm = () => {
    setDescription("");
    setCategoryId(undefined);
    setTags("");
    setStartTime("");
    setEndTime("");
    setIsTimerActive(false);
    setTimerStartTime(null);
    setElapsedSeconds(0);
  };

  // Start the timer
  const handleStartTimer = () => {
    if (!description) return;

    setIsTimerActive(true);
    setTimerStartTime(new Date());
  };

  // Save the active timer
  const handleSaveTimer = async () => {
    if (!timerStartTime) return;

    try {
      setIsSaving(true);

      const endTime = new Date();
      const durationMinutes = Math.floor(elapsedSeconds / 60);

      await ApiService.addRecord("time_entries", {
        description,
        start_time: timerStartTime.toISOString(),
        end_time: endTime.toISOString(),
        duration_minutes: durationMinutes,
        category_id: categoryId,
        tags,
        private: false,
      });

      resetForm();
      onDataChange();
    } catch (error) {
      console.error("Error saving time entry:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle manual entry save
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
        private: false,
      });

      resetForm();
      onDataChange();
    } catch (error) {
      console.error("Error saving time entry:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // Set default start time for manual entry
  const setDefaultStartTime = () => {
    if (!startTime) {
      const now = new Date();
      const formattedNow = new Date(
        now.getTime() - now.getTimezoneOffset() * 60000
      )
        .toISOString()
        .slice(0, 16);
      setStartTime(formattedNow);
    }
  };

  // Render form with tabs when timer is not active
  return (
    <ReusableCard
      content={
        <div className="flex flex-col gap-4 p-4">
          <div className="flex flex-row justify-end">
            <div className="flex items-center gap-2">
              <Label htmlFor="add-state" className="cursor-pointer">
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
                  }
                }}
              />
              <Label htmlFor="add-state" className="cursor-pointer">
                Timer
              </Label>
            </div>
          </div>
          <div className="flex flex-row gap-4 items-end">
            <div className="flex-1 space-y-2">
              <Label htmlFor="description">What are you working on?</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Task description"
                className="h-10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
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

            <div className="space-y-2">
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input
                id="tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="project, meeting, etc."
                className="h-10"
              />
            </div>

            {addState === "timer" && (
              <div className="text-3xl font-mono font-bold">
                {formatDuration(elapsedSeconds)}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="start-time">Start Time</Label>
              <Input
                id="start-time"
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                onFocus={setDefaultStartTime}
                className="h-10"
              />
            </div>

            {addState === "manual" && (
              <div className="space-y-2">
                <Label htmlFor="end-time">End Time</Label>
                <Input
                  id="end-time"
                  type="datetime-local"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="h-10"
                />
              </div>
            )}

            <div>
              {!isTimerActive && addState === "timer" ? (
                <Button onClick={handleStartTimer} size="sm" className="px-4">
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
                  className="px-4"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? "Saving..." : "Save"}
                </Button>
              )}
            </div>
          </div>
        </div>
      }
    />
  );
}
