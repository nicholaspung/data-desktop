import { TimeEntry } from "@/store/time-tracking-definitions";
import { Metric, DailyLog } from "@/store/experiment-definitions";
import { ApiService } from "@/services/api";
import { addEntry, updateEntry } from "@/store/data-store";
import { toast } from "sonner";

export async function syncTimeEntryWithMetrics(
  timeEntry: TimeEntry,
  metrics: Metric[],
  dailyLogs: DailyLog[],
  previousEntry?: TimeEntry
): Promise<void> {
  try {
    const matchingMetrics = metrics.filter(
      (metric) =>
        metric.type === "time" &&
        metric.active &&
        metric.name.toLowerCase() === timeEntry.description.toLowerCase()
    );

    if (matchingMetrics.length === 0) {
      if (previousEntry) {
        await handlePreviousEntryUpdate(previousEntry, metrics, dailyLogs);
      }
      return;
    }

    const entryDate = new Date(timeEntry.start_time);
    entryDate.setHours(0, 0, 0, 0);

    const durationMinutes = timeEntry.duration_minutes;

    for (const metric of matchingMetrics) {
      const existingLog = dailyLogs.find((log) => {
        const logDate = new Date(log.date);
        logDate.setHours(0, 0, 0, 0);
        return (
          logDate.getTime() === entryDate.getTime() &&
          log.metric_id === metric.id
        );
      });

      if (existingLog) {
        let currentValue = parseFloat(existingLog.value) || 0;

        if (
          previousEntry &&
          previousEntry.description.toLowerCase() === metric.name.toLowerCase()
        ) {
          currentValue -= previousEntry.duration_minutes;
          if (currentValue < 0) currentValue = 0;
        }

        currentValue += durationMinutes;

        const response = await ApiService.updateRecord(existingLog.id, {
          ...existingLog,
          value: JSON.stringify(currentValue),
        });

        if (response) {
          updateEntry(existingLog.id, response, "daily_logs");
        }
      } else {
        const newLog = {
          date: entryDate,
          metric_id: metric.id,
          value: JSON.stringify(durationMinutes),
          notes: `Automatically tracked from time entry: ${timeEntry.description}`,
        };

        const response = await ApiService.addRecord("daily_logs", newLog);
        if (response) {
          addEntry(response, "daily_logs");
        }
      }
    }

    if (
      previousEntry &&
      previousEntry.description.toLowerCase() !==
        timeEntry.description.toLowerCase()
    ) {
      await handlePreviousEntryUpdate(previousEntry, metrics, dailyLogs);
    }
  } catch (error) {
    console.error("Error syncing time entry with metrics:", error);
    toast.error("Failed to sync time with metrics");
  }
}

async function handlePreviousEntryUpdate(
  previousEntry: TimeEntry,
  metrics: Metric[],
  dailyLogs: DailyLog[]
): Promise<void> {
  const prevMatchingMetrics = metrics.filter(
    (metric) =>
      metric.type === "time" &&
      metric.active &&
      metric.name.toLowerCase() === previousEntry.description.toLowerCase()
  );

  if (prevMatchingMetrics.length === 0) return;

  const entryDate = new Date(previousEntry.start_time);
  entryDate.setHours(0, 0, 0, 0);

  for (const metric of prevMatchingMetrics) {
    const existingLog = dailyLogs.find((log) => {
      const logDate = new Date(log.date);
      logDate.setHours(0, 0, 0, 0);
      return (
        logDate.getTime() === entryDate.getTime() && log.metric_id === metric.id
      );
    });

    if (existingLog) {
      let currentValue = parseFloat(existingLog.value) || 0;

      currentValue -= previousEntry.duration_minutes;

      if (currentValue < 0) currentValue = 0;

      const response = await ApiService.updateRecord(existingLog.id, {
        ...existingLog,
        value: JSON.stringify(currentValue),
      });

      if (response) {
        updateEntry(existingLog.id, response, "daily_logs");
      }
    }
  }
}
