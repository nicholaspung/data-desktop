// Create a new file: src/features/time-tracker/time-metrics-sync.ts

import { TimeEntry } from "@/store/time-tracking-definitions";
import { Metric, DailyLog } from "@/store/experiment-definitions";
import { ApiService } from "@/services/api";
import { addEntry, updateEntry } from "@/store/data-store";
import { toast } from "sonner";

// Function to sync a time entry with related time metrics
export async function syncTimeEntryWithMetrics(
  timeEntry: TimeEntry,
  metrics: Metric[],
  dailyLogs: DailyLog[],
  previousEntry?: TimeEntry // For when we're updating
): Promise<void> {
  try {
    // Find metrics of type 'time' that match the description
    const matchingMetrics = metrics.filter(
      (metric) =>
        metric.type === "time" &&
        metric.active &&
        metric.name.toLowerCase() === timeEntry.description.toLowerCase()
    );

    if (matchingMetrics.length === 0) {
      // If we're updating and the previous entry had a matching metric, we need to decrement
      if (previousEntry) {
        await handlePreviousEntryUpdate(previousEntry, metrics, dailyLogs);
      }
      return;
    }

    // Get the entry date (just the day part)
    const entryDate = new Date(timeEntry.start_time);
    entryDate.setHours(0, 0, 0, 0);

    // Duration in minutes
    const durationMinutes = timeEntry.duration_minutes;

    // For each matching metric, update its value for the day
    for (const metric of matchingMetrics) {
      // Find if there's already a log for this metric on this day
      const existingLog = dailyLogs.find((log) => {
        const logDate = new Date(log.date);
        logDate.setHours(0, 0, 0, 0);
        return (
          logDate.getTime() === entryDate.getTime() &&
          log.metric_id === metric.id
        );
      });

      if (existingLog) {
        // If updating an entry, subtract the previous duration first
        let currentValue = parseFloat(existingLog.value) || 0;

        // If we're updating, remove the previous duration
        if (
          previousEntry &&
          previousEntry.description.toLowerCase() === metric.name.toLowerCase()
        ) {
          currentValue -= previousEntry.duration_minutes;
          if (currentValue < 0) currentValue = 0;
        }

        // Add the new duration
        currentValue += durationMinutes;

        // Update the log
        const response = await ApiService.updateRecord(existingLog.id, {
          ...existingLog,
          value: JSON.stringify(currentValue),
        });

        if (response) {
          updateEntry(existingLog.id, response, "daily_logs");
          // No need to show toast for every update
        }
      } else {
        // Create a new log
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

    // If updating and the description changed, handle the previous entry's metrics
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

// Helper function to handle updates when an entry description changes
async function handlePreviousEntryUpdate(
  previousEntry: TimeEntry,
  metrics: Metric[],
  dailyLogs: DailyLog[]
): Promise<void> {
  // Find metrics that matched the previous description
  const prevMatchingMetrics = metrics.filter(
    (metric) =>
      metric.type === "time" &&
      metric.active &&
      metric.name.toLowerCase() === previousEntry.description.toLowerCase()
  );

  if (prevMatchingMetrics.length === 0) return;

  // Get the entry date
  const entryDate = new Date(previousEntry.start_time);
  entryDate.setHours(0, 0, 0, 0);

  // For each previously matching metric, decrement its value
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

      // Subtract the previous duration
      currentValue -= previousEntry.duration_minutes;

      // Ensure value doesn't go below zero
      if (currentValue < 0) currentValue = 0;

      // Update the log
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
