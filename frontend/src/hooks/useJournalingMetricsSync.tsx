// src/hooks/useJournalingMetricsSync.tsx
import { useState, useEffect } from "react";
import { useStore } from "@tanstack/react-store";
import dataStore, { addEntry, updateEntry } from "@/store/data-store";
import { ApiService } from "@/services/api";
import { DailyLog, Metric } from "@/store/experiment-definitions";
import {
  GratitudeJournalEntry,
  QuestionJournalEntry,
  CreativityJournalEntry,
  Affirmation,
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
  const affirmations = useStore(
    dataStore,
    (state) => state.affirmation as Affirmation[]
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
        const journalingMetricNames = defaultJournalingMetrics.map((m) =>
          m.name?.toLowerCase()
        );
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
  const syncJournalingMetrics = async () => {
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

      const todayAffirmation = affirmations.find((entry) => {
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
        let completed = false;

        // Determine if the metric is completed based on journaling activity
        switch (metric.name?.toLowerCase()) {
          case "completed daily question":
            completed = !!todayQuestionEntry;
            break;
          case "completed 3 gratitude entries":
            completed = todayGratitudeEntries.length >= 3;
            break;
          case "completed creativity journal":
            completed = !!todayCreativityEntry;
            break;
          case "completed daily affirmation":
            completed = !!todayAffirmation;
            break;
        }

        // Update or create log as needed
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
  };

  // Return the sync function and loading state
  return { syncJournalingMetrics, isLoading };
}
