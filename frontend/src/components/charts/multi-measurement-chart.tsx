import React, { useState, useMemo } from "react";
import { useStore } from "@tanstack/react-store";
import dataStore from "@/store/data-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { ScrollArea } from "@/components/ui/scroll-area";
import CustomLineChart from "./line-chart";
import { formatChartDate, CHART_COLORS } from "./chart-utils";
import { LineConfig } from "./charts";
import { BarChart3, Calendar as CalendarIcon, Settings } from "lucide-react";
import { DateRange } from "react-day-picker";

type TimeRange = "all" | "3m" | "6m" | "1y" | "2y" | "custom";

interface MeasurementConfig {
  id: string;
  datasetKey: keyof typeof dataStore.state;
  label: string;
  field: string;
  unit: string;
  color: string;
  enabled: boolean;
  processor?: (
    data: any[]
  ) => Array<{ date: Date; value: number; dateFormatted: string }>;
}

interface ChartDataPoint {
  date: string;
  dateObj: Date;
  [key: string]: any;
}

interface MultiMeasurementChartProps {
  bodyMeasurementsData?: any[];
}

export default function MultiMeasurementChart({
  bodyMeasurementsData,
}: MultiMeasurementChartProps = {}) {
  // Get data from store
  const bodyMeasurementsRaw = useStore(
    dataStore,
    (state) => state.body_measurements
  );
  const dexaDataRaw = useStore(dataStore, (state) => state.dexa);

  // Memoize data to prevent dependency issues - use prop data if provided, otherwise use store data
  const bodyMeasurements = useMemo(
    () => bodyMeasurementsData || bodyMeasurementsRaw || [],
    [bodyMeasurementsData, bodyMeasurementsRaw]
  );
  const dexaData = useMemo(() => dexaDataRaw || [], [dexaDataRaw]);

  const [timeRange, setTimeRange] = useState<TimeRange>("all");
  const [customDateRange, setCustomDateRange] = useState<
    DateRange | undefined
  >();

  // Dynamically generate measurement configs based on actual data
  const measurementConfigs = useMemo(() => {
    const configs: MeasurementConfig[] = [];
    let colorIndex = 0;

    // Get unique measurement types from body measurements, excluding bodyweight/weight
    const uniqueMeasurements = Array.from(
      new Set(
        bodyMeasurements
          .map((record: any) => record.measurement)
          .filter((measurement: string) => {
            if (!measurement || typeof measurement !== "string") return false;
            const lowerMeasurement = measurement.toLowerCase().trim();
            return (
              lowerMeasurement !== "weight" &&
              lowerMeasurement !== "bodyweight" &&
              lowerMeasurement !== "body weight" &&
              lowerMeasurement !== "percentage"
            ); // Filter out mysterious "percentage" entry
          })
      )
    );

    // Add body measurement types
    uniqueMeasurements.forEach((measurement: string) => {
      const measurementData = bodyMeasurements.filter(
        (record: any) => record.measurement === measurement
      );

      if (measurementData.length > 0) {
        // Get the most common unit for this measurement type
        const units = measurementData.map((record: any) => record.unit);
        const mostCommonUnit =
          units
            .sort(
              (a: string, b: string) =>
                units.filter((v: string) => v === a).length -
                units.filter((v: string) => v === b).length
            )
            .pop() || "";

        // Create a safe field name by removing special characters and normalizing
        const safeFieldName = measurement
          .toLowerCase()
          .replace(/[%]/g, "_percent")
          .replace(/[^a-z0-9_]/g, "_")
          .replace(/_+/g, "_")
          .replace(/^_|_$/g, "");

        configs.push({
          id: `body_${safeFieldName}`,
          datasetKey: "body_measurements",
          label: measurement, // Keep the original label exactly as it appears in data
          field: `body_${safeFieldName}`,
          unit: mostCommonUnit,
          color: CHART_COLORS[colorIndex % CHART_COLORS.length],
          enabled: colorIndex < 3, // Enable first 3 by default
          processor: (data) => {
            return data
              .filter((record: any) => record.measurement === measurement)
              .map((record: any) => ({
                date: new Date(record.date),
                value: record.value,
                dateFormatted: formatChartDate(record.date),
              }));
          },
        });
        colorIndex++;
      }
    });

    // Only add DEXA measurements if available and no body fat measurement exists in body measurements
    const hasBodyFatInBodyMeasurements = uniqueMeasurements.some(
      (m) => m.toLowerCase().includes("body") && m.toLowerCase().includes("fat")
    );

    if (dexaData.length > 0 && !hasBodyFatInBodyMeasurements) {
      const dexaMeasurements = [
        {
          id: "dexa_body_fat",
          label: "Body Fat % (DEXA)",
          field: "dexa_body_fat",
          unit: "%",
          processor: (data: any[]) => {
            return data
              .filter((record: any) => record.total_body_fat_percentage != null)
              .map((record: any) => ({
                date: new Date(record.date),
                value: record.total_body_fat_percentage,
                dateFormatted: formatChartDate(record.date),
              }));
          },
        },
        {
          id: "dexa_lean_mass",
          label: "Lean Mass (DEXA)",
          field: "dexa_lean_mass",
          unit: "lbs",
          processor: (data: any[]) => {
            return data
              .filter((record: any) => record.lean_tissue_lbs != null)
              .map((record: any) => ({
                date: new Date(record.date),
                value: record.lean_tissue_lbs,
                dateFormatted: formatChartDate(record.date),
              }));
          },
        },
      ];

      dexaMeasurements.forEach((dexaMeasurement) => {
        const testData = dexaMeasurement.processor(dexaData);
        if (testData.length > 0) {
          configs.push({
            id: dexaMeasurement.id,
            datasetKey: "dexa",
            label: dexaMeasurement.label,
            field: dexaMeasurement.field,
            unit: dexaMeasurement.unit,
            color: CHART_COLORS[colorIndex % CHART_COLORS.length],
            enabled: false,
            processor: dexaMeasurement.processor,
          });
          colorIndex++;
        }
      });
    }

    return configs;
  }, [bodyMeasurements, dexaData]);

  const [enabledMeasurements, setEnabledMeasurements] = useState<Set<string>>(
    new Set()
  );

  // Initialize enabled measurements based on default enabled configs
  React.useEffect(() => {
    const defaultEnabled = new Set(
      measurementConfigs
        .filter((config) => config.enabled)
        .map((config) => config.id)
    );
    setEnabledMeasurements(defaultEnabled);
  }, [measurementConfigs]);

  // Process all measurement data
  const processedData = useMemo(() => {
    const allDatasets = {
      body_measurements: bodyMeasurements,
      dexa: dexaData,
    };

    const results: Record<
      string,
      Array<{ date: Date; value: number; dateFormatted: string }>
    > = {};

    measurementConfigs.forEach((config) => {
      if (enabledMeasurements.has(config.id) && config.processor) {
        const dataset =
          allDatasets[config.datasetKey as keyof typeof allDatasets];
        if (dataset) {
          results[config.id] = config.processor(dataset);
        }
      }
    });

    return results;
  }, [measurementConfigs, enabledMeasurements, bodyMeasurements, dexaData]);

  // Create unified chart data with date filtering
  const chartData = useMemo(() => {
    const enabledConfigs = measurementConfigs.filter((config) =>
      enabledMeasurements.has(config.id)
    );

    if (enabledConfigs.length === 0) return [];

    // Get all unique dates from enabled measurements
    const allDates = new Set<string>();
    enabledConfigs.forEach((config) => {
      if (processedData[config.id]) {
        processedData[config.id].forEach((item) => {
          allDates.add(item.dateFormatted);
        });
      }
    });

    // Create data points for each unique date
    const dateMap = new Map<string, ChartDataPoint>();

    // First, create unique data points for each date
    Array.from(allDates).forEach((dateStr) => {
      if (!dateMap.has(dateStr)) {
        dateMap.set(dateStr, {
          date: dateStr,
          dateObj: new Date(dateStr), // This will be used for filtering
        });
      }
    });

    // Then populate measurement values for each date
    enabledConfigs.forEach((config) => {
      const measurementData = processedData[config.id];
      if (measurementData) {
        measurementData.forEach((item) => {
          const dataPoint = dateMap.get(item.dateFormatted);
          if (dataPoint) {
            // If multiple measurements exist for the same date and measurement type,
            // use the most recent one (or average them)
            if (dataPoint[config.field] === undefined) {
              dataPoint[config.field] = item.value;
            } else {
              // Average multiple values for the same measurement type on the same date
              dataPoint[config.field] =
                ((dataPoint[config.field] as number) + item.value) / 2;
            }
          }
        });
      }
    });

    // Convert map to array and sort
    const data: ChartDataPoint[] = Array.from(dateMap.values()).sort(
      (a, b) => a.dateObj.getTime() - b.dateObj.getTime()
    );

    // Apply time range filtering
    if (timeRange !== "all") {
      const now = new Date();
      let startDate = new Date();

      if (timeRange === "custom" && customDateRange?.from) {
        startDate = customDateRange.from;
        const endDate = customDateRange.to || now;
        return data.filter(
          (item) => item.dateObj >= startDate && item.dateObj <= endDate
        );
      } else {
        switch (timeRange) {
          case "3m":
            startDate.setMonth(now.getMonth() - 3);
            break;
          case "6m":
            startDate.setMonth(now.getMonth() - 6);
            break;
          case "1y":
            startDate.setFullYear(now.getFullYear() - 1);
            break;
          case "2y":
            startDate.setFullYear(now.getFullYear() - 2);
            break;
        }
        return data.filter((item) => item.dateObj >= startDate);
      }
    }

    return data;
  }, [
    processedData,
    measurementConfigs,
    enabledMeasurements,
    timeRange,
    customDateRange,
  ]);

  // Create line configurations for chart
  const lineConfigs: LineConfig[] = useMemo(() => {
    return measurementConfigs
      .filter(
        (config) =>
          enabledMeasurements.has(config.id) &&
          processedData[config.id]?.length > 0
      )
      .map((config) => ({
        dataKey: config.field,
        name: config.label,
        color: config.color,
        unit: config.unit,
        strokeWidth: 2,
        type: "monotone" as const,
        connectNulls: false,
      }));
  }, [measurementConfigs, enabledMeasurements, processedData]);

  const toggleMeasurement = (measurementId: string) => {
    setEnabledMeasurements((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(measurementId)) {
        newSet.delete(measurementId);
      } else {
        newSet.add(measurementId);
      }
      return newSet;
    });
  };

  const enabledCount = enabledMeasurements.size;
  const hasData = chartData.length > 0 && lineConfigs.length > 0;

  const timeRangeOptions = [
    { value: "all", label: "All Time" },
    { value: "3m", label: "Last 3 Months" },
    { value: "6m", label: "Last 6 Months" },
    { value: "1y", label: "Last Year" },
    { value: "2y", label: "Last 2 Years" },
    { value: "custom", label: "Custom Range" },
  ];

  const formatDateRange = (range: DateRange | undefined) => {
    if (!range?.from) return "Select dates";
    if (!range.to) return range.from.toLocaleDateString();
    return `${range.from.toLocaleDateString()} - ${range.to.toLocaleDateString()}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Multi-Measurement Trends
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            {/* Measurement Toggles */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline">
                  <Settings className="h-4 w-4 mr-2" />
                  Measurements ({enabledCount})
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="end">
                <div className="space-y-3">
                  <h4 className="font-medium">Select Measurements</h4>
                  <ScrollArea className="h-[300px] pr-4">
                    <div className="space-y-3">
                      {measurementConfigs.map((config) => {
                        const dataCount = processedData[config.id]?.length || 0;
                        return (
                          <div
                            key={config.id}
                            className="flex items-center space-x-2"
                          >
                            <Checkbox
                              id={config.id}
                              checked={enabledMeasurements.has(config.id)}
                              onCheckedChange={() =>
                                toggleMeasurement(config.id)
                              }
                            />
                            <label
                              htmlFor={config.id}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-1"
                            >
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: config.color }}
                                />
                                {config.label}
                                <span className="text-muted-foreground">
                                  ({dataCount} points)
                                </span>
                              </div>
                            </label>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </div>
              </PopoverContent>
            </Popover>

            {/* Time Range Filter */}
            <div className="flex items-center gap-2">
              <Select
                value={timeRange}
                onValueChange={(value: string) => {
                  setTimeRange(value as TimeRange);
                  if (value !== "custom") {
                    setCustomDateRange(undefined);
                  }
                }}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Select time range" />
                </SelectTrigger>
                <SelectContent>
                  {timeRangeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {timeRange === "custom" && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="w-48">
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      {formatDateRange(customDateRange)}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={customDateRange?.from}
                      selected={customDateRange}
                      onSelect={setCustomDateRange}
                      numberOfMonths={2}
                    />
                  </PopoverContent>
                </Popover>
              )}
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {enabledCount === 0 ? (
          <div className="text-center py-12">
            <BarChart3 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              No measurements selected
            </h3>
            <p className="text-muted-foreground">
              Click the "Measurements" button above to select which metrics to
              display.
            </p>
          </div>
        ) : !hasData ? (
          <div className="text-center py-12">
            <BarChart3 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No data available</h3>
            <p className="text-muted-foreground">
              No data found for the selected measurements and time period.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <p className="text-sm text-muted-foreground">
                Showing {enabledCount} measurement
                {enabledCount !== 1 ? "s" : ""}
                {timeRange !== "all" && (
                  <span className="ml-1">
                    for{" "}
                    {timeRangeOptions
                      .find((opt) => opt.value === timeRange)
                      ?.label.toLowerCase()}
                    {timeRange === "custom" &&
                      customDateRange &&
                      ` (${formatDateRange(customDateRange)})`}
                  </span>
                )}
                • {chartData.length} data points
              </p>
            </div>

            <CustomLineChart
              data={chartData}
              lines={lineConfigs}
              xAxisKey="date"
              yAxisUnit=""
              yAxisDomain={["auto", "auto"]}
              tooltipFormatter={(
                value: number | string,
                name: string,
                props: any
              ) => {
                const config = measurementConfigs.find((c) => c.label === name);
                const unit = config?.unit || props.unit || "";
                return [`${value} ${unit}`];
              }}
              height={400}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}
