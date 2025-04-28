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
import { syncTimeEntryWithMetrics } from "./time-metrics-sync";
import { TimeEntry } from "@/store/time-tracking-definitions";

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
  const metricsData = useStore(dataStore, (state) => state.metrics) || [];
  const dailyLogsData = useStore(dataStore, (state) => state.daily_logs) || [];

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

      const newEntry = {
        description,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        duration_minutes: durationMinutes,
        category_id: categoryId,
        tags,
        private: false,
      };

      const response = await ApiService.addRecord("time_entries", newEntry);

      if (response) {
        addEntry(response, "time_entries");

        // Add this to sync with time metrics
        await syncTimeEntryWithMetrics(
          response as TimeEntry,
          metricsData,
          dailyLogsData
        );

        onDataChange();
      }

      // Reset global timer state
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

      <PopoverContent
        className="w-[calc(100vw-4rem)] p-0 relative mt-2"
        align="center"
        sideOffset={5}
      >
        {/* Triangle pointer */}
        <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-4 h-4 rotate-45 bg-background border-t border-l border-border z-10" />

        <div className="p-2 relative z-20">
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
