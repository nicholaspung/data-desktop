import { useState, useMemo } from "react";
import { useStore } from "@tanstack/react-store";
import dataStore from "@/store/data-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ReusableSelect from "@/components/reusable/reusable-select";
import CustomLineChart from "@/components/charts/line-chart";
import { formatChartDate } from "@/components/charts/chart-utils";
import { BodyMeasurementRecord } from "./types";
import { Scale, Calendar as CalendarIcon } from "lucide-react";
import { DateRange } from "react-day-picker";

type AveragingPeriod = "daily" | "weekly" | "biweekly" | "monthly";
type TimeRange = "all" | "3m" | "6m" | "1y" | "2y" | "custom";

interface ChartDataPoint {
  date: string;
  weight: number;
  dateObj: Date;
}

interface BodyweightChartProps {
  data?: BodyMeasurementRecord[];
}

export default function BodyweightChart({
  data: propData,
}: BodyweightChartProps = {}) {
  const storeData =
    useStore(dataStore, (state) => state.body_measurements) || [];
  const data = propData || storeData;
  const [averagingPeriod, setAveragingPeriod] =
    useState<AveragingPeriod>("daily");
  const [timeRange, setTimeRange] = useState<TimeRange>("all");
  const [customDateRange, setCustomDateRange] = useState<
    DateRange | undefined
  >();
  const [averagingStartDate, setAveragingStartDate] = useState<
    Date | undefined
  >();

  const typedData = data as BodyMeasurementRecord[];

  const allWeightData = useMemo(() => {
    return typedData
      .filter(
        (record) =>
          record.measurement.toLowerCase() === "bodyweight" ||
          record.measurement.toLowerCase() === "weight"
      )
      .map((record) => ({
        date: formatChartDate(record.date),
        weight: record.value,
        dateObj: new Date(record.date),
        unit: record.unit,
      }))
      .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
  }, [typedData]);

  const weightData = useMemo(() => {
    let filtered = [...allWeightData];

    if (timeRange && timeRange !== "all") {
      const now = new Date();
      let startDate = new Date();

      if (timeRange === "custom" && customDateRange?.from) {
        startDate = customDateRange.from;
        const endDate = customDateRange.to || now;
        filtered = filtered.filter(
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

        filtered = filtered.filter((item) => item.dateObj >= startDate);
      }
    }

    return filtered;
  }, [allWeightData, timeRange, customDateRange]);

  const defaultAveragingStartDate = useMemo(() => {
    if (weightData.length === 0) return undefined;
    const middleIndex = Math.floor(weightData.length / 2);
    return weightData[middleIndex]?.dateObj;
  }, [weightData]);

  const effectiveStartDate = averagingStartDate || defaultAveragingStartDate;

  const chartData = useMemo(() => {
    if (weightData.length === 0) return [];

    if (averagingPeriod === "daily") {
      const dailyGroups = weightData.reduce(
        (groups, item) => {
          const dateKey = item.date;
          if (!groups[dateKey]) {
            groups[dateKey] = [];
          }
          groups[dateKey].push(item);
          return groups;
        },
        {} as Record<string, typeof weightData>
      );

      return Object.entries(dailyGroups)
        .map(([date, measurements]) => {
          const avgWeight =
            measurements.reduce((sum, m) => sum + m.weight, 0) /
            measurements.length;
          return {
            date,
            weight: Number(avgWeight.toFixed(1)),
            dateObj: measurements[0].dateObj,
          };
        })
        .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
    }

    if (!effectiveStartDate) return [];

    const result: ChartDataPoint[] = [];
    const periodDays = {
      weekly: 7,
      biweekly: 14,
      monthly: 30,
    }[averagingPeriod];

    const dailyAverages = weightData.reduce(
      (groups, item) => {
        const dateKey = item.date;
        if (!groups[dateKey]) {
          groups[dateKey] = { total: 0, count: 0, dateObj: item.dateObj };
        }
        groups[dateKey].total += item.weight;
        groups[dateKey].count += 1;
        return groups;
      },
      {} as Record<string, { total: number; count: number; dateObj: Date }>
    );

    const sortedDates = Object.keys(dailyAverages).sort(
      (a, b) =>
        dailyAverages[a].dateObj.getTime() - dailyAverages[b].dateObj.getTime()
    );

    const startDate = new Date(effectiveStartDate);

    const periods: { start: Date; end: Date; displayDate: Date }[] = [];

    let currentPeriodStart = new Date(startDate);
    const firstDataDate = new Date(
      Math.min(...sortedDates.map((d) => dailyAverages[d].dateObj.getTime()))
    );
    const lastDataDate = new Date(
      Math.max(...sortedDates.map((d) => dailyAverages[d].dateObj.getTime()))
    );

    while (currentPeriodStart <= lastDataDate) {
      const periodEnd = new Date(currentPeriodStart);
      periodEnd.setDate(periodEnd.getDate() + periodDays - 1);

      periods.push({
        start: new Date(currentPeriodStart),
        end: periodEnd,
        displayDate: periodEnd,
      });

      currentPeriodStart.setDate(currentPeriodStart.getDate() + periodDays);
    }

    currentPeriodStart = new Date(startDate);
    currentPeriodStart.setDate(currentPeriodStart.getDate() - periodDays);

    while (currentPeriodStart >= firstDataDate) {
      const periodEnd = new Date(currentPeriodStart);
      periodEnd.setDate(periodEnd.getDate() + periodDays - 1);

      periods.push({
        start: new Date(currentPeriodStart),
        end: periodEnd,
        displayDate: periodEnd,
      });

      currentPeriodStart.setDate(currentPeriodStart.getDate() - periodDays);
    }

    for (const period of periods) {
      const datesInPeriod = sortedDates.filter((date) => {
        const dateObj = dailyAverages[date].dateObj;
        return dateObj >= period.start && dateObj <= period.end;
      });

      if (datesInPeriod.length > 0) {
        const totalWeight = datesInPeriod.reduce((sum, date) => {
          const dayData = dailyAverages[date];
          return sum + dayData.total / dayData.count;
        }, 0);

        const avgWeight = totalWeight / datesInPeriod.length;

        result.push({
          date: formatChartDate(period.displayDate.toISOString()),
          weight: Number(avgWeight.toFixed(1)),
          dateObj: period.displayDate,
        });
      }
    }

    return result.sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
  }, [weightData, averagingPeriod, effectiveStartDate]);

  const unit = allWeightData.length > 0 ? allWeightData[0].unit : "lbs";

  const periodLabels = {
    daily: "Daily",
    weekly: "7-Day Average",
    biweekly: "14-Day Average",
    monthly: "30-Day Average",
  };

  const averagingPeriodOptions = [
    { id: "daily", label: "Daily" },
    { id: "weekly", label: "7-Day Average" },
    { id: "biweekly", label: "14-Day Average" },
    { id: "monthly", label: "30-Day Average" },
  ];

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

  if (allWeightData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5" />
            Body Weight Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Scale className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">
              No weight measurements found. Add some weight data to see trends.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scale className="h-5 w-5" />
            Body Weight Trends
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex items-center gap-2">
              <Select
                value={timeRange || "all"}
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
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Period:</span>
              <ReusableSelect
                options={averagingPeriodOptions}
                value={averagingPeriod}
                onChange={(value: string) =>
                  setAveragingPeriod(value as AveragingPeriod)
                }
                title="averaging period"
                triggerClassName="w-40"
              />
            </div>
            {averagingPeriod !== "daily" && allWeightData.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Start date:</span>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="w-36">
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      {effectiveStartDate
                        ? effectiveStartDate.toLocaleDateString()
                        : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                      mode="single"
                      selected={averagingStartDate}
                      onSelect={(date) => setAveragingStartDate(date)}
                      initialFocus
                      disabled={(date) => {
                        const firstDate = allWeightData[0]?.dateObj;
                        const lastDate =
                          allWeightData[allWeightData.length - 1]?.dateObj;
                        return (
                          !firstDate ||
                          !lastDate ||
                          date < firstDate ||
                          date > lastDate
                        );
                      }}
                    />
                  </PopoverContent>
                </Popover>
                {averagingStartDate && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setAveragingStartDate(undefined)}
                  >
                    Reset
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <p className="text-sm text-muted-foreground">
            Showing {periodLabels[averagingPeriod].toLowerCase()} weight
            measurements
            {averagingPeriod !== "daily" && effectiveStartDate && (
              <span className="ml-1">
                (periods starting from {effectiveStartDate.toLocaleDateString()}
                )
              </span>
            )}
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
            {chartData.length > 0 && (
              <span className="ml-1">• {chartData.length} data points</span>
            )}
          </p>
        </div>
        {chartData.length > 0 ? (
          <CustomLineChart
            data={chartData}
            lines={[
              {
                dataKey: "weight",
                color: "#8884d8",
                strokeWidth: 2,
                type: "monotone",
                name: `Weight`,
                unit: unit,
              },
            ]}
            xAxisKey="date"
            yAxisUnit=""
            yAxisDomain={["auto", "auto"]}
            tooltipFormatter={(value: number | string) => [
              `${value} ${unit}`,
              `Weight`,
            ]}
            height={400}
          />
        ) : (
          <div className="text-center py-12">
            <Scale className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              No data for selected period
            </h3>
            <p className="text-muted-foreground">
              No weight measurements found for the selected time range.
              {timeRange !== "all" &&
                " Try selecting a different time period or adding more data."}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
