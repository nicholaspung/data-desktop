import { Metric } from "@/store/experiment-definitions";
import {
  isBefore,
  isAfter,
  isSameDay,
  differenceInDays,
  differenceInWeeks,
  addWeeks,
  differenceInMonths,
  addMonths,
} from "date-fns";

export function isMetricScheduledForDate(metric: Metric, date: Date): boolean {
  if (
    !metric.schedule_frequency &&
    !metric.schedule_start_date &&
    !metric.schedule_end_date &&
    !metric.schedule_days
  ) {
    return true;
  }

  let startDate: Date | null = null;
  if (metric.schedule_start_date) {
    startDate = new Date(metric.schedule_start_date);
    if (isBefore(date, startDate) && !isSameDay(date, startDate)) {
      return false;
    }
  }

  if (metric.schedule_end_date) {
    const endDate = new Date(metric.schedule_end_date);
    if (isAfter(date, endDate) && !isSameDay(date, endDate)) {
      return false;
    }
  }

  const intervalValue = metric.schedule_interval_value || 1;
  const intervalUnit = metric.schedule_interval_unit || "days";

  switch (metric.schedule_frequency) {
    case "daily":
      return true;

    case "weekly":
      if (metric.schedule_days && metric.schedule_days.length > 0) {
        const dayOfWeek = date.getDay();
        return metric.schedule_days.includes(dayOfWeek);
      }
      return true;

    case "interval":
      if (
        !metric.schedule_start_date ||
        !metric.schedule_interval_value ||
        !startDate
      ) {
        return false;
      }

      switch (intervalUnit) {
        case "days": {
          const diffDays = differenceInDays(date, startDate);
          return diffDays >= 0 && diffDays % intervalValue === 0;
        }
        case "weeks": {
          const diffWeeks = differenceInWeeks(date, startDate);
          return (
            diffWeeks >= 0 &&
            diffWeeks % intervalValue === 0 &&
            isSameDay(date, addWeeks(startDate, diffWeeks))
          );
        }
        case "months": {
          const diffMonths = differenceInMonths(date, startDate);
          return (
            diffMonths >= 0 &&
            diffMonths % intervalValue === 0 &&
            isSameDay(date, addMonths(startDate, diffMonths))
          );
        }
        default:
          return false;
      }

    case "custom":
      if (metric.schedule_days && metric.schedule_days.length > 0) {
        const dayOfWeek = date.getDay();
        return metric.schedule_days.includes(dayOfWeek);
      }
      return false;

    default:
      if (metric.schedule_days && metric.schedule_days.length > 0) {
        const dayOfWeek = date.getDay();
        return metric.schedule_days.includes(dayOfWeek);
      }
      return true;
  }
}

export function parseScheduleDays(days: number[] | undefined): number[] {
  if (!days) return [];

  try {
    if (Array.isArray(days)) {
      return days.filter(
        (day) => typeof day === "number" && day >= 0 && day <= 6
      );
    }
  } catch (e) {
    console.error("Error parsing schedule days:", e);
  }

  return [];
}

export function formatScheduleDays(days: number[]): string {
  if (!days || days.length === 0) return "No days selected";

  const dayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  if (days.length === 7) return "Every day";

  if (
    days.length === 5 &&
    days.includes(1) &&
    days.includes(2) &&
    days.includes(3) &&
    days.includes(4) &&
    days.includes(5) &&
    !days.includes(0) &&
    !days.includes(6)
  ) {
    return "Weekdays";
  }

  if (days.length === 2 && days.includes(0) && days.includes(6)) {
    return "Weekends";
  }

  return days.map((day) => dayNames[day]).join(", ");
}
