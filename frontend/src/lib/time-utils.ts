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

export function calculateDurationMinutes(
  startDate: Date,
  endDate: Date
): number {
  const diffMs = endDate.getTime() - startDate.getTime();
  return Math.floor(diffMs / (1000 * 60));
}

export function formatTimeString(date: Date): string {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function formatDateString(date: Date): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function groupEntriesByDate<T extends { start_time: Date | string }>(
  entries: T[]
): Record<string, T[]> {
  const groupedEntries: Record<string, T[]> = {};

  entries.forEach((entry) => {
    const date = new Date(entry.start_time);
    const dateStr = formatDateString(date);

    if (!groupedEntries[dateStr]) {
      groupedEntries[dateStr] = [];
    }

    groupedEntries[dateStr].push(entry);
  });

  return groupedEntries;
}

export const formatHoursAndMinutes = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
};
