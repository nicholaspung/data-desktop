import { DailyLog } from "@/store/experiment-definitions";
import { differenceInDays, addDays, parseISO, format } from "date-fns";

function getDateString(date: Date | string): string {
  const dateObj = typeof date === "string" ? parseISO(date) : date;
  return format(dateObj, "yyyy-MM-dd");
}

function isLogCompleted(
  log: DailyLog,
  metricType: string,
  metric?: { goal_value?: string; goal_type?: string; default_value?: string }
): boolean {
  let loggedValue;
  try {
    loggedValue = JSON.parse(log.value);
  } catch {
    loggedValue = log.value;
  }

  if (metricType === "boolean") {
    return loggedValue === true;
  }

  if (metric) {
    const hasGoal =
      metric.goal_value !== undefined &&
      metric.goal_value !== null &&
      metric.goal_value !== "" &&
      metric.goal_value !== "0" &&
      metric.goal_type !== undefined &&
      metric.goal_type !== null;

    if (hasGoal) {
      let goalValue;
      try {
        goalValue = parseFloat(metric.goal_value!);
      } catch {
        goalValue = 0;
      }

      const numericLoggedValue = parseFloat(String(loggedValue)) || 0;

      switch (metric.goal_type) {
        case "minimum":
          return numericLoggedValue >= goalValue;
        case "maximum":
          return numericLoggedValue <= goalValue;
        case "exact":
          return numericLoggedValue === goalValue;
        default:
          return numericLoggedValue >= goalValue;
      }
    }

    const numericValue = parseFloat(String(loggedValue)) || 0;

    if (metric.goal_value === "0" || metric.default_value === "0") {
      return numericValue === 0;
    }

    return numericValue > 0;
  }

  const numericValue = parseFloat(String(loggedValue)) || 0;
  return numericValue > 0;
}

export function calculateStreaks(
  logs: DailyLog[],
  metricId: string,
  metricType: string,
  currentDate: Date = new Date(),
  metric?: { goal_value?: string; goal_type?: string; default_value?: string }
): { currentStreak: number; longestStreak: number } {
  const metricLogs = logs.filter((log) => log.metric_id === metricId);

  const currentDateString = getDateString(currentDate);

  const logsByDate = new Map<string, DailyLog[]>();

  metricLogs.forEach((log) => {
    const dateString = getDateString(log.date);
    if (!logsByDate.has(dateString)) {
      logsByDate.set(dateString, []);
    }
    logsByDate.get(dateString)!.push(log);
  });

  const allDates = Array.from(logsByDate.keys()).sort().reverse();

  if (allDates.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  let currentStreak = 0;
  const lastLogDate = parseISO(allDates[0]);
  const todayDate = parseISO(currentDateString);

  const dayDiff = differenceInDays(todayDate, lastLogDate);

  if (dayDiff <= 1) {
    let checkDate = new Date(todayDate);
    if (dayDiff === 1) {
      checkDate = lastLogDate;
    }

    let continuousStreak = true;

    while (continuousStreak) {
      const checkDateString = getDateString(checkDate);
      const logsForDate = logsByDate.get(checkDateString) || [];

      if (logsForDate.length === 0) {
        continuousStreak = false;
      } else {
        const hasCompletedLog = logsForDate.some((log) =>
          isLogCompleted(log, metricType, metric)
        );

        if (hasCompletedLog) {
          currentStreak++;
        } else {
          continuousStreak = false;
        }
      }

      checkDate = addDays(checkDate, -1);

      if (!continuousStreak) break;
    }
  }

  const datesSorted = [...allDates].reverse();
  let longestStreak = 0;
  let tempStreak = 0;

  for (let i = 0; i < datesSorted.length; i++) {
    const currentDateStr = datesSorted[i];
    const logsForDate = logsByDate.get(currentDateStr) || [];

    const isCompleted = logsForDate.some((log) =>
      isLogCompleted(log, metricType, metric)
    );

    if (logsForDate.length > 0 && isCompleted) {
      if (i === 0) {
        tempStreak = 1;
      } else {
        const prevDate = parseISO(datesSorted[i - 1]);
        const currDate = parseISO(currentDateStr);

        const daysBetween = Math.round(differenceInDays(currDate, prevDate));

        if (daysBetween === 1) {
          tempStreak++;
        } else {
          tempStreak = 1;
        }
      }

      if (tempStreak > longestStreak) {
        longestStreak = tempStreak;
      }
    } else {
      tempStreak = 0;
    }
  }

  return { currentStreak, longestStreak };
}
