import { format, parseISO, isValid } from "date-fns";

export const COLORS = [
  "#8884d8",
  "#82ca9d",
  "#ffc658",
  "#ff8042",
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#a4de6c",
  "#d0ed57",
];

export const formatDate = (date: Date | string): string => {
  if (!date) return "";

  let dateObj: Date;

  if (typeof date === "string") {
    if (date.includes("T00:00:00.000Z")) {
      const datePart = date.split("T")[0];
      const [year, month, day] = datePart.split("-");
      dateObj = new Date(Number(year), Number(month) - 1, Number(day));
    } else {
      dateObj = parseISO(date);

      if (!isValid(dateObj)) {
        dateObj = new Date(date);
      }
    }
  } else {
    dateObj = date;
  }

  if (!isValid(dateObj)) {
    console.warn(`Invalid date: ${date}`);
    return "Invalid Date";
  }

  return format(dateObj, "MMM d, yyyy");
};

export const dateStrToLocalDate = (dateStr: string): Date => {
  const [year, monthPlus1, day] = dateStr.split("-");
  return new Date(new Date(Number(year), Number(monthPlus1) - 1, Number(day)));
};

/**
 * Converts a date input (string or Date) to a local date without timezone conversion.
 * This ensures consistent date handling across components to avoid timezone-related mismatches.
 * 
 * @param dateInput - ISO string or Date object
 * @returns Local Date object
 */
export const toLocalDate = (dateInput: string | Date): Date => {
  let dateStr: string;
  if (typeof dateInput === "string") {
    dateStr = dateInput;
  } else {
    dateStr = format(dateInput, "yyyy-MM-dd");
  }

  // Handle ISO strings with UTC timezone (T00:00:00.000Z)
  if (dateStr.includes("T00:00:00.000Z")) {
    const datePart = dateStr.split("T")[0];
    const [year, month, day] = datePart.split("-");
    return new Date(Number(year), Number(month) - 1, Number(day));
  } else {
    // Handle date strings in YYYY-MM-DD format
    const [year, month, day] = dateStr.split("-");
    return new Date(Number(year), Number(month) - 1, Number(day));
  }
};
