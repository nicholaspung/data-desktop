// src/features/experiments/schedule-utils.ts
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

/**
 * Checks if a metric is scheduled to be shown on a given date
 */
export function isMetricScheduledForDate(metric: Metric, date: Date): boolean {
  // If no scheduling is set, the metric is always shown
  if (
    !metric.schedule_frequency &&
    !metric.schedule_start_date &&
    !metric.schedule_end_date &&
    !metric.schedule_days
  ) {
    return true;
  }

  let startDate: Date | null = null;
  // Check if date is within the schedule's date range
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

  // Check frequency type
  switch (metric.schedule_frequency) {
    case "daily":
      return true;

    case "weekly":
      // Weekly scheduling: check day of week
      if (metric.schedule_days && metric.schedule_days.length > 0) {
        const dayOfWeek = date.getDay();
        return metric.schedule_days.includes(dayOfWeek);
      }
      return true;

    case "interval":
      // Interval-based scheduling
      if (
        !metric.schedule_start_date ||
        !metric.schedule_interval_value ||
        !startDate
      ) {
        return false;
      }

      // Calculate if this date matches the interval pattern
      switch (intervalUnit) {
        case "days": {
          // For day-based intervals, we check if the number of days since start
          // is divisible by the interval value
          const diffDays = differenceInDays(date, startDate);
          return diffDays >= 0 && diffDays % intervalValue === 0;
        }
        case "weeks": {
          // For week-based intervals
          const diffWeeks = differenceInWeeks(date, startDate);
          return (
            diffWeeks >= 0 &&
            diffWeeks % intervalValue === 0 &&
            isSameDay(date, addWeeks(startDate, diffWeeks))
          );
        }
        case "months": {
          // For month-based intervals
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
      // Custom scheduling: check specific days
      if (metric.schedule_days && metric.schedule_days.length > 0) {
        const dayOfWeek = date.getDay();
        return metric.schedule_days.includes(dayOfWeek);
      }
      return false;

    default:
      // If no frequency specified but we have schedule_days, use those
      if (metric.schedule_days && metric.schedule_days.length > 0) {
        const dayOfWeek = date.getDay();
        return metric.schedule_days.includes(dayOfWeek);
      }
      return true;
  }
}

/**
 * Parses the schedule_days field from string to array
 */
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

/**
 * Formats the schedule days array to a human-readable string
 */
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

  // If all days are selected
  if (days.length === 7) return "Every day";

  // If weekdays are selected
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

  // If weekend is selected
  if (days.length === 2 && days.includes(0) && days.includes(6)) {
    return "Weekends";
  }

  // Otherwise, list the day names
  return days.map((day) => dayNames[day]).join(", ");
}
