import { useState, useEffect, useMemo } from "react";
import { useStore } from "@tanstack/react-store";
import { Link } from "@tanstack/react-router";
import dataStore from "@/store/data-store";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { FEATURE_ICONS } from "@/lib/icons";
import { BodyMeasurementRecord } from "@/features/body-measurements/types";

interface BodyMeasurementsDashboardSummaryProps {
  data?: BodyMeasurementRecord[];
}

export default function BodyMeasurementsDashboardSummary({
  data: propData,
}: BodyMeasurementsDashboardSummaryProps = {}) {
  const storeData =
    useStore(dataStore, (state) => state.body_measurements) || [];
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 100);
    return () => clearTimeout(timer);
  }, []);

  const data = propData || storeData;
  const typedData = data as BodyMeasurementRecord[];

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

  const filteredLatestMeasurements = useMemo(() => {
    if (!searchTerm.trim()) {
      return latestMeasurements;
    }
    return latestMeasurements.filter(({ type }) =>
      type.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [latestMeasurements, searchTerm]);

  const latestWeight = measurementGroups.Bodyweight
    ? measurementGroups.Bodyweight.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      )[0]
    : null;

  const measurementTypes = Object.keys(measurementGroups);
  const totalMeasurements = typedData.length;

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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
      <Separator />
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium">Latest by Type</h4>
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search measurement types..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        {filteredLatestMeasurements.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {searchTerm
              ? `No measurement types found for "${searchTerm}"`
              : "No measurements recorded"}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredLatestMeasurements.map(
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
        )}
      </div>
    </div>
  );
}
