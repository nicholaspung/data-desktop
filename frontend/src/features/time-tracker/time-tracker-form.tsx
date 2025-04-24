// src/features/time-tracker/time-tracker-form.tsx
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Play, Save, Clock, TimerOff, PlusCircle, History } from "lucide-react";
import { TimeCategory, TimeEntry } from "@/store/time-tracking-definitions";
import { ApiService } from "@/services/api";
import { calculateDurationMinutes, formatDuration } from "@/lib/time-utils";
import ReusableSelect from "@/components/reusable/reusable-select";
import { Switch } from "@/components/ui/switch";
import ReusableCard from "@/components/reusable/reusable-card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useStore } from "@tanstack/react-store";
import dataStore from "@/store/data-store";

interface TimeTrackerFormProps {
  categories: TimeCategory[];
  onDataChange: () => void;
}

export default function TimeTrackerForm({
  categories,
  onDataChange,
}: TimeTrackerFormProps) {
  // Get time entries from store for previous entry reference
  const timeEntries = useStore(
    dataStore,
    (state) => state.time_entries as TimeEntry[]
  );

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

  // Initialize current time when switching to manual mode
  useEffect(() => {
    if (addState === "manual" && !startTime) {
      setCurrentTimeAsStartTime();
    }
  }, [addState]);

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
    const now = new Date();

    setIsTimerActive(true);
    setTimerStartTime(now);

    const formattedNow = formatDateForInput(now);
    setStartTime(formattedNow);
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

  // Render form with tabs when timer is not active
  return (
    <ReusableCard
      showHeader={false}
      cardClassName={cn(
        "border-2 shadow-lg transition-all duration-300",
        isTimerActive
          ? "border-green-500 dark:border-green-600 shadow-green-100 dark:shadow-green-900/20"
          : "border-blue-400 dark:border-blue-600 shadow-blue-100 dark:shadow-blue-900/10 hover:border-blue-500"
      )}
      content={
        <div className="flex flex-col gap-4 p-4">
          <div className="flex flex-row justify-between pt-2">
            <h3 className="text-xl font-bold flex items-center">
              {isTimerActive ? (
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
            <div className="flex items-center gap-2 bg-muted/50 rounded-full px-3 py-1 shadow-sm">
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
          </div>
          <Separator className="bg-muted" />
          <div className="flex flex-row gap-4 items-end flex-wrap md:flex-nowrap">
            <div className="flex-1 space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">
                What are you working on?
              </Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Task description"
                className="h-10 focus:ring-2 focus:ring-primary/50"
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

            <div className="space-y-2 flex-1">
              <Label htmlFor="tags" className="text-sm font-medium">
                Tags (comma-separated)
              </Label>
              <Input
                id="tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="project, meeting, etc."
                className="h-10 focus:ring-2 focus:ring-primary/50"
              />
            </div>

            {addState === "timer" && (
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
          </div>
        </div>
      }
    />
  );
}
