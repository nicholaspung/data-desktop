import { useState, useEffect } from "react";
import { useStore } from "@tanstack/react-store";
import { Link } from "@tanstack/react-router";
import dataStore from "@/store/data-store";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { FEATURE_ICONS } from "@/lib/icons";
import { BodyMeasurementRecord } from "@/features/body-measurements/types";

export default function BodyMeasurementsDashboardSummary() {
  const data = useStore(dataStore, (state) => state.body_measurements) || [];
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 100);
    return () => clearTimeout(timer);
  }, []);

  const typedData = data as BodyMeasurementRecord[];

  // Group measurements by type
  const measurementGroups = typedData.reduce(
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


  // Get latest measurement for each type
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

  // Get latest weight measurement specifically
  const latestWeight = measurementGroups.Bodyweight
    ? measurementGroups.Bodyweight.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      )[0]
    : null;

  // Get measurement counts
  const measurementTypes = Object.keys(measurementGroups);
  const totalMeasurements = typedData.length;

  // Helper function to format time since update
  const formatTimeSince = (days: number) => {
    if (days === 0) return "Today";
    if (days === 1) return "1 day ago";
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return `${Math.floor(days / 30)} months ago`;
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-20 bg-muted rounded-lg"></div>
        <div className="space-y-2">
          <div className="h-4 bg-muted rounded w-3/4"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (totalMeasurements === 0) {
    return (
      <div className="text-center py-8">
        <FEATURE_ICONS.BODY_MEASUREMENTS className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
        <p className="text-muted-foreground mb-4">
          No measurements recorded yet
        </p>
        <Link
          to="/body-measurements"
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Add your first measurement
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
        {/* Top Row: Latest Weight + Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Latest Weight - Highlighted */}
          <div className="md:col-span-1">
            {latestWeight ? (
              <div className="rounded-lg border-2 border-primary/20 bg-primary/5 p-4">
                <div className="text-sm text-muted-foreground mb-1">
                  Latest Weight
                </div>
                <div className="text-2xl font-bold text-primary">
                  {latestWeight.value} {latestWeight.unit}
                </div>
                <div className="text-xs text-muted-foreground">
                  {new Date(latestWeight.date).toLocaleDateString()}
                </div>
              </div>
            ) : (
              <div className="rounded-lg border-2 border-dashed border-muted p-4">
                <div className="text-sm text-muted-foreground mb-1">
                  Latest Weight
                </div>
                <div className="text-lg text-muted-foreground">
                  No weight recorded
                </div>
              </div>
            )}
          </div>

          {/* Overview Stats */}
          <div className="md:col-span-2 flex flex-col items-center">
            <h4 className="font-medium mb-3">Overview</h4>
            <div className="grid grid-cols-2 gap-8">
              <div className="text-center">
                <div className="text-2xl font-semibold">{totalMeasurements}</div>
                <div className="text-sm text-muted-foreground">Total Records</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-semibold">
                  {measurementTypes.length}
                </div>
                <div className="text-sm text-muted-foreground">
                  Measurement Types
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Separator */}
        <Separator />

        {/* Measurement Types List */}
        <div>
          <h4 className="font-medium mb-3">Latest by Type</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {latestMeasurements.map(
              ({ type, latest, count, daysSinceUpdate }) => (
                <div
                  key={type}
                  className="p-3 rounded-lg border hover:bg-muted/50"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium capitalize">{type}</span>
                    <Badge variant="secondary" className="text-xs">
                      {count}
                    </Badge>
                  </div>
                  <div className="text-lg font-semibold">
                    {latest.value} {latest.unit}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatTimeSince(daysSinceUpdate)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(latest.date).toLocaleDateString()}
                  </div>
                </div>
              )
            )}
          </div>
        </div>
    </div>
  );
}
