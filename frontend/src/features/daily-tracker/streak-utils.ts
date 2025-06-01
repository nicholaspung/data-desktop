import { DailyLog } from "@/store/experiment-definitions";
import { differenceInDays, addDays, parseISO, format } from "date-fns";

function getDateString(date: Date | string): string {
  const dateObj = typeof date === "string" ? parseISO(date) : date;
  return format(dateObj, "yyyy-MM-dd");
}

export function calculateStreaks(
  logs: DailyLog[],
  metricId: string,
  metricType: string,
  currentDate: Date = new Date()
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
          currentStreak++;
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
