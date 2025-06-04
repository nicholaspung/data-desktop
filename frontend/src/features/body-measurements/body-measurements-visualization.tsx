import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BodyPart } from "../dexa/dexa";
import ReusableTooltip from "@/components/reusable/reusable-tooltip";
import ReusableSelect from "@/components/reusable/reusable-select";
import { BodyMeasurementRecord } from "./types";
import { format } from "date-fns";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

type ViewMode = "single" | "comparison";

interface BodyMeasurementsVisualizationProps {
  data: BodyMeasurementRecord[];
  title?: string;
  className?: string;
}

export default function BodyMeasurementsVisualization({
  data,
  title = "Body Measurements",
  className = "",
}: BodyMeasurementsVisualizationProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("single");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [comparisonDate, setComparisonDate] = useState<string>("");

  // Create a map of dates to measurement types and values (excluding bodyweight)
  const measurementsByDate = useMemo(() => {
    const map = new Map<string, Map<string, BodyMeasurementRecord>>();

    // Filter out bodyweight measurements
    const nonBodyweightData = data.filter(
      (record) => record.measurement.toLowerCase() !== "bodyweight"
    );

    // Group by date, then by measurement type
    nonBodyweightData.forEach((record) => {
      try {
        // Ensure consistent date string format
        const date = new Date(record.date);
        if (isNaN(date.getTime())) {
          console.warn('Invalid date found:', record.date);
          return;
        }
        const dateKey = date.toISOString().split('T')[0];
        if (!map.has(dateKey)) {
          map.set(dateKey, new Map());
        }
        map.get(dateKey)!.set(record.measurement, record);
      } catch (error) {
        console.warn('Error processing date:', record.date, error);
      }
    });

    return map;
  }, [data]);

  // Create date options directly from map keys, sorted newest to oldest
  const dateOptions = useMemo(() => {
    return Array.from(measurementsByDate.keys())
      .map((dateString) => {
        try {
          const date = new Date(dateString + 'T00:00:00');
          if (isNaN(date.getTime())) {
            console.warn('Invalid date string for options:', dateString);
            return null;
          }
          return {
            value: dateString,
            label: format(date, "MMM d, yyyy"),
            date: date,
            measurementCount: measurementsByDate.get(dateString)?.size || 0,
          };
        } catch (error) {
          console.warn('Error creating date option:', dateString, error);
          return null;
        }
      })
      .filter((option): option is NonNullable<typeof option> => option !== null)
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [measurementsByDate]);

  console.log("Date options:", dateOptions);
  console.log("Map keys:", Array.from(measurementsByDate.keys()));

  // Initialize selected dates
  useEffect(() => {
    if (dateOptions.length > 0 && !selectedDate) {
      setSelectedDate(dateOptions[0].value);
      if (dateOptions.length > 1) {
        setComparisonDate(dateOptions[1].value);
      }
    }
  }, [dateOptions, selectedDate]);

  // Get the latest measurement for each type up to a specific date
  const getLatestMeasurementByDate = (
    measurementType: string,
    upToDate: string
  ) => {
    try {
      const upToDateObj = new Date(upToDate + 'T23:59:59');
      if (isNaN(upToDateObj.getTime())) {
        console.warn('Invalid upToDate:', upToDate);
        return undefined;
      }
      
      const measurements = data
        .filter((record) => {
          try {
            const recordDate = new Date(record.date);
            return (
              record.measurement.toLowerCase() === measurementType.toLowerCase() &&
              !isNaN(recordDate.getTime()) &&
              recordDate <= upToDateObj
            );
          } catch {
            return false;
          }
        })
        .sort((a, b) => {
          try {
            return new Date(b.date).getTime() - new Date(a.date).getTime();
          } catch {
            return 0;
          }
        });

      return measurements[0];
    } catch (error) {
      console.warn('Error in getLatestMeasurementByDate:', error);
      return undefined;
    }
  };

  // Get the latest measurement for each type (for single view)
  const getLatestMeasurement = (measurementType: string) => {
    try {
      const measurements = data
        .filter((record) => {
          try {
            const recordDate = new Date(record.date);
            return (
              record.measurement.toLowerCase() === measurementType.toLowerCase() &&
              !isNaN(recordDate.getTime())
            );
          } catch {
            return false;
          }
        })
        .sort((a, b) => {
          try {
            return new Date(b.date).getTime() - new Date(a.date).getTime();
          } catch {
            return 0;
          }
        });

      return measurements[0];
    } catch (error) {
      console.warn('Error in getLatestMeasurement:', error);
      return undefined;
    }
  };

  const formatValue = (value: number | undefined, unit: string) => {
    if (value === undefined) return "N/A";
    return `${value.toFixed(1)} ${unit}`;
  };

  const getColorForMeasurement = (measurementType: string) => {
    const measurement =
      viewMode === "single"
        ? getLatestMeasurement(measurementType)
        : getLatestMeasurementByDate(measurementType, selectedDate);
    if (!measurement) return "#94a3b8"; // gray for no data

    // Simple color scheme based on whether we have data or not
    return "#8884d8"; // blue for available data
  };

  // Calculate change between two measurements
  const getChangeInfo = (measurementType: string) => {
    if (viewMode !== "comparison") return null;

    const primaryMeasurement = getLatestMeasurementByDate(
      measurementType,
      selectedDate
    );
    const comparisonMeasurement = getLatestMeasurementByDate(
      measurementType,
      comparisonDate
    );

    if (!primaryMeasurement || !comparisonMeasurement) return null;

    const change = primaryMeasurement.value - comparisonMeasurement.value;
    const percentChange = Math.abs(
      (change / comparisonMeasurement.value) * 100
    );

    return {
      change,
      percentChange,
      isIncrease: change > 0,
      isDecrease: change < 0,
      isUnchanged: Math.abs(change) < 0.1, // Consider changes < 0.1 as unchanged
    };
  };

  // Get measurement data for display
  const getMeasurementData = (measurementType: string) => {
    if (viewMode === "single") {
      return {
        primary: getLatestMeasurement(measurementType),
        comparison: null,
      };
    } else {
      return {
        primary: getLatestMeasurementByDate(measurementType, selectedDate),
        comparison: getLatestMeasurementByDate(measurementType, comparisonDate),
      };
    }
  };

  // Get measurement map for a specific date
  const getMeasurementsForDate = (date: string) => {
    return (
      measurementsByDate.get(date) || new Map<string, BodyMeasurementRecord>()
    );
  };

  // Get all unique measurement types for the selected date(s)
  const getDisplayMeasurementTypes = () => {
    if (viewMode === "single") {
      const measurementsMap = getMeasurementsForDate(selectedDate);
      return Array.from(measurementsMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([type, record]) => ({
          type,
          primary: record,
          comparison: null,
        }));
    } else {
      const primaryMeasurementsMap = getMeasurementsForDate(selectedDate);
      const comparisonMeasurementsMap = getMeasurementsForDate(comparisonDate);

      // Get all unique measurement types from both dates
      const allTypes = new Set([
        ...Array.from(primaryMeasurementsMap.keys()),
        ...Array.from(comparisonMeasurementsMap.keys()),
      ]);

      return Array.from(allTypes)
        .sort()
        .map((type) => ({
          type,
          primary: primaryMeasurementsMap.get(type) || null,
          comparison: comparisonMeasurementsMap.get(type) || null,
        }));
    }
  };

  // Map body measurements to SVG regions
  const bodyParts: BodyPart[] = [
    {
      id: "neck",
      name: "Neck",
      x: 200,
      y: 100,
      dataPoints: [
        {
          label: "Neck",
          value: getMeasurementData("neck").primary?.value,
          unit: getMeasurementData("neck").primary?.unit || "cm",
          color: getColorForMeasurement("neck"),
        },
      ],
    },
    {
      id: "chest",
      name: "Chest",
      x: 200,
      y: 140,
      dataPoints: [
        {
          label: "Chest",
          value: getMeasurementData("chest").primary?.value,
          unit: getMeasurementData("chest").primary?.unit || "cm",
          color: getColorForMeasurement("chest"),
        },
      ],
    },
    {
      id: "waist",
      name: "Waist",
      x: 200,
      y: 180,
      dataPoints: [
        {
          label: "Waist",
          value: getMeasurementData("waist").primary?.value,
          unit: getMeasurementData("waist").primary?.unit || "cm",
          color: getColorForMeasurement("waist"),
        },
      ],
    },
    {
      id: "hips",
      name: "Hips",
      x: 200,
      y: 220,
      dataPoints: [
        {
          label: "Hips",
          value: getMeasurementData("hips").primary?.value,
          unit: getMeasurementData("hips").primary?.unit || "cm",
          color: getColorForMeasurement("hips"),
        },
      ],
    },
    {
      id: "right-arm",
      name: "Right Arm",
      x: 120,
      y: 150,
      dataPoints: [
        {
          label: "Upper Arm",
          value: getMeasurementData("upper arm (right)").primary?.value,
          unit: getMeasurementData("upper arm (right)").primary?.unit || "cm",
          color: getColorForMeasurement("upper arm (right)"),
        },
        {
          label: "Forearm",
          value: getMeasurementData("forearm (right)").primary?.value,
          unit: getMeasurementData("forearm (right)").primary?.unit || "cm",
          color: getColorForMeasurement("forearm (right)"),
        },
      ],
    },
    {
      id: "left-arm",
      name: "Left Arm",
      x: 280,
      y: 150,
      dataPoints: [
        {
          label: "Upper Arm",
          value: getMeasurementData("upper arm (left)").primary?.value,
          unit: getMeasurementData("upper arm (left)").primary?.unit || "cm",
          color: getColorForMeasurement("upper arm (left)"),
        },
        {
          label: "Forearm",
          value: getMeasurementData("forearm (left)").primary?.value,
          unit: getMeasurementData("forearm (left)").primary?.unit || "cm",
          color: getColorForMeasurement("forearm (left)"),
        },
      ],
    },
    {
      id: "right-leg",
      name: "Right Leg",
      x: 160,
      y: 320,
      dataPoints: [
        {
          label: "Thigh",
          value: getMeasurementData("thigh (right)").primary?.value,
          unit: getMeasurementData("thigh (right)").primary?.unit || "cm",
          color: getColorForMeasurement("thigh (right)"),
        },
        {
          label: "Calf",
          value: getMeasurementData("calf (right)").primary?.value,
          unit: getMeasurementData("calf (right)").primary?.unit || "cm",
          color: getColorForMeasurement("calf (right)"),
        },
      ],
    },
    {
      id: "left-leg",
      name: "Left Leg",
      x: 240,
      y: 320,
      dataPoints: [
        {
          label: "Thigh",
          value: getMeasurementData("thigh (left)").primary?.value,
          unit: getMeasurementData("thigh (left)").primary?.unit || "cm",
          color: getColorForMeasurement("thigh (left)"),
        },
        {
          label: "Calf",
          value: getMeasurementData("calf (left)").primary?.value,
          unit: getMeasurementData("calf (left)").primary?.unit || "cm",
          color: getColorForMeasurement("calf (left)"),
        },
      ],
    },
  ];

  // Get overall stats
  const totalMeasurements = data.length;
  const uniqueMeasurementTypes = new Set(
    data.map((record) => record.measurement)
  ).size;
  const bodyweightData = getMeasurementData("bodyweight");
  const bodyFatData = getMeasurementData("body fat percentage");

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Comparison Selector */}
        {dateOptions.length > 0 && (
          <div className="mb-6 p-4 border rounded-lg bg-muted/50">
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">View:</span>
                <ReusableSelect
                  options={[
                    { id: "single", label: "Latest Data" },
                    { id: "comparison", label: "Compare Dates" },
                  ]}
                  value={viewMode}
                  onChange={(value: string) => setViewMode(value as ViewMode)}
                  title="view mode"
                  triggerClassName="w-[160px]"
                />
              </div>

              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">
                  {viewMode === "comparison" ? "Primary" : "Date"}:
                </span>
                <ReusableSelect
                  options={dateOptions.map((option) => ({
                    id: option.value,
                    label: option.label,
                  }))}
                  value={selectedDate}
                  onChange={setSelectedDate}
                  title="date"
                  triggerClassName="w-[180px]"
                />
              </div>

              {viewMode === "comparison" && (
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">Compare to:</span>
                  <ReusableSelect
                    options={dateOptions
                      .filter((option) => option.value !== selectedDate)
                      .map((el) => ({ id: el.value, label: el.label }))}
                    value={comparisonDate}
                    onChange={setComparisonDate}
                    title="comparison date"
                    triggerClassName="w-[180px]"
                    disabled={dateOptions.length <= 1}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex flex-col items-center justify-center">
          {/* Overall Stats */}
          <div className="text-center mb-2">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 md:gap-8">
              {bodyweightData.primary && (
                <div className="p-3 rounded-lg bg-muted">
                  <p className="text-sm text-muted-foreground">
                    {viewMode === "single" ? "Latest Weight" : "Weight"}
                  </p>
                  <div className="flex items-center gap-2">
                    <p className="text-xl font-bold text-foreground">
                      {formatValue(
                        bodyweightData.primary.value,
                        bodyweightData.primary.unit
                      )}
                    </p>
                    {viewMode === "comparison" && bodyweightData.comparison && (
                      <>
                        {(() => {
                          const changeInfo = getChangeInfo("bodyweight");
                          return changeInfo && !changeInfo.isUnchanged ? (
                            <div className="flex items-center">
                              {changeInfo.isIncrease ? (
                                <TrendingUp className="h-4 w-4 text-red-500" />
                              ) : (
                                <TrendingDown className="h-4 w-4 text-green-500" />
                              )}
                              <span
                                className={`text-xs ml-1 ${changeInfo.isIncrease ? "text-red-500" : "text-green-500"}`}
                              >
                                {Math.abs(changeInfo.change).toFixed(1)}
                              </span>
                            </div>
                          ) : (
                            <Minus className="h-4 w-4 text-muted-foreground" />
                          );
                        })()}
                      </>
                    )}
                  </div>
                  {viewMode === "comparison" && bodyweightData.comparison && (
                    <p className="text-xs text-muted-foreground">
                      vs{" "}
                      {formatValue(
                        bodyweightData.comparison.value,
                        bodyweightData.comparison.unit
                      )}
                    </p>
                  )}
                </div>
              )}
              {bodyFatData.primary && (
                <div className="p-3 rounded-lg bg-muted">
                  <p className="text-sm text-muted-foreground">
                    {viewMode === "single" ? "Body Fat" : "Body Fat"}
                  </p>
                  <div className="flex items-center gap-2">
                    <p className="text-xl font-bold text-foreground">
                      {formatValue(
                        bodyFatData.primary.value,
                        bodyFatData.primary.unit
                      )}
                    </p>
                    {viewMode === "comparison" && bodyFatData.comparison && (
                      <>
                        {(() => {
                          const changeInfo = getChangeInfo(
                            "body fat percentage"
                          );
                          return changeInfo && !changeInfo.isUnchanged ? (
                            <div className="flex items-center">
                              {changeInfo.isIncrease ? (
                                <TrendingUp className="h-4 w-4 text-red-500" />
                              ) : (
                                <TrendingDown className="h-4 w-4 text-green-500" />
                              )}
                              <span
                                className={`text-xs ml-1 ${changeInfo.isIncrease ? "text-red-500" : "text-green-500"}`}
                              >
                                {Math.abs(changeInfo.change).toFixed(1)}%
                              </span>
                            </div>
                          ) : (
                            <Minus className="h-4 w-4 text-muted-foreground" />
                          );
                        })()}
                      </>
                    )}
                  </div>
                  {viewMode === "comparison" && bodyFatData.comparison && (
                    <p className="text-xs text-muted-foreground">
                      vs{" "}
                      {formatValue(
                        bodyFatData.comparison.value,
                        bodyFatData.comparison.unit
                      )}
                    </p>
                  )}
                </div>
              )}
              <div className="p-3 rounded-lg bg-muted">
                <p className="text-sm text-muted-foreground">Total Records</p>
                <p className="text-xl font-bold text-foreground">
                  {totalMeasurements}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-muted">
                <p className="text-sm text-muted-foreground">
                  Measurement Types
                </p>
                <p className="text-xl font-bold text-foreground">
                  {uniqueMeasurementTypes}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Body Visualization and Measurements */}
        <div className="flex flex-col lg:flex-row gap-6 mt-4">
          {/* Body SVG Visualization */}
          <div className="relative w-full max-w-md h-[450px] lg:flex-shrink-0">
            <svg viewBox="0 0 400 500" className="w-full h-full">
              {/* Simple body outline using basic geometric shapes - same as DEXA */}
              <g stroke="#d1d5db" strokeWidth="2" fill="none">
                {/* Head - Simple Circle */}
                <circle cx="200" cy="60" r="30" />
                {/* Neck - Simple Line */}
                <line x1="200" y1="90" x2="200" y2="110" />
                {/* Body - Rectangle */}
                <rect x="150" y="110" width="100" height="150" rx="4" />
                {/* Arms - Simple Lines */}
                <line x1="150" y1="130" x2="80" y2="180" /> {/* Right Arm */}
                <line x1="250" y1="130" x2="320" y2="180" /> {/* Left Arm */}
                {/* Legs - Simple Lines */}
                <line x1="170" y1="260" x2="150" y2="390" /> {/* Right Leg */}
                <line x1="230" y1="260" x2="250" y2="390" /> {/* Left Leg */}
              </g>

              {/* Interactive dots for each body part */}
              {bodyParts.map((part) => (
                <ReusableTooltip
                  key={part.id}
                  delayDuration={1}
                  renderTrigger={
                    <circle
                      cx={part.x}
                      cy={part.y}
                      r={8}
                      fill={part.dataPoints[0].color || "#94a3b8"}
                      opacity={0.7}
                      stroke="#fff"
                      strokeWidth="2"
                      style={{
                        cursor: "pointer",
                        transition: "r 0.2s, opacity 0.2s",
                      }}
                    />
                  }
                  renderContent={
                    <div className="bg-background border rounded-md shadow-md p-3 min-w-[200px]">
                      <h4 className="font-medium text-sm mb-2 text-foreground">
                        {part.name}
                      </h4>
                      <div className="space-y-2">
                        {part.dataPoints.map((dataPoint, i) => {
                          const measurementData = getMeasurementData(
                            dataPoint.label.toLowerCase()
                          );
                          const changeInfo = getChangeInfo(
                            dataPoint.label.toLowerCase()
                          );
                          return (
                            <div key={i} className="flex flex-col text-xs">
                              <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">
                                  {dataPoint.label}:
                                </span>
                                <div className="flex items-center gap-1">
                                  <span className="font-medium text-foreground">
                                    {dataPoint.value !== undefined
                                      ? formatValue(
                                          dataPoint.value,
                                          dataPoint.unit
                                        )
                                      : "No data"}
                                  </span>
                                  {viewMode === "comparison" &&
                                    changeInfo &&
                                    !changeInfo.isUnchanged && (
                                      <div className="flex items-center">
                                        {changeInfo.isIncrease ? (
                                          <TrendingUp className="h-3 w-3 text-red-500" />
                                        ) : (
                                          <TrendingDown className="h-3 w-3 text-green-500" />
                                        )}
                                      </div>
                                    )}
                                </div>
                              </div>
                              {viewMode === "comparison" &&
                                measurementData.comparison && (
                                  <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>vs:</span>
                                    <span>
                                      {formatValue(
                                        measurementData.comparison.value,
                                        measurementData.comparison.unit
                                      )}
                                    </span>
                                  </div>
                                )}
                              {viewMode === "comparison" &&
                                changeInfo &&
                                !changeInfo.isUnchanged && (
                                  <div className="text-xs text-muted-foreground">
                                    <span
                                      className={
                                        changeInfo.isIncrease
                                          ? "text-red-500"
                                          : "text-green-500"
                                      }
                                    >
                                      {changeInfo.isIncrease ? "+" : ""}
                                      {changeInfo.change.toFixed(1)}{" "}
                                      {measurementData.primary?.unit}
                                    </span>
                                  </div>
                                )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  }
                  contentClassName="p-0 z-2"
                  side="right"
                  align="center"
                />
              ))}
            </svg>

            {/* Legend */}
            <div className="absolute bottom-0 left-0 right-0 flex justify-center items-center gap-4 text-xs">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-[#8884d8] mr-1"></div>
                <span className="text-foreground">Has Data</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-[#94a3b8] mr-1"></div>
                <span className="text-foreground">No Data</span>
              </div>
            </div>
          </div>

          {/* Measurements Panel */}
          <div className="flex-1 min-w-0">
            <div className="bg-muted/30 rounded-lg p-4 h-[450px] overflow-y-auto">
              <h3 className="font-semibold text-lg mb-4">
                {viewMode === "single"
                  ? `Measurements for ${selectedDate ? (() => {
                      try {
                        return format(new Date(selectedDate + 'T00:00:00'), "MMM d, yyyy");
                      } catch {
                        return selectedDate;
                      }
                    })() : ""}`
                  : "Measurement Comparison"}
              </h3>

              {getDisplayMeasurementTypes().length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  No measurements found for selected date
                  {viewMode === "comparison" ? "s" : ""}
                </div>
              ) : (
                <div className="space-y-3">
                  {getDisplayMeasurementTypes().map((measurement) => {
                    const changeInfo =
                      viewMode === "comparison" &&
                      measurement.primary &&
                      measurement.comparison
                        ? {
                            change:
                              measurement.primary.value -
                              measurement.comparison.value,
                            isIncrease:
                              measurement.primary.value >
                              measurement.comparison.value,
                            isDecrease:
                              measurement.primary.value <
                              measurement.comparison.value,
                            isUnchanged:
                              Math.abs(
                                measurement.primary.value -
                                  measurement.comparison.value
                              ) < 0.1,
                          }
                        : null;

                    return (
                      <div
                        key={measurement.type}
                        className="bg-background rounded-md p-3 border"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-sm">
                            {measurement.type}
                          </h4>
                          {viewMode === "comparison" &&
                            changeInfo &&
                            !changeInfo.isUnchanged && (
                              <div className="flex items-center gap-1">
                                {changeInfo.isIncrease ? (
                                  <TrendingUp className="h-4 w-4 text-red-500" />
                                ) : (
                                  <TrendingDown className="h-4 w-4 text-green-500" />
                                )}
                                <span
                                  className={`text-sm font-medium ${changeInfo.isIncrease ? "text-red-500" : "text-green-500"}`}
                                >
                                  {changeInfo.isIncrease ? "+" : ""}
                                  {changeInfo.change.toFixed(1)}
                                </span>
                              </div>
                            )}
                        </div>

                        <div className="space-y-1 text-sm">
                          {measurement.primary ? (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">
                                {viewMode === "comparison"
                                  ? "Primary:"
                                  : "Value:"}
                              </span>
                              <span className="font-medium">
                                {formatValue(
                                  measurement.primary.value,
                                  measurement.primary.unit
                                )}
                              </span>
                            </div>
                          ) : (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">
                                Primary:
                              </span>
                              <span className="text-muted-foreground">
                                No data
                              </span>
                            </div>
                          )}

                          {viewMode === "comparison" && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">
                                Comparison:
                              </span>
                              <span
                                className={
                                  measurement.comparison
                                    ? "font-medium"
                                    : "text-muted-foreground"
                                }
                              >
                                {measurement.comparison
                                  ? formatValue(
                                      measurement.comparison.value,
                                      measurement.comparison.unit
                                    )
                                  : "No data"}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 text-sm text-center text-foreground">
          {viewMode === "single"
            ? "Hover over the dots to see latest measurements for each body region"
            : "Hover over the dots to see measurement comparisons with change indicators"}
        </div>
      </CardContent>
    </Card>
  );
}
