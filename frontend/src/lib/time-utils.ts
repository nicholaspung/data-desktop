// src/lib/time-utils.ts
/**
 * Formats seconds into a readable time string (HH:MM:SS)
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  return [
    hours.toString().padStart(2, "0"),
    minutes.toString().padStart(2, "0"),
    remainingSeconds.toString().padStart(2, "0"),
  ].join(":");
}

/**
 * Calculates the duration between two dates in minutes
 */
export function calculateDurationMinutes(
  startDate: Date,
  endDate: Date
): number {
  const diffMs = endDate.getTime() - startDate.getTime();
  return Math.floor(diffMs / (1000 * 60));
}

/**
 * Formats a date to a time string in local time (HH:MM AM/PM)
 */
export function formatTimeString(date: Date): string {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/**
 * Formats a date to a date string (YYYY-MM-DD)
 */
export function formatDateString(date: Date): string {
  // Use local date for display and grouping
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Groups time entries by date
 */
export function groupEntriesByDate<T extends { start_time: Date }>(
  entries: T[]
): Record<string, T[]> {
  const groupedEntries: Record<string, T[]> = {};

  entries.forEach((entry) => {
    // Use local date string as key
    const dateStr = formatDateString(new Date(entry.start_time));

    if (!groupedEntries[dateStr]) {
      groupedEntries[dateStr] = [];
    }

    groupedEntries[dateStr].push(entry);
  });

  return groupedEntries;
}

// Format minutes as hours and minutes in a human-readable format
export const formatHoursAndMinutes = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
};
