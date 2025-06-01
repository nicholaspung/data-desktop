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

  useEffect(() => {
    const loadMetrics = async () => {
      setIsLoading(true);
      try {
        const allMetrics =
          await ApiService.getRecordsWithRelations<Metric>("metrics");

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

  const syncJournalingMetrics = useCallback(async () => {
    if (isLoading || metrics.length === 0) return;

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

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

      const todayLogs = dailyLogs.filter((log) => {
        const logDate = new Date(log.date);
        logDate.setHours(0, 0, 0, 0);
        return (
          logDate.getTime() === today.getTime() &&
          metrics.some((m) => m.id === log.metric_id)
        );
      });

      for (const metric of metrics) {
        const existingLog = todayLogs.find(
          (log) => log.metric_id === metric.id
        );

        const metricName = metric.name?.toLowerCase();

        if (metricName === "gratitude journal entries") {
          const gratitudeCount = todayGratitudeEntries.length;
          const isCompleted = gratitudeCount >= 3;

          if (existingLog) {
            const currentValue = parseInt(existingLog.value) || 0;
            if (currentValue !== gratitudeCount) {
              const response = await ApiService.updateRecord(existingLog.id, {
                ...existingLog,
                value: JSON.stringify(gratitudeCount),
                notes: `${gratitudeCount} entries today. ${isCompleted ? "Goal reached!" : "Goal: 3 entries"}`,
              });
              if (response) {
                updateEntry(existingLog.id, response, "daily_logs");
              }
            }
          } else if (gratitudeCount > 0) {
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
          continue;
        }

        let completed = false;

        switch (metricName) {
          case "completed daily question":
            completed = !!todayQuestionEntry;
            break;
          case "completed creativity journal":
            completed = !!todayCreativityEntry;
            break;
          case "completed 3 gratitude entries":
            completed = todayGratitudeEntries.length >= 3;
            break;
        }

        if (existingLog) {
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

  return { syncJournalingMetrics, isLoading };
}
