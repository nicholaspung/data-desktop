// src/features/time-tracker/pomodoro-timer.tsx
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useStore } from "@tanstack/react-store";
import {
  pomodoroStore,
  startPomodoro,
  startBreak,
  stopPomodoro,
  updateRemainingTime,
} from "./pomodoro-store";
import { ApiService } from "@/services/api";
import dataStore, { addEntry } from "@/store/data-store";
import { Clock, StopCircle, Coffee } from "lucide-react";
import { cn } from "@/lib/utils";
import { TimeCategory, TimeEntry } from "@/store/time-tracking-definitions";
import { formatDuration } from "@/lib/time-utils";
import PomodoroSettings from "./pomodoro-settings";
import { syncTimeEntryWithMetrics } from "./time-metrics-sync";
import { Label } from "@/components/ui/label";

interface PomodoroTimerProps {
  categories: TimeCategory[];
  onDataChange: () => void;
  description: string;
  categoryId?: string;
  tags: string;
}

export default function PomodoroTimer({
  onDataChange,
  description,
  categoryId,
  tags,
}: PomodoroTimerProps) {
  const isActive = useStore(pomodoroStore, (state) => state.isActive);
  const isBreak = useStore(pomodoroStore, (state) => state.isBreak);
  const startTime = useStore(pomodoroStore, (state) => state.startTime);
  const remainingSeconds = useStore(
    pomodoroStore,
    (state) => state.remainingSeconds
  );
  const remainingBreakSeconds = useStore(
    pomodoroStore,
    (state) => state.remainingBreakSeconds
  );
  const totalSeconds = useStore(pomodoroStore, (state) => state.totalSeconds);
  const breakSeconds = useStore(pomodoroStore, (state) => state.breakSeconds);
  const pomodoroDescription = useStore(
    pomodoroStore,
    (state) => state.description
  );
  const pomodoroTags = useStore(pomodoroStore, (state) => state.tags);
  const metricsData = useStore(dataStore, (state) => state.metrics || []);
  const dailyLogsData = useStore(dataStore, (state) => state.daily_logs || []);

  const [isSaving, setIsSaving] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [notificationPermission, setNotificationPermission] =
    useState<NotificationPermission | null>(null);

  // Initialize audio
  useEffect(() => {
    audioRef.current = new Audio("/pomodoro-end.mp3");
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Timer update effect
  useEffect(() => {
    if (isActive) {
      const interval = setInterval(() => {
        updateRemainingTime();
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isActive]);

  // Check for timer completion
  useEffect(() => {
    if (isActive && !isBreak && remainingSeconds === 0) {
      // Pomodoro completed
      if (audioRef.current) {
        audioRef.current
          .play()
          .catch((err) => console.error("Error playing audio:", err));
      }

      // You can show a notification here if needed
      // We don't automatically switch to break mode here
      // as we want the user to explicitly end the pomodoro
    }

    if (isActive && isBreak && remainingBreakSeconds === 0) {
      // Break completed
      if (audioRef.current) {
        audioRef.current
          .play()
          .catch((err) => console.error("Error playing audio:", err));
      }

      // You can show a notification here if needed
      // We don't automatically end the break here
      // as we want the user to explicitly end the break
    }
  }, [isActive, isBreak, remainingSeconds, remainingBreakSeconds]);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setNotificationPermission(Notification.permission);

      // Update permission state if it changes
      const handlePermissionChange = () => {
        setNotificationPermission(Notification.permission);
      };

      // Modern browsers don't support the permission change event anymore,
      // but we'll keep this for older browsers that might
      if ("onpermissionchange" in Notification.prototype) {
        Notification.prototype.onpermissionchange = handlePermissionChange;
      }
    }
  }, []);

  const requestNotificationPermission = async () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
    }
  };

  const handleStartPomodoro = () => {
    startPomodoro(description, categoryId, tags);
    onDataChange();
  };

  const handleEndPomodoro = async () => {
    if (!startTime) return;

    try {
      setIsSaving(true);

      const endTime = new Date();
      const durationMinutes = Math.ceil((totalSeconds - remainingSeconds) / 60);

      const newEntry = {
        description: pomodoroDescription,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        duration_minutes: durationMinutes,
        category_id: categoryId,
        tags: pomodoroTags,
        private: false,
      };

      const response = await ApiService.addRecord("time_entries", newEntry);

      if (response) {
        addEntry(response, "time_entries");
        await syncTimeEntryWithMetrics(
          response as TimeEntry,
          metricsData,
          dailyLogsData
        );
        onDataChange();
      }

      // Switch to break mode
      startBreak();
    } catch (error) {
      console.error("Error saving pomodoro entry:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEndBreak = async () => {
    if (!startTime) return;

    try {
      setIsSaving(true);

      const endTime = new Date();
      const durationMinutes = Math.ceil(
        (breakSeconds - remainingBreakSeconds) / 60
      );

      const newEntry = {
        description: `${pomodoroDescription} - Break`,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        duration_minutes: durationMinutes,
        category_id: categoryId,
        tags: pomodoroTags, // Already includes "pomodoro break" from startBreak()
        private: false,
      };

      const response = await ApiService.addRecord("time_entries", newEntry);

      if (response) {
        addEntry(response, "time_entries");
        await syncTimeEntryWithMetrics(
          response as TimeEntry,
          metricsData,
          dailyLogsData
        );
        onDataChange();
      }

      // Stop the pomodoro completely
      stopPomodoro();
    } catch (error) {
      console.error("Error saving break entry:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const progressPercentage = isBreak
    ? ((breakSeconds - remainingBreakSeconds) / breakSeconds) * 100
    : ((totalSeconds - remainingSeconds) / totalSeconds) * 100;

  if (!isActive) {
    return (
      <div className="flex flex-row items-end gap-4">
        <div className="space-y-3">
          <Label htmlFor="category" className="text-sm font-medium">
            Pomodoro settings
          </Label>
          <div className="flex flex-row gap-4">
            <PomodoroSettings />
            <div className="text-3xl font-mono font-bold">
              {isBreak
                ? formatDuration(remainingBreakSeconds)
                : formatDuration(remainingSeconds)}
            </div>
          </div>
        </div>
        <Button
          onClick={handleStartPomodoro}
          className="gap-2 h-10 bg-blue-600 hover:bg-blue-700 font-medium"
          disabled={!description}
        >
          <Clock className="h-4 w-4" />
          <span>Start Pomodoro</span>
        </Button>
        {notificationPermission === "default" && (
          <Button
            onClick={requestNotificationPermission}
            variant="ghost"
            size="sm"
            className="text-xs"
            title="Enable notifications for Pomodoro alerts"
          >
            Enable notifications
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {!isActive && (
        <div className="flex flex-col justify-between items-center">
          <PomodoroSettings />
          {notificationPermission === "default" && (
            <Button
              onClick={requestNotificationPermission}
              variant="ghost"
              size="sm"
              className="text-xs"
              title="Enable notifications for Pomodoro alerts"
            >
              Enable notifications
            </Button>
          )}
        </div>
      )}

      <div className="relative h-2 bg-muted rounded-full overflow-hidden mt-2">
        <div
          className={cn(
            "h-full rounded-full",
            isBreak ? "bg-blue-500" : "bg-red-500"
          )}
          style={{ width: `${progressPercentage}%` }}
        ></div>
      </div>

      <div className="flex justify-between items-center gap-2">
        <div className="text-3xl font-mono font-bold">
          {isBreak
            ? formatDuration(remainingBreakSeconds)
            : formatDuration(remainingSeconds)}
        </div>

        {isBreak ? (
          <Button
            onClick={handleEndBreak}
            variant="outline"
            className="gap-2 h-10"
            disabled={isSaving}
          >
            <StopCircle className="h-4 w-4" />
            {isSaving ? "Saving..." : "End Break"}
          </Button>
        ) : (
          <Button
            onClick={handleEndPomodoro}
            variant="outline"
            className="gap-2 h-10"
            disabled={isSaving}
          >
            <Coffee className="h-4 w-4" />
            {isSaving ? "Saving..." : "End Pomodoro"}
          </Button>
        )}
      </div>
    </div>
  );
}
