// src/features/dexa/visualization/regional-analysis-tab.tsx
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DexaScan } from "../dexa-visualization";
import { COLORS, formatDate } from "@/lib/date-utils";
import { LineChart, RadarChart, BarChart } from "@/components/charts";
import { ComparisonSelector, ViewMode } from "./comparison-selector";
import { format } from "date-fns";

const RegionalAnalysisTab = ({ data }: { data: DexaScan[] }) => {
  const [activeTab, setActiveTab] = useState("percentage");
  const [selectedScan, setSelectedScan] = useState<string>("");

  // Add state for comparison mode
  const [viewMode, setViewMode] = useState<ViewMode>("single");
  const [primaryDate, setPrimaryDate] = useState<string>("");
  const [comparisonDate, setComparisonDate] = useState<string>("");

  // Define metrics for percentage and absolute values
  const percentageMetrics = [
    { key: "arms_total_region_fat_percentage", name: "Arms" },
    { key: "legs_total_region_fat_percentage", name: "Legs" },
    { key: "trunk_total_region_fat_percentage", name: "Trunk" },
    { key: "android_total_region_fat_percentage", name: "Android" },
    { key: "gynoid_total_region_fat_percentage", name: "Gynoid" },
  ];

  const absoluteMetrics = [
    { key: "arms_fat_tissue_lbs", name: "Arms Fat" },
    { key: "legs_fat_tissue_lbs", name: "Legs Fat" },
    { key: "trunk_fat_tissue_lbs", name: "Trunk Fat" },
    { key: "android_fat_tissue_lbs", name: "Android Fat" },
    { key: "gynoid_fat_tissue_lbs", name: "Gynoid Fat" },
  ];

  const leanMassMetrics = [
    { key: "arms_lean_tissue_lbs", name: "Arms Lean" },
    { key: "legs_lean_tissue_lbs", name: "Legs Lean" },
    { key: "trunk_lean_tissue_lbs", name: "Trunk Lean" },
  ];

  // Date options for the scan selector
  const dateOptions = data
    .map((scan) => ({
      value: scan.id,
      label: formatDate(scan.date),
      date: new Date(scan.date),
    }))
    .sort((a, b) => b.date.getTime() - a.date.getTime()); // Sort newest first

  // Find selected scans
  const primaryScan = data.find((scan) => scan.id === primaryDate);
  const comparisonScan = data.find((scan) => scan.id === comparisonDate);

  // Set default scan when component loads
  if (dateOptions.length > 0) {
    if (!selectedScan) {
      setSelectedScan(dateOptions[0].value);
    }
    if (!primaryDate) {
      setPrimaryDate(dateOptions[0].value);
    }
    if (!comparisonDate && dateOptions.length > 1) {
      setComparisonDate(dateOptions[1].value);
    }
  }

  // Get comparison data for line charts
  const getPercentageComparisonData = () => {
    return data
      .map((item) => {
        const result: any = {
          date: formatDate(item.date),
          dateObj: item.date,
        };

        percentageMetrics.forEach((metric) => {
          result[metric.name] = item[metric.key] * 100 || 0;
        });

        return result;
      })
      .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
  };

  // Get absolute comparison data for line charts
  const getAbsoluteComparisonData = () => {
    return data
      .map((item) => {
        const result: any = {
          date: formatDate(item.date),
          dateObj: item.date,
        };

        absoluteMetrics.forEach((metric) => {
          result[metric.name] = item[metric.key] || 0;
        });

        return result;
      })
      .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
  };

  // Get lean mass comparison data for line charts
  const getLeanMassComparisonData = () => {
    return data
      .map((item) => {
        const result: any = {
          date: formatDate(item.date),
          dateObj: item.date,
        };

        leanMassMetrics.forEach((metric) => {
          result[metric.name] = item[metric.key] || 0;
        });

        return result;
      })
      .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
  };

  // Get current scan data for radar chart
  const getScanDataForRadar = (scan: DexaScan | undefined) => {
    if (!scan) return [];

    // For percentage data
    if (activeTab === "percentage") {
      return percentageMetrics.map((metric) => ({
        subject: metric.name,
        value: scan[metric.key] * 100 || 0,
        fullMark: 40, // Typical max for body fat percentage in most regions
      }));
    }

    // For absolute data
    if (activeTab === "absolute") {
      return [...absoluteMetrics, ...leanMassMetrics].map((metric) => ({
        subject: metric.name,
        value: scan[metric.key] || 0,
        fullMark: Math.max(...data.map((s) => s[metric.key] || 0)) * 1.2, // Scale based on max values
      }));
    }

    return [];
  };

  // Get comparison data for radar
  const getComparisonRadarData = () => {
    if (!primaryScan || !comparisonScan) return [];

    const primaryLabel = format(new Date(primaryScan.date), "MMM d, yyyy");
    const comparisonLabel = format(
      new Date(comparisonScan.date),
      "MMM d, yyyy"
    );

    // For percentage data
    if (activeTab === "percentage") {
      return percentageMetrics.map((metric) => ({
        subject: metric.name,
        [primaryLabel]: primaryScan[metric.key] * 100 || 0,
        [comparisonLabel]: comparisonScan[metric.key] * 100 || 0,
      }));
    }

    // For absolute data
    if (activeTab === "absolute") {
      return [...absoluteMetrics, ...leanMassMetrics].map((metric) => ({
        subject: metric.name,
        [primaryLabel]: primaryScan[metric.key] || 0,
        [comparisonLabel]: comparisonScan[metric.key] || 0,
      }));
    }

    return [];
  };

  // Get data for bar chart comparison
  const getBarChartComparisonData = () => {
    if (!primaryScan || !comparisonScan) return [];

    // For percentage data
    if (activeTab === "percentage") {
      return percentageMetrics.map((metric) => ({
        name: metric.name,
        Primary: primaryScan[metric.key] * 100 || 0,
        Comparison: comparisonScan[metric.key] * 100 || 0,
      }));
    }

    // For absolute data
    if (activeTab === "absolute") {
      const metrics = [...absoluteMetrics, ...leanMassMetrics];
      return metrics.map((metric) => ({
        name: metric.name,
        Primary: primaryScan[metric.key] || 0,
        Comparison: comparisonScan[metric.key] || 0,
      }));
    }

    return [];
  };

  // Convert percentage metrics to line configs
  const getPercentageLineConfigs = () => {
    return percentageMetrics.map((metric, index) => ({
      dataKey: metric.name,
      name: metric.name,
      stroke: COLORS[index % COLORS.length],
      unit: "%",
    }));
  };

  // Convert absolute metrics to line configs
  const getAbsoluteLineConfigs = () => {
    return absoluteMetrics.map((metric, index) => ({
      dataKey: metric.name,
      name: metric.name,
      stroke: COLORS[index % COLORS.length],
      unit: " lbs",
    }));
  };

  // Convert lean mass metrics to line configs
  const getLeanMassLineConfigs = () => {
    return leanMassMetrics.map((metric, index) => ({
      dataKey: metric.name,
      name: metric.name,
      stroke: COLORS[(index + 5) % COLORS.length], // Use different colors
      unit: " lbs",
    }));
  };

  // Custom tooltip formatter based on data type
  const tooltipFormatter = (value: any, name: string) => {
    const displayValue = Number(value).toFixed(2);
    if (activeTab === "percentage" || name.includes("%")) {
      return `${displayValue}%`;
    }
    return `${displayValue} lbs`;
  };

  // Get the list of radar configs for comparison
  const getRadarComparisonConfigs = () => {
    if (!primaryScan || !comparisonScan) return [];

    const primaryLabel = format(new Date(primaryScan.date), "MMM d, yyyy");
    const comparisonLabel = format(
      new Date(comparisonScan.date),
      "MMM d, yyyy"
    );

    return [
      {
        dataKey: primaryLabel,
        name: primaryLabel,
        fill: "#8884d8",
        stroke: "#8884d8",
        fillOpacity: 0.6,
      },
      {
        dataKey: comparisonLabel,
        name: comparisonLabel,
        fill: "#82ca9d",
        stroke: "#82ca9d",
        fillOpacity: 0.6,
      },
    ];
  };

  // Get current scan bars
  const getCurrentScanBars = () => {
    return [
      {
        dataKey: "value",
        name: activeTab === "percentage" ? "Fat %" : "Mass",
        fill: activeTab === "percentage" ? "#8884d8" : "#82ca9d",
      },
    ];
  };

  // Get comparison bars
  const getComparisonBars = () => {
    return [
      {
        dataKey: "Primary",
        name: "Primary",
        fill: "#8884d8",
      },
      {
        dataKey: "Comparison",
        name: "Comparison",
        fill: "#82ca9d",
      },
    ];
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full md:w-[400px] grid-cols-2">
          <TabsTrigger value="percentage">Fat Percentage</TabsTrigger>
          <TabsTrigger value="absolute">Mass Distribution</TabsTrigger>
        </TabsList>

        <TabsContent value="percentage" className="mt-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Regional Fat % Comparison Over Time */}
            <LineChart
              data={getPercentageComparisonData()}
              lines={getPercentageLineConfigs()}
              xAxisKey="date"
              yAxisUnit="%"
              title="Regional Fat Percentage Comparison"
              height={400}
              tooltipFormatter={tooltipFormatter}
              className="md:col-span-2"
            />

            {/* Comparison selector for distribution charts */}
            <div className="md:col-span-2">
              <ComparisonSelector
                data={data}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                selectedDate={primaryDate}
                comparisonDate={comparisonDate}
                onSelectedDateChange={setPrimaryDate}
                onComparisonDateChange={setComparisonDate}
              />
            </div>

            {viewMode === "single" ? (
              <>
                {/* Current Scan Regional Distribution - Single Mode */}
                <RadarChart
                  data={getScanDataForRadar(primaryScan)}
                  radars={[
                    {
                      dataKey: "value",
                      name: "Fat %",
                      fill: "#8884d8",
                      stroke: "#8884d8",
                      fillOpacity: 0.6,
                    },
                  ]}
                  title="Current Distribution"
                  height={300}
                  outerRadius={90}
                  tooltipFormatter={(value) => `${Number(value).toFixed(2)}%`}
                />

                {/* Current Scan Bar Chart - Single Mode */}
                <BarChart
                  data={getScanDataForRadar(primaryScan)}
                  bars={getCurrentScanBars()}
                  xAxisKey="subject"
                  yAxisUnit="%"
                  title="Region Comparison"
                  height={300}
                  tooltipFormatter={(value) => `${Number(value).toFixed(2)}%`}
                />
              </>
            ) : (
              <>
                {/* Current Scan Regional Distribution - Comparison Mode */}
                <RadarChart
                  data={getComparisonRadarData()}
                  radars={getRadarComparisonConfigs()}
                  title="Distribution Comparison"
                  height={300}
                  outerRadius={90}
                  tooltipFormatter={(value) => `${Number(value).toFixed(2)}%`}
                />

                {/* Current Scan Bar Chart - Comparison Mode */}
                <BarChart
                  data={getBarChartComparisonData()}
                  bars={getComparisonBars()}
                  xAxisKey="name"
                  yAxisUnit="%"
                  title="Region Comparison"
                  height={300}
                  tooltipFormatter={(value) => `${Number(value).toFixed(2)}%`}
                />
              </>
            )}
          </div>
        </TabsContent>

        <TabsContent value="absolute" className="mt-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Regional Fat Mass Comparison Over Time */}
            <LineChart
              data={getAbsoluteComparisonData()}
              lines={getAbsoluteLineConfigs()}
              xAxisKey="date"
              yAxisUnit=" lbs"
              title="Fat Tissue Distribution (lbs)"
              height={400}
              tooltipFormatter={tooltipFormatter}
              className="md:col-span-2"
            />

            {/* Regional Lean Mass Comparison Over Time */}
            <LineChart
              data={getLeanMassComparisonData()}
              lines={getLeanMassLineConfigs()}
              xAxisKey="date"
              yAxisUnit=" lbs"
              title="Lean Tissue Distribution (lbs)"
              height={400}
              tooltipFormatter={tooltipFormatter}
              className="md:col-span-2"
            />

            {/* Comparison selector for distribution charts */}
            <div className="md:col-span-2">
              <ComparisonSelector
                data={data}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                selectedDate={primaryDate}
                comparisonDate={comparisonDate}
                onSelectedDateChange={setPrimaryDate}
                onComparisonDateChange={setComparisonDate}
              />
            </div>

            {viewMode === "single" ? (
              /* Single scan view */
              <BarChart
                data={getScanDataForRadar(primaryScan)}
                bars={getCurrentScanBars()}
                xAxisKey="subject"
                yAxisUnit=" lbs"
                title="Current Distribution (lbs)"
                height={300}
                tooltipFormatter={(value) => `${Number(value).toFixed(2)} lbs`}
                className="md:col-span-2"
              />
            ) : (
              /* Comparison view */
              <BarChart
                data={getBarChartComparisonData()}
                bars={getComparisonBars()}
                xAxisKey="name"
                yAxisUnit=" lbs"
                title="Distribution Comparison (lbs)"
                height={300}
                tooltipFormatter={(value) => `${Number(value).toFixed(2)} lbs`}
                className="md:col-span-2"
              />
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RegionalAnalysisTab;
