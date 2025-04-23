// src/features/time-tracker/active-timer.tsx
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Pause, Play, Save, X } from "lucide-react";
import { TimeCategory } from "@/store/time-tracking-definitions";
import { ApiService } from "@/services/api";
import { formatDuration } from "@/lib/time-utils";
import { Badge } from "@/components/ui/badge";

interface ActiveTimerProps {
  description: string;
  categoryId?: string;
  tags?: string;
  startTime: Date;
  onStop: () => void;
  onComplete: () => void;
  categories: TimeCategory[];
}

export default function ActiveTimer({
  description,
  categoryId,
  tags,
  startTime,
  onStop,
  onComplete,
  categories,
}: ActiveTimerProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [pausedTime, setPausedTime] = useState(0);
  const [pauseStartTime, setPauseStartTime] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      const now = new Date();
      const secondsDiff =
        Math.floor((now.getTime() - startTime.getTime()) / 1000) - pausedTime;
      setElapsedSeconds(secondsDiff);
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime, isPaused, pausedTime]);

  const handlePauseResume = () => {
    if (isPaused) {
      // Resume: Calculate additional paused time
      if (pauseStartTime) {
        const now = new Date();
        const additionalPauseTime = Math.floor(
          (now.getTime() - pauseStartTime.getTime()) / 1000
        );
        setPausedTime((prevPausedTime) => prevPausedTime + additionalPauseTime);
      }
      setPauseStartTime(null);
    } else {
      // Pause: Store the current time
      setPauseStartTime(new Date());
    }
    setIsPaused(!isPaused);
  };

  const getCategory = () => {
    if (!categoryId) return null;
    return categories.find((cat) => cat.id === categoryId);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);

      // Calculate end time
      const endTime = new Date();
      const totalMinutes = Math.floor((elapsedSeconds - pausedTime) / 60);

      // Create time entry
      await ApiService.addRecord("time_entries", {
        description,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        duration_minutes: totalMinutes,
        category_id: categoryId,
        tags: tags,
      });

      onComplete();
      onStop();
    } catch (error) {
      console.error("Error saving time entry:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (
      confirm(
        "Are you sure you want to cancel this timer? The data will be lost."
      )
    ) {
      onStop();
    }
  };

  const category = getCategory();

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-lg font-medium">{description}</h3>
          <div className="flex flex-wrap gap-2 mt-2">
            {category && (
              <Badge
                style={{ backgroundColor: category.color || "#3b82f6" }}
                className="text-white"
              >
                {category.name}
              </Badge>
            )}
            {tags &&
              tags.split(",").map((tag) => (
                <Badge key={tag.trim()} variant="outline">
                  {tag.trim()}
                </Badge>
              ))}
          </div>
        </div>

        <div className="text-4xl font-bold font-mono">
          {formatDuration(elapsedSeconds)}
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={handlePauseResume}>
          {isPaused ? (
            <>
              <Play className="h-4 w-4 mr-2" />
              Resume
            </>
          ) : (
            <>
              <Pause className="h-4 w-4 mr-2" />
              Pause
            </>
          )}
        </Button>

        <Button variant="destructive" size="sm" onClick={handleCancel}>
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>

        <Button size="sm" onClick={handleSave} disabled={isSaving}>
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  );
}
