import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { BodyMeasurementRecord } from "@/features/body-measurements/types";
import { 
  processMeasurementData, 
  formatTimeSince, 
  filterMeasurements 
} from "@/features/body-measurements/body-measurements-core";

interface BodyMeasurementsOverviewProps {
  data: BodyMeasurementRecord[];
  showAllTypes?: boolean;
  showSearchBar?: boolean;
  maxDisplayItems?: number;
}

export default function BodyMeasurementsOverview({
  data,
  showAllTypes = false,
  showSearchBar = true,
  maxDisplayItems = 5,
}: BodyMeasurementsOverviewProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const {
    latestMeasurements,
    latestWeight,
    measurementTypes,
    totalMeasurements,
  } = processMeasurementData(data);

  const filteredLatestMeasurements = useMemo(() => {
    return filterMeasurements(
      latestMeasurements,
      searchTerm,
      showAllTypes ? undefined : maxDisplayItems
    );
  }, [latestMeasurements, searchTerm, showAllTypes, maxDisplayItems]);

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border rounded-lg p-4">
          <div className="text-sm text-muted-foreground">Latest Weight</div>
          <div className="text-2xl font-semibold">
            {latestWeight
              ? `${latestWeight.value} ${latestWeight.unit}`
              : "No weight recorded"}
          </div>
          {latestWeight && (
            <div className="text-sm text-muted-foreground">
              {new Date(latestWeight.date).toLocaleDateString()}
            </div>
          )}
        </div>
        
        <div className="bg-card border rounded-lg p-4">
          <div className="text-sm text-muted-foreground">Measurement Types</div>
          <div className="text-2xl font-semibold">{measurementTypes.length}</div>
        </div>
        
        <div className="bg-card border rounded-lg p-4">
          <div className="text-sm text-muted-foreground">Total Records</div>
          <div className="text-2xl font-semibold">{totalMeasurements}</div>
        </div>
      </div>

      {/* Search and Measurement Types */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            {showAllTypes ? "All Measurement Types" : "Latest by Type"}
          </h3>
          {!showAllTypes && !searchTerm && latestMeasurements.length > maxDisplayItems && (
            <p className="text-sm text-muted-foreground">
              Showing {maxDisplayItems} most recent types ({latestMeasurements.length} total)
            </p>
          )}
        </div>

        {showSearchBar && (
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search measurement types..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        )}

        {filteredLatestMeasurements.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredLatestMeasurements.map(
              ({ type, latest, count, daysSinceUpdate }) => (
                <div key={type} className="bg-card border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium capitalize">{type}</span>
                    <Badge variant="secondary" className="text-xs">
                      {count}
                    </Badge>
                  </div>
                  <div className="text-xl font-semibold">
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
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            {searchTerm
              ? `No measurement types found for "${searchTerm}"`
              : "No measurements recorded"}
          </div>
        )}
      </div>
    </div>
  );
}