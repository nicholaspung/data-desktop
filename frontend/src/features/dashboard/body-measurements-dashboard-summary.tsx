import { useState, useEffect, useMemo } from "react";
import { useStore } from "@tanstack/react-store";
import dataStore from "@/store/data-store";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { FEATURE_ICONS } from "@/lib/icons";
import { BodyMeasurementRecord } from "@/features/body-measurements/types";
import { registerDashboardSummary } from "@/lib/dashboard-registry";
import ReusableSummary from "@/components/reusable/reusable-summary";
import { 
  processMeasurementData, 
  formatTimeSince, 
  filterMeasurements 
} from "@/features/body-measurements/body-measurements-core";

interface BodyMeasurementsDashboardSummaryProps {
  data?: BodyMeasurementRecord[];
}

export default function BodyMeasurementsDashboardSummary({
  data: propData,
}: BodyMeasurementsDashboardSummaryProps) {
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

  const nonPrivateData = typedData.filter((record) => !record.private);

  const {
    latestMeasurements,
    latestWeight,
    measurementTypes,
  } = processMeasurementData(nonPrivateData);

  const filteredLatestMeasurements = useMemo(() => {
    return filterMeasurements(latestMeasurements, searchTerm, 5);
  }, [latestMeasurements, searchTerm]);

  const sections = [
    {
      items: [
        {
          label: "Latest Weight",
          value: latestWeight
            ? `${latestWeight.value} ${latestWeight.unit}`
            : "No weight recorded",
          subText: latestWeight
            ? new Date(latestWeight.date).toLocaleDateString()
            : undefined,
        },
        {
          label: "Measurement Types",
          value: measurementTypes.length,
        },
      ],
      columns: 2 as const,
    },
  ];

  const searchSection = [
    {
      title: (
        <div className="flex items-center justify-between">
          <span className="font-medium">Latest by Type</span>
          {!searchTerm && latestMeasurements.length > 5 && (
            <span className="pl-4 text-xs text-muted-foreground">
              Showing 5 most recent types ({latestMeasurements.length} total)
            </span>
          )}
        </div>
      ),
      items: [
        {
          label: "",
          value: (
            <div className="relative w-full">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search measurement types..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          ),
        },
      ],
      columns: 1 as const,
    },
  ];

  const gridSection =
    filteredLatestMeasurements.length > 0
      ? {
          columns: 3 as const,
          items: filteredLatestMeasurements.map(
            ({ type, latest, count, daysSinceUpdate }) => ({
              content: (
                <div className="w-full">
                  <div className="flex items-center gap-2 mb-2 justify-center">
                    <span className="font-medium capitalize text-sm">
                      {type}
                    </span>
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
              ),
            })
          ),
        }
      : undefined;

  const footer =
    filteredLatestMeasurements.length === 0 ? (
      <div className="text-center py-8 text-muted-foreground">
        {searchTerm
          ? `No measurement types found for "${searchTerm}"`
          : "No measurements recorded"}
      </div>
    ) : undefined;

  return (
    <ReusableSummary
      title="Body Measurements"
      titleIcon={<FEATURE_ICONS.BODY_MEASUREMENTS className="h-5 w-5" />}
      linkText="View All"
      linkTo="/body-measurements"
      loading={loading}
      emptyState={
        nonPrivateData.length === 0
          ? {
              message: "No measurements recorded yet",
              actionText: "Add your first measurement",
              actionTo: "/body-measurements",
            }
          : undefined
      }
      sections={[...sections, ...searchSection]}
      gridSection={gridSection}
      footer={footer}
    />
  );
}

registerDashboardSummary({
  route: "/body-measurements",
  component: BodyMeasurementsDashboardSummary,
  defaultConfig: {
    id: "/body-measurements",
    size: "small",
    height: "large",
    order: 10,
    visible: true,
  },
  datasets: ["body_measurements"],
  name: "Body Measurements",
  description: "Track body measurements and physical progress",
  icon: FEATURE_ICONS.BODY_MEASUREMENTS,
});
