// src/features/daily-tracker/streak-utils.ts
import { DailyLog } from "@/store/experiment-definitions";
import { differenceInDays, addDays, parseISO, format } from "date-fns";

/**
 * Get just the date portion (YYYY-MM-DD) for consistency across comparisons
 */
function getDateString(date: Date | string): string {
  const dateObj = typeof date === "string" ? parseISO(date) : date;
  return format(dateObj, "yyyy-MM-dd");
}

/**
 * Calculates the current and longest streaks for a metric
 * @param logs Array of daily logs for a specific metric
 * @param metricId The ID of the metric to calculate streaks for
 * @param metricType The type of the metric (boolean, number, etc.)
 * @param currentDate The reference date for calculating the current streak
 * @returns Object containing the current streak and longest streak
 */
export function calculateStreaks(
  logs: DailyLog[],
  metricId: string,
  metricType: string,
  currentDate: Date = new Date()
): { currentStreak: number; longestStreak: number } {
  // Filter logs for this specific metric
  const metricLogs = logs.filter((log) => log.metric_id === metricId);

  // Get the current date string (YYYY-MM-DD)
  const currentDateString = getDateString(currentDate);

  // Group logs by date string to handle multiple logs on the same day
  const logsByDate = new Map<string, DailyLog[]>();

  metricLogs.forEach((log) => {
    const dateString = getDateString(log.date);
    if (!logsByDate.has(dateString)) {
      logsByDate.set(dateString, []);
    }
    logsByDate.get(dateString)!.push(log);
  });

  // Get all unique dates and sort them (newest first for current streak, oldest first for longest streak)
  const allDates = Array.from(logsByDate.keys()).sort().reverse();

  if (allDates.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  // Calculate current streak (must be consecutive up to today or yesterday)
  let currentStreak = 0;
  const lastLogDate = parseISO(allDates[0]);
  const todayDate = parseISO(currentDateString);

  // Check if the last log is from today or yesterday
  const dayDiff = differenceInDays(todayDate, lastLogDate);

  if (dayDiff <= 1) {
    let checkDate = new Date(todayDate);
    if (dayDiff === 1) {
      // If last log was yesterday, we need to start from yesterday
      checkDate = lastLogDate;
    }

    let continuousStreak = true;

    // Start loop for checking consecutive days
    while (continuousStreak) {
      const checkDateString = getDateString(checkDate);
      const logsForDate = logsByDate.get(checkDateString) || [];

      if (logsForDate.length === 0) {
        continuousStreak = false;
      } else {
        // For boolean metrics, check if any log has a true value
        if (metricType === "boolean") {
          const hasCompletedLog = logsForDate.some((log) => {
            try {
              return JSON.parse(log.value) === true;
            } catch {
              return false;
            }
          });

          if (hasCompletedLog) {
            currentStreak++;
          } else {
            continuousStreak = false;
          }
        } else {
          // For other metrics, any logged value counts
          currentStreak++;
        }
      }

      // Move to the previous day
      checkDate = addDays(checkDate, -1);

      // If we didn't find a log for the current day we're checking, stop
      if (!continuousStreak) break;
    }
  }

  // Calculate longest streak
  const datesSorted = [...allDates].reverse(); // Oldest to newest
  let longestStreak = 0;
  let tempStreak = 0;

  // Check each date for consecutive sequences
  for (let i = 0; i < datesSorted.length; i++) {
    const currentDateStr = datesSorted[i];
    const logsForDate = logsByDate.get(currentDateStr) || [];

    // Check if the current date's logs have valid completed states
    let isCompleted = true;
    if (metricType === "boolean") {
      isCompleted = logsForDate.some((log) => {
        try {
          return JSON.parse(log.value) === true;
        } catch {
          return false;
        }
      });
    }

    if (logsForDate.length > 0 && (metricType !== "boolean" || isCompleted)) {
      // Start or continue a streak
      if (i === 0) {
        tempStreak = 1;
      } else {
        // Check if this is consecutive with the previous date
        const prevDate = parseISO(datesSorted[i - 1]);
        const currDate = parseISO(currentDateStr);

        // Calculate the difference in days
        const daysBetween = Math.round(differenceInDays(currDate, prevDate));

        if (daysBetween === 1) {
          // Consecutive day, continue streak
          tempStreak++;
        } else {
          // Not consecutive, start a new streak
          tempStreak = 1;
        }
      }

      // Update longest streak if this sequence is longer
      if (tempStreak > longestStreak) {
        longestStreak = tempStreak;
      }
    } else {
      // No valid completion for this date, start a new streak
      tempStreak = 0;
    }
  }

  return { currentStreak, longestStreak };
}
