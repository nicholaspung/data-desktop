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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function BloodMarkerCard({
  marker,
  results,
}: {
  marker: BloodMarker;
  results: BloodResult[];
}) {
  const sortedResults = useMemo(() => {
    return [...results].sort((a, b) => {
      return (
        new Date(b.blood_test_id_data?.date || 0).getTime() -
        new Date(a.blood_test_id_data?.date || 0).getTime()
      );
    });
  }, [results]);

  const chronologicalResults = useMemo(() => {
    return [...results].sort((a, b) => {
      return (
        new Date(a.blood_test_id_data?.date || 0).getTime() -
        new Date(b.blood_test_id_data?.date || 0).getTime()
      );
    });
  }, [results]);

  const latestResult = sortedResults.length > 0 ? sortedResults[0] : null;

  const chartData: ChartDataPoint[] = useMemo(() => {
    return chronologicalResults.map((result) => {
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
  }, [chronologicalResults, marker]);

  const latestValue = getLatestValue(latestResult);
  const badgeInfo = getBadgeInfo(latestValue, marker);

  const hasAnyRangeDefined = useMemo(
    () => hasAnyRangeDefinedFunc(marker),
    [marker]
  );

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

  const getOptimalRangeString = (): string => {
    if (marker.optimal_general) {
      return marker.optimal_general;
    }

    if (marker.optimal_low !== undefined && marker.optimal_high !== undefined) {
      return `${marker.optimal_low} - ${marker.optimal_high}`;
    }

    return "No optimal range specified";
  };

  const shouldShowChart = useMemo(() => {
    return chartData.length > 1;
  }, [chartData]);

  const hasTextBasedRanges = marker.optimal_general || marker.general_reference;
  const hasTextValues = useMemo(() => {
    return results.some(
      (result) => result.value_text && result.value_text.trim() !== ""
    );
  }, [results]);

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

        {hasTextBasedRanges || hasTextValues ? (
          <div>
            {results.length > 0 ? (
              <div className="overflow-hidden rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">Date</TableHead>
                      {hasTextValues && <TableHead>Text Result</TableHead>}
                      {results.some((r) => r.notes) && (
                        <TableHead>Notes</TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedResults.map((result) => (
                      <TableRow key={result.id}>
                        <TableCell className="font-medium">
                          {result.blood_test_id_data?.date
                            ? formatDate(
                                new Date(result.blood_test_id_data.date)
                              )
                            : "Unknown"}
                        </TableCell>
                        {hasTextValues && (
                          <TableCell>{result.value_text || "-"}</TableCell>
                        )}
                        {results.some((r) => r.notes) && (
                          <TableCell className="text-sm text-muted-foreground">
                            {result.notes || "-"}
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-sm text-center text-muted-foreground">
                No data available for this marker.
              </div>
            )}
          </div>
        ) : shouldShowChart ? (
          <div className="h-32">
            <BloodMarkerChart
              data={chartData}
              optimalLow={marker.optimal_low}
              optimalHigh={marker.optimal_high}
              unit={marker.unit}
              height={120}
              showOptimalRange={Boolean(
                marker.optimal_low || marker.optimal_high
              )}
            />
          </div>
        ) : chartData.length === 1 ? (
          <div className="overflow-hidden rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Date</TableHead>
                  <TableHead>
                    {marker.unit ? `Value (${marker.unit})` : "Value"}
                  </TableHead>
                  {results[0]?.notes && <TableHead>Notes</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">
                    {results[0]?.blood_test_id_data?.date
                      ? formatDate(new Date(results[0].blood_test_id_data.date))
                      : "Unknown"}
                  </TableCell>
                  <TableCell>
                    {typeof results[0]?.value_number === "number"
                      ? results[0].value_number
                      : "N/A"}
                  </TableCell>
                  {results[0]?.notes && (
                    <TableCell className="text-sm text-muted-foreground">
                      {results[0].notes}
                    </TableCell>
                  )}
                </TableRow>
              </TableBody>
            </Table>
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
