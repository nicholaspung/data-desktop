import { TimeEntry } from "@/store/time-tracking-definitions";

export function findOverlappingEntries(
  entries: TimeEntry[],
  bufferMs = 1000
): TimeEntry[] {
  const result: TimeEntry[] = [];

  if (!entries || entries.length === 0) {
    return result;
  }

  const sortedEntries = [...entries].sort(
    (a, b) =>
      new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
  );

  for (let i = 0; i < sortedEntries.length; i++) {
    const entry = sortedEntries[i];
    const startTime = new Date(entry.start_time).getTime();
    const endTime = new Date(entry.end_time).getTime();

    for (let j = 0; j < sortedEntries.length; j++) {
      if (i === j) continue;

      const otherEntry = sortedEntries[j];
      const otherStartTime = new Date(otherEntry.start_time).getTime();
      const otherEndTime = new Date(otherEntry.end_time).getTime();

      const hasOverlap =
        (startTime < otherEndTime - bufferMs &&
          endTime > otherStartTime + bufferMs) ||
        (otherStartTime < endTime - bufferMs &&
          otherEndTime > startTime + bufferMs);

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

export function findOverlappingPairs(
  entries: TimeEntry[],
  bufferMs = 1000
): { entry1: TimeEntry; entry2: TimeEntry }[] {
  const pairs: { entry1: TimeEntry; entry2: TimeEntry }[] = [];

  if (!entries || entries.length === 0) {
    return pairs;
  }

  const sortedEntries = [...entries].sort(
    (a, b) =>
      new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
  );

  for (let i = 0; i < sortedEntries.length; i++) {
    const entry1 = sortedEntries[i];
    const start1 = new Date(entry1.start_time).getTime();
    const end1 = new Date(entry1.end_time).getTime();

    for (let j = i + 1; j < sortedEntries.length; j++) {
      const entry2 = sortedEntries[j];
      const start2 = new Date(entry2.start_time).getTime();
      const end2 = new Date(entry2.end_time).getTime();

      if (start1 < end2 && start2 < end1) {
        if (end1 - start2 > bufferMs || end2 - start1 > bufferMs) {
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

  return Math.round((overlapEnd - overlapStart) / (1000 * 60));
}

export const convertToLocalDates = (entries: TimeEntry[]): TimeEntry[] => {
  return entries.map((entry) => {
    const startTime = new Date(entry.start_time);
    const endTime = new Date(entry.end_time);

    return {
      ...entry,
      original_start_time: entry.start_time,
      original_end_time: entry.end_time,
      start_time: startTime,
      end_time: endTime,
    };
  });
};
