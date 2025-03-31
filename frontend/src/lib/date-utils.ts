// src/lib/date-utils.ts
import { format, parseISO, isValid } from "date-fns";

// Default colors for charts
export const COLORS = [
  "#8884d8", // Purple
  "#82ca9d", // Green
  "#ffc658", // Yellow
  "#ff8042", // Orange
  "#0088FE", // Blue
  "#00C49F", // Teal
  "#FFBB28", // Gold
  "#FF8042", // Coral
  "#a4de6c", // Light Green
  "#d0ed57", // Lime
];

// Format date consistently for display
export const formatDate = (date: Date | string): string => {
  if (!date) return "";

  let dateObj: Date;

  if (typeof date === "string") {
    // Try to parse ISO string
    dateObj = parseISO(date);

    // If parsing failed, try to create a new Date object
    if (!isValid(dateObj)) {
      dateObj = new Date(date);
    }
  } else {
    dateObj = date;
  }

  // Handle invalid dates
  if (!isValid(dateObj)) {
    console.warn(`Invalid date: ${date}`);
    return "Invalid Date";
  }

  return format(dateObj, "MMM d, yyyy");
};

// Get the first day of the month
export const getFirstDayOfMonth = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth(), 1);
};

// Get the last day of the month
export const getLastDayOfMonth = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
};

// Get start of current week
export const getStartOfWeek = (date: Date): Date => {
  const day = date.getDay();
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() - day);
};

// Get end of current week
export const getEndOfWeek = (date: Date): Date => {
  const day = date.getDay();
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate() + (6 - day)
  );
};

// Get start of current year
export const getStartOfYear = (date: Date): Date => {
  return new Date(date.getFullYear(), 0, 1);
};

// Get end of current year
export const getEndOfYear = (date: Date): Date => {
  return new Date(date.getFullYear(), 11, 31);
};

// Get date range description
export const getDateRangeDescription = (
  startDate: Date,
  endDate: Date
): string => {
  const start = formatDate(startDate);
  const end = formatDate(endDate);

  if (start === end) {
    return start;
  }

  return `${start} - ${end}`;
};

// Check if date is in range
export const isDateInRange = (
  date: Date,
  startDate: Date,
  endDate: Date
): boolean => {
  return date >= startDate && date <= endDate;
};
