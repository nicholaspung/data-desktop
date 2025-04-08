import { useMemo } from "react";
import { BloodMarker, BloodResult, ChartDataPoint } from "./bloodwork";
import {
  getBadgeInfo,
  getLatestValue,
  hasAnyRangeDefined as hasAnyRangeDefinedFunc,
  isWithinOptimalRange,
} from "./bloodwork-utils";
import { formatDate } from "@/lib/date-utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import BloodMarkerChart from "./bloodwork-chart";

// Create a component for each blood marker with its chart
export default function BloodMarkerCard({
  marker,
  results,
}: {
  marker: BloodMarker;
  results: BloodResult[];
}) {
  // Sort results by date
  const sortedResults = useMemo(() => {
    return [...results].sort((a, b) => {
      return (
        new Date(a.blood_test_id_data?.date || 0).getTime() -
        new Date(b.blood_test_id_data?.date || 0).getTime()
      );
    });
  }, [results]);

  // Get the latest result
  const latestResult =
    sortedResults.length > 0 ? sortedResults[sortedResults.length - 1] : null;

  // Format data for chart
  const chartData: ChartDataPoint[] = useMemo(() => {
    return sortedResults.map((result) => {
      const testDate = result.blood_test_id_data?.date;
      const value = parseFloat(result.value_number.toString()) || 0;
      const isInOptimalRange = isWithinOptimalRange(
        value,
        marker.optimal_low,
        marker.optimal_high,
        marker.optimal_general
      );

      return {
        date: testDate ? formatDate(new Date(testDate)) : "Unknown",
        value: value,
        inOptimalRange: isInOptimalRange,
      };
    });
  }, [sortedResults, marker]);

  // Calculate whether latest result is in range
  const latestValue = getLatestValue(latestResult);
  const badgeInfo = getBadgeInfo(latestValue, marker);

  // Determine if this marker has any range defined
  const hasAnyRangeDefined = useMemo(
    () => hasAnyRangeDefinedFunc(marker),
    [marker, hasAnyRangeDefinedFunc]
  );

  // Determine range string to display
  const getRangeString = (): string => {
    if (marker.general_reference) {
      return marker.general_reference;
    }

    if (
      marker.lower_reference !== undefined &&
      marker.upper_reference !== undefined
    ) {
      return `${marker.lower_reference} - ${marker.upper_reference}`;
    }

    return "No range specified";
  };

  // Determine optimal range string to display
  const getOptimalRangeString = (): string => {
    if (marker.optimal_general) {
      return marker.optimal_general;
    }

    if (marker.optimal_low !== undefined && marker.optimal_high !== undefined) {
      return `${marker.optimal_low} - ${marker.optimal_high}`;
    }

    return "No optimal range specified";
  };

  // Check if we should show a chart (require numeric values and more than one point)
  const shouldShowChart = useMemo(() => {
    // Always show a chart if we have more than one data point,
    // regardless of whether the marker has ranges defined
    return chartData.length > 1;
  }, [chartData]);

  // Determine if it has text-based ranges only
  const hasTextBasedRanges = marker.optimal_general || marker.general_reference;

  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex justify-between items-center">
          <div className="flex flex-col">
            <span>{marker.name}</span>
            <span className="text-xs text-muted-foreground">
              {marker.unit ? `Unit: ${marker.unit}` : "No unit specified"}
            </span>
          </div>
          {latestValue !== null && (
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-2">
                <span className="font-semibold">{latestValue.value}</span>
                {hasAnyRangeDefined ? (
                  <Badge variant={badgeInfo.variant}>{badgeInfo.text}</Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="bg-gray-100 dark:bg-gray-800"
                  >
                    No Range Set
                  </Badge>
                )}
              </div>
              {/* Only show reference values if they are defined */}
              {hasAnyRangeDefined && (
                <div className="text-xs text-muted-foreground mt-1">
                  {Boolean(marker.lower_reference || marker.upper_reference) ||
                  marker.general_reference ? (
                    <span>Reference: {getRangeString()}</span>
                  ) : null}

                  {marker.optimal_low || marker.optimal_high ? (
                    <span className="ml-2">
                      Optimal: {getOptimalRangeString()}
                    </span>
                  ) : null}
                  {marker.optimal_general && (
                    <span className="ml-2">
                      Optimal: {marker.optimal_general}
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {marker.description && (
          <p className="text-sm text-muted-foreground mb-4">
            {marker.description}
          </p>
        )}

        {hasTextBasedRanges ? (
          <div className="text-sm text-center text-muted-foreground">
            This marker uses text-based ranges and cannot be visualized in a
            chart.
          </div>
        ) : shouldShowChart ? (
          <div className="h-32">
            <BloodMarkerChart
              data={chartData}
              optimalLow={marker.optimal_low}
              optimalHigh={marker.optimal_high}
              unit={marker.unit}
              height={120}
              // Don't show shaded area for optimal range if no range is defined
              showOptimalRange={Boolean(
                marker.optimal_low || marker.optimal_high
              )}
            />
          </div>
        ) : chartData.length === 1 ? (
          <div className="text-sm text-center text-muted-foreground">
            Only one data point available. More data is needed to display a
            chart.
          </div>
        ) : (
          <div className="text-sm text-center text-muted-foreground">
            No data available for this marker.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
