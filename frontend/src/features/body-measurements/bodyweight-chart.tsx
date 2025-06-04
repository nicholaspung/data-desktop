import { useState, useMemo } from "react";
import { useStore } from "@tanstack/react-store";
import dataStore from "@/store/data-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

export default function BodyweightChart() {
  const data = useStore(dataStore, (state) => state.body_measurements) || [];
  const [averagingPeriod, setAveragingPeriod] = useState<AveragingPeriod>("daily");
  const [timeRange, setTimeRange] = useState<TimeRange>("all");
  const [customDateRange, setCustomDateRange] = useState<DateRange | undefined>();

  const typedData = data as BodyMeasurementRecord[];

  // Debug logging
  console.log("timeRange:", timeRange);
  console.log("typedData length:", typedData.length);

  // Get all weight measurements (before filtering)
  const allWeightData = useMemo(() => {
    return typedData
      .filter((record) => record.measurement.toLowerCase() === "bodyweight" || record.measurement.toLowerCase() === "weight")
      .map((record) => ({
        date: formatChartDate(record.date),
        weight: record.value,
        dateObj: new Date(record.date),
        unit: record.unit,
      }))
      .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
  }, [typedData]);

  // Filter weight measurements with date range filtering
  const weightData = useMemo(() => {
    console.log("Filtering data. timeRange:", timeRange, "allWeightData length:", allWeightData.length);
    let filtered = [...allWeightData];

    // Apply date range filtering - only filter if timeRange is defined and not "all"
    if (timeRange && timeRange !== "all") {
      const now = new Date();
      let startDate = new Date();

      if (timeRange === "custom" && customDateRange?.from) {
        startDate = customDateRange.from;
        const endDate = customDateRange.to || now;
        console.log("Custom date range:", startDate, "to", endDate);
        filtered = filtered.filter(item => 
          item.dateObj >= startDate && item.dateObj <= endDate
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
        
        console.log("Date filtering from:", startDate, "to now");
        filtered = filtered.filter(item => item.dateObj >= startDate);
      }
    }

    console.log("Filtered result length:", filtered.length);
    if (filtered.length > 0) {
      console.log("Sample filtered data:", filtered.slice(0, 3));
    }
    return filtered;
  }, [allWeightData, timeRange, customDateRange]);

  // Calculate averaged data based on selected period
  const chartData = useMemo(() => {
    if (weightData.length === 0) return [];

    if (averagingPeriod === "daily") {
      // For daily, group by date and average multiple measurements on same day
      const dailyGroups = weightData.reduce((groups, item) => {
        const dateKey = item.date;
        if (!groups[dateKey]) {
          groups[dateKey] = [];
        }
        groups[dateKey].push(item);
        return groups;
      }, {} as Record<string, typeof weightData>);

      return Object.entries(dailyGroups).map(([date, measurements]) => {
        const avgWeight = measurements.reduce((sum, m) => sum + m.weight, 0) / measurements.length;
        return {
          date,
          weight: Number(avgWeight.toFixed(1)),
          dateObj: measurements[0].dateObj,
        };
      }).sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
    }

    // For averaging periods, calculate rolling averages
    const result: ChartDataPoint[] = [];
    const periodDays = {
      weekly: 7,
      biweekly: 14,
      monthly: 30,
    }[averagingPeriod];

    // Group daily averages first
    const dailyAverages = weightData.reduce((groups, item) => {
      const dateKey = item.date;
      if (!groups[dateKey]) {
        groups[dateKey] = { total: 0, count: 0, dateObj: item.dateObj };
      }
      groups[dateKey].total += item.weight;
      groups[dateKey].count += 1;
      return groups;
    }, {} as Record<string, { total: number; count: number; dateObj: Date }>);

    const sortedDates = Object.keys(dailyAverages).sort((a, b) => 
      dailyAverages[a].dateObj.getTime() - dailyAverages[b].dateObj.getTime()
    );

    // Calculate rolling averages
    for (let i = 0; i < sortedDates.length; i++) {
      const currentDate = sortedDates[i];
      const currentDateObj = dailyAverages[currentDate].dateObj;
      
      // Get measurements within the period window
      const periodStart = new Date(currentDateObj);
      periodStart.setDate(periodStart.getDate() - periodDays + 1);
      
      const relevantDates = sortedDates.filter(date => {
        const dateObj = dailyAverages[date].dateObj;
        return dateObj >= periodStart && dateObj <= currentDateObj;
      });

      if (relevantDates.length > 0) {
        const totalWeight = relevantDates.reduce((sum, date) => {
          const dayData = dailyAverages[date];
          return sum + (dayData.total / dayData.count);
        }, 0);
        
        const avgWeight = totalWeight / relevantDates.length;
        
        result.push({
          date: currentDate,
          weight: Number(avgWeight.toFixed(1)),
          dateObj: currentDateObj,
        });
      }
    }

    console.log("Chart data sample:", result.slice(0, 3));
    return result;
  }, [weightData, averagingPeriod]);

  const unit = allWeightData.length > 0 ? allWeightData[0].unit : "lbs";

  const periodLabels = {
    daily: "Daily",
    weekly: "7-Day Average",
    biweekly: "14-Day Average",
    monthly: "30-Day Average",
  };

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

  // Show empty state only if there are no weight measurements at all
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
            {/* Time Range Filter */}
            <div className="flex items-center gap-2">
              <Select
                value={timeRange || "all"}
                onValueChange={(value: string) => {
                  console.log("Time range changed to:", value);
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
            
            {/* Averaging Period Buttons */}
            <div className="flex gap-1">
              {(Object.keys(periodLabels) as AveragingPeriod[]).map((period) => (
                <Button
                  key={period}
                  variant={averagingPeriod === period ? "default" : "outline"}
                  size="sm"
                  onClick={() => setAveragingPeriod(period)}
                >
                  {periodLabels[period]}
                </Button>
              ))}
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <p className="text-sm text-muted-foreground">
            Showing {periodLabels[averagingPeriod].toLowerCase()} weight measurements
            {timeRange !== "all" && (
              <span className="ml-1">
                for {timeRangeOptions.find(opt => opt.value === timeRange)?.label.toLowerCase()}
                {timeRange === "custom" && customDateRange && ` (${formatDateRange(customDateRange)})`}
              </span>
            )}
            {chartData.length > 0 && (
              <span className="ml-1">
                • {chartData.length} data points
              </span>
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
            tooltipFormatter={(value: number | string) => [`${value} ${unit}`, `Weight`]}
            height={400}
          />
        ) : (
          <div className="text-center py-12">
            <Scale className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No data for selected period</h3>
            <p className="text-muted-foreground">
              No weight measurements found for the selected time range.
              {timeRange !== "all" && " Try selecting a different time period or adding more data."}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}