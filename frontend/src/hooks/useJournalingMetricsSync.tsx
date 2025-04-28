// src/hooks/useJournalingMetricsSync.tsx
import { useState, useEffect, useCallback } from "react";
import { useStore } from "@tanstack/react-store";
import dataStore, { addEntry, updateEntry } from "@/store/data-store";
import { ApiService } from "@/services/api";
import { DailyLog, Metric } from "@/store/experiment-definitions";
import {
  GratitudeJournalEntry,
  QuestionJournalEntry,
  CreativityJournalEntry,
} from "@/store/journaling-definitions";
import { defaultJournalingMetrics } from "@/features/daily-tracker/default-metrics";

export function useJournalingMetricsSync() {
  const [isLoading, setIsLoading] = useState(false);
  const [metrics, setMetrics] = useState<Metric[]>([]);

  // Get all journaling entries for today
  const gratitudeEntries = useStore(
    dataStore,
    (state) => state.gratitude_journal as GratitudeJournalEntry[]
  );
  const questionEntries = useStore(
    dataStore,
    (state) => state.question_journal as QuestionJournalEntry[]
  );
  const creativityEntries = useStore(
    dataStore,
    (state) => state.creativity_journal as CreativityJournalEntry[]
  );
  const dailyLogs = useStore(
    dataStore,
    (state) => state.daily_logs as DailyLog[]
  );

  // Load metrics related to journaling
  useEffect(() => {
    const loadMetrics = async () => {
      setIsLoading(true);
      try {
        const allMetrics =
          await ApiService.getRecordsWithRelations<Metric>("metrics");

        // Filter for journaling metrics (those with names matching our default metrics)
        // Exclude the affirmation metric since it's handled separately now
        const journalingMetricNames = defaultJournalingMetrics
          .filter((m) => !m.name?.toLowerCase().includes("affirmation"))
          .map((m) => m.name?.toLowerCase());

        const journalingMetrics = allMetrics.filter((m) =>
          journalingMetricNames.includes(m.name?.toLowerCase())
        );

        setMetrics(journalingMetrics);
      } catch (error) {
        console.error("Error loading journaling metrics:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadMetrics();
  }, []);

  // Function to sync journaling activities with metrics
  const syncJournalingMetrics = useCallback(async () => {
    if (isLoading || metrics.length === 0) return;

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Get today's entries
      const todayGratitudeEntries = gratitudeEntries.filter((entry) => {
        const entryDate = new Date(entry.date);
        entryDate.setHours(0, 0, 0, 0);
        return entryDate.getTime() === today.getTime();
      });

      const todayQuestionEntry = questionEntries.find((entry) => {
        const entryDate = new Date(entry.date);
        entryDate.setHours(0, 0, 0, 0);
        return entryDate.getTime() === today.getTime();
      });

      const todayCreativityEntry = creativityEntries.find((entry) => {
        const entryDate = new Date(entry.date);
        entryDate.setHours(0, 0, 0, 0);
        return entryDate.getTime() === today.getTime();
      });

      // Check if we already have logs for today for these metrics
      const todayLogs = dailyLogs.filter((log) => {
        const logDate = new Date(log.date);
        logDate.setHours(0, 0, 0, 0);
        return (
          logDate.getTime() === today.getTime() &&
          metrics.some((m) => m.id === log.metric_id)
        );
      });

      // For each metric, check if it needs to be updated
      for (const metric of metrics) {
        // Find existing log for this metric
        const existingLog = todayLogs.find(
          (log) => log.metric_id === metric.id
        );

        const metricName = metric.name?.toLowerCase();

        // Handle different metrics based on their name
        if (metricName === "gratitude journal entries") {
          // This is our numeric gratitude counter
          const gratitudeCount = todayGratitudeEntries.length;
          const isCompleted = gratitudeCount >= 3; // Consider 3+ entries as "completed"

          // For numeric metrics, store the actual count rather than just boolean
          if (existingLog) {
            const currentValue = parseInt(existingLog.value) || 0;
            // Only update if the count has changed
            if (currentValue !== gratitudeCount) {
              const response = await ApiService.updateRecord(existingLog.id, {
                ...existingLog,
                value: JSON.stringify(gratitudeCount),
                // Add note about completion status
                notes: `${gratitudeCount} entries today. ${isCompleted ? "Goal reached!" : "Goal: 3 entries"}`,
              });
              if (response) {
                updateEntry(existingLog.id, response, "daily_logs");
              }
            }
          } else if (gratitudeCount > 0) {
            // Create new log with the current count
            const response = await ApiService.addRecord("daily_logs", {
              date: today,
              metric_id: metric.id,
              value: JSON.stringify(gratitudeCount),
              notes: `${gratitudeCount} entries today. ${isCompleted ? "Goal reached!" : "Goal: 3 entries"}`,
            });
            if (response) {
              addEntry(response, "daily_logs");
            }
          }
          continue; // Skip the rest of the loop for this metric
        }

        // Handle boolean metrics as before
        let completed = false;

        // Determine if the metric is completed based on journaling activity
        switch (metricName) {
          case "completed daily question":
            completed = !!todayQuestionEntry;
            break;
          case "completed creativity journal":
            completed = !!todayCreativityEntry;
            break;
          case "completed 3 gratitude entries":
            // For backward compatibility, keep the boolean version too
            completed = todayGratitudeEntries.length >= 3;
            break;
        }

        // Update or create log as needed for boolean metrics
        if (existingLog) {
          // Only update if the completion status changed
          const currentValue = JSON.parse(existingLog.value);
          if (currentValue !== completed) {
            const response = await ApiService.updateRecord(existingLog.id, {
              ...existingLog,
              value: JSON.stringify(completed),
            });
            if (response) {
              updateEntry(existingLog.id, response, "daily_logs");
            }
          }
        } else if (completed) {
          // Create new log if completed and no log exists yet
          const response = await ApiService.addRecord("daily_logs", {
            date: today,
            metric_id: metric.id,
            value: JSON.stringify(completed),
            notes: `Automatically tracked from journaling activity`,
          });
          if (response) {
            addEntry(response, "daily_logs");
          }
        }
      }
    } catch (error) {
      console.error("Error syncing journaling metrics:", error);
    }
  }, [
    isLoading,
    metrics,
    gratitudeEntries,
    questionEntries,
    creativityEntries,
    dailyLogs,
  ]);

  // Return the sync function and loading state
  return { syncJournalingMetrics, isLoading };
}
