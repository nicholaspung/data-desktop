// src/features/time-tracker/time-tracker-header-button.tsx
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Clock, StopCircle } from "lucide-react";
import { useStore } from "@tanstack/react-store";
import { formatDuration } from "@/lib/time-utils";
import {
  timeTrackerStore,
  updateElapsedTime,
  stopTimer,
} from "./time-tracker-store";
import TimeTrackerForm from "./time-tracker-form";
import { ApiService } from "@/services/api";
import dataStore, { addEntry } from "@/store/data-store";
import { cn } from "@/lib/utils";
import { useFieldDefinitions } from "@/features/field-definitions/field-definitions-store";
import useLoadData from "@/hooks/useLoadData";
import { Link } from "@tanstack/react-router";

interface TimeTrackerHeaderButtonProps {
  onDataChange: () => void;
}

export default function TimeTrackerHeaderButton({
  onDataChange,
}: TimeTrackerHeaderButtonProps) {
  const [open, setOpen] = useState(false);
  const isTimerActive = useStore(
    timeTrackerStore,
    (state) => state.isTimerActive
  );
  const startTime = useStore(timeTrackerStore, (state) => state.startTime);
  const description = useStore(timeTrackerStore, (state) => state.description);
  const categoryId = useStore(timeTrackerStore, (state) => state.categoryId);
  const tags = useStore(timeTrackerStore, (state) => state.tags);
  const elapsedSeconds = useStore(
    timeTrackerStore,
    (state) => state.elapsedSeconds
  );
  const [isSaving, setIsSaving] = useState(false);

  // Load categories for the form
  const { getDatasetFields } = useFieldDefinitions();
  const timeCategoryFields = getDatasetFields("time_categories");

  useLoadData({
    fields: timeCategoryFields,
    datasetId: "time_categories",
    title: "Categories",
    fetchDataNow: true,
  });

  const categories = useStore(
    dataStore,
    (state) => state.time_categories || []
  );

  // Update timer every second
  useEffect(() => {
    if (isTimerActive) {
      const interval = setInterval(() => {
        updateElapsedTime();
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isTimerActive]);

  // Close popover when timer starts
  useEffect(() => {
    if (isTimerActive) {
      setOpen(false);
    }
  }, [isTimerActive]);

  const handleStopTimer = async () => {
    if (!startTime) return;

    try {
      setIsSaving(true);

      const endTime = new Date();
      const durationMinutes = Math.ceil(elapsedSeconds / 60);

      const response = await ApiService.addRecord("time_entries", {
        description,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        duration_minutes: durationMinutes,
        category_id: categoryId,
        tags,
        private: false,
      });

      if (response) {
        addEntry(response, "time_entries");
        onDataChange();
      }

      // Reset timer - make sure we call stopTimer
      stopTimer();
    } catch (error) {
      console.error("Error saving time entry:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      {isTimerActive ? (
        <div className="flex items-center gap-2 border border-green-500 px-3 py-2 rounded-md bg-green-50 dark:bg-green-900/20">
          <Link to="/time-tracker">
            <div className="text-sm font-medium truncate max-w-[120px]">
              {description}
            </div>
            <div className="text-sm font-mono font-bold text-green-600 dark:text-green-400">
              {formatDuration(elapsedSeconds)}
            </div>
          </Link>
          <Button
            variant="outline"
            size="icon"
            className={cn(
              "h-7 w-7 rounded-full border-green-500",
              isSaving ? "animate-pulse" : ""
            )}
            onClick={handleStopTimer}
            disabled={isSaving}
          >
            <StopCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
          </Button>
        </div>
      ) : (
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Clock className="h-4 w-4" />
            <span>Track Time</span>
          </Button>
        </PopoverTrigger>
      )}

      <PopoverContent className="w-[calc(100vw-4rem)] p-0" align="center">
        <div className="p-2">
          <TimeTrackerForm
            categories={categories}
            onDataChange={() => {
              onDataChange();
              setOpen(false);
            }}
            inPopover={true}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
