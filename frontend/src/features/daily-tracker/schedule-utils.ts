// src/features/experiments/schedule-utils.ts
import { Metric } from "@/store/experiment-definitions";
import { isBefore, isAfter, isSameDay } from "date-fns";

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

  // Check if date is within the schedule's date range
  if (metric.schedule_start_date) {
    const startDate = new Date(metric.schedule_start_date);
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

  // Check if the metric should appear on this day of the week
  if (metric.schedule_days && metric.schedule_days.length > 0) {
    const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
    if (!metric.schedule_days.includes(dayOfWeek)) {
      return false;
    }
  }

  // Add more complex scheduling logic based on frequency
  if (metric.schedule_frequency === "weekly") {
    // For weekly, we'd need additional data like which week the metric should appear
    // This is just a simple implementation
    const weekNumber = getWeekNumber(date);
    return weekNumber % 2 === 0; // Show on even weeks
  }

  // For daily or unspecified frequency, show the metric if it passed the other checks
  return true;
}

/**
 * Gets the ISO week number of a date
 */
function getWeekNumber(date: Date): number {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
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
