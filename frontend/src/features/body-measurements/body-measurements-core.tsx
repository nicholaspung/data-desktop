import { BodyMeasurementRecord } from "@/features/body-measurements/types";

export interface MeasurementSummary {
  type: string;
  latest: BodyMeasurementRecord;
  count: number;
  daysSinceUpdate: number;
}

export function processMeasurementData(data: BodyMeasurementRecord[]) {
  const measurementGroups = data.reduce(
    (groups, record) => {
      const type = record.measurement;
      if (!groups[type]) {
        groups[type] = [];
      }
      groups[type].push(record);
      return groups;
    },
    {} as Record<string, BodyMeasurementRecord[]>
  );

  const latestMeasurements = Object.entries(measurementGroups).map(
    ([type, records]) => {
      const sortedRecords = records.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      const latest = sortedRecords[0];
      const daysSinceUpdate = Math.floor(
        (Date.now() - new Date(latest.date).getTime()) / (1000 * 60 * 60 * 24)
      );
      return { type, latest, count: records.length, daysSinceUpdate };
    }
  );

  const latestWeight = measurementGroups.Bodyweight
    ? measurementGroups.Bodyweight.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      )[0]
    : null;

  const measurementTypes = Object.keys(measurementGroups);

  return {
    measurementGroups,
    latestMeasurements,
    latestWeight,
    measurementTypes,
    totalMeasurements: data.length,
  };
}

export function formatTimeSince(days: number) {
  if (days === 0) return "Today";
  if (days === 1) return "1 day ago";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return `${Math.floor(days / 30)} months ago`;
}

export function filterMeasurements(
  latestMeasurements: MeasurementSummary[],
  searchTerm: string,
  maxItems?: number
) {
  let filtered = latestMeasurements;

  if (searchTerm.trim()) {
    filtered = latestMeasurements.filter(({ type }) =>
      type.toLowerCase().includes(searchTerm.toLowerCase())
    );
  } else {
    filtered = latestMeasurements.sort(
      (a, b) => a.daysSinceUpdate - b.daysSinceUpdate
    );
  }

  return maxItems ? filtered.slice(0, maxItems) : filtered;
}