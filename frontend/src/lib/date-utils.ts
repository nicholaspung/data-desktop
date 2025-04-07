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
