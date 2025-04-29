// src/lib/time-entry-utils.ts
import { TimeEntry } from "@/store/time-tracking-definitions";

/**
 * Finds entries that overlap with one another
 * @param entries Array of time entries to check for overlaps
 * @param bufferMs Optional buffer time in milliseconds to avoid flagging nearly adjacent entries
 * @returns Array of entries that have overlaps
 */
export function findOverlappingEntries(
  entries: TimeEntry[],
  bufferMs = 1000
): TimeEntry[] {
  const result: TimeEntry[] = [];

  // Handle empty entries
  if (!entries || entries.length === 0) {
    return result;
  }

  // Sort entries by start time
  const sortedEntries = [...entries].sort(
    (a, b) =>
      new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
  );

  // Check each entry against all others for overlaps
  for (let i = 0; i < sortedEntries.length; i++) {
    const entry = sortedEntries[i];
    const startTime = new Date(entry.start_time).getTime();
    const endTime = new Date(entry.end_time).getTime();

    for (let j = 0; j < sortedEntries.length; j++) {
      if (i === j) continue; // Skip comparing with self

      const otherEntry = sortedEntries[j];
      const otherStartTime = new Date(otherEntry.start_time).getTime();
      const otherEndTime = new Date(otherEntry.end_time).getTime();

      // Check if there's a significant overlap (more than our buffer)
      const hasOverlap =
        // Entry starts before other ends AND entry ends after other starts
        (startTime < otherEndTime - bufferMs &&
          endTime > otherStartTime + bufferMs) ||
        // OR other starts before entry ends AND other ends after entry starts
        (otherStartTime < endTime - bufferMs &&
          otherEndTime > startTime + bufferMs);

      // Specific check for exact same timestamps (which can happen with programmatic creation)
      const hasExactSameTimestamps =
        startTime === otherStartTime && endTime === otherEndTime;

      if (hasOverlap && !hasExactSameTimestamps) {
        if (!result.includes(entry)) {
          result.push(entry);
        }
      }
    }
  }

  return result;
}

/**
 * Finds pairs of overlapping entries
 * @param entries Array of time entries to find overlapping pairs
 * @param bufferMs Optional buffer time in milliseconds to avoid flagging nearly adjacent entries
 * @returns Array of entry pairs that overlap
 */
export function findOverlappingPairs(
  entries: TimeEntry[],
  bufferMs = 1000
): { entry1: TimeEntry; entry2: TimeEntry }[] {
  const pairs: { entry1: TimeEntry; entry2: TimeEntry }[] = [];

  // Handle empty entries
  if (!entries || entries.length === 0) {
    return pairs;
  }

  // Sort entries by start time
  const sortedEntries = [...entries].sort(
    (a, b) =>
      new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
  );

  // Compare each entry with all others to find overlaps
  for (let i = 0; i < sortedEntries.length; i++) {
    const entry1 = sortedEntries[i];
    const start1 = new Date(entry1.start_time).getTime();
    const end1 = new Date(entry1.end_time).getTime();

    for (let j = i + 1; j < sortedEntries.length; j++) {
      const entry2 = sortedEntries[j];
      const start2 = new Date(entry2.start_time).getTime();
      const end2 = new Date(entry2.end_time).getTime();

      // Check if there's an overlap (standard interval overlap check)
      if (start1 < end2 && start2 < end1) {
        // Apply buffer to avoid flagging back-to-back entries
        if (end1 - start2 > bufferMs || end2 - start1 > bufferMs) {
          // Skip entries with exactly same timestamps
          const hasExactSameTimestamps = start1 === start2 && end1 === end2;

          if (!hasExactSameTimestamps) {
            pairs.push({ entry1, entry2 });
          }
        }
      }
    }
  }

  return pairs;
}

/**
 * Calculate the duration of overlap between two entries in minutes
 * @param entry1 First time entry
 * @param entry2 Second time entry
 * @returns Overlap duration in minutes
 */
export function getOverlapDuration(
  entry1: TimeEntry,
  entry2: TimeEntry
): number {
  if (!entry1 || !entry2) return 0;

  const start1 = new Date(entry1.start_time).getTime();
  const end1 = new Date(entry1.end_time).getTime();
  const start2 = new Date(entry2.start_time).getTime();
  const end2 = new Date(entry2.end_time).getTime();

  const overlapStart = Math.max(start1, start2);
  const overlapEnd = Math.min(end1, end2);

  if (overlapEnd <= overlapStart) return 0;

  // Return overlap in minutes
  return Math.round((overlapEnd - overlapStart) / (1000 * 60));
}

// Convert UTC dates to local dates for grouping
export const convertToLocalDates = (entries: TimeEntry[]): TimeEntry[] => {
  return entries.map((entry) => {
    const startTime = new Date(entry.start_time);
    const endTime = new Date(entry.end_time);

    // Create a copy of the entry with local date string
    return {
      ...entry,
      // Store original dates in new property for display
      original_start_time: entry.start_time,
      original_end_time: entry.end_time,
      // Use local date strings for grouping
      start_time: startTime,
      end_time: endTime,
    };
  });
};
