import { useState } from "react";
import { ComparisonSelector } from "./comparison-selector";
import { format } from "date-fns";
import { ViewMode } from "../dexa";
import CustomBarChart from "@/components/charts/bar-chart";
import CustomLineChart from "@/components/charts/line-chart";
import CustomRadarChart from "@/components/charts/radar-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DEXAScan } from "@/store/dexa-definitions";
import { formatDate } from "@/lib/date-utils";

const BoneDensityTab = ({ data }: { data: DEXAScan[] }) => {
  const [viewMode, setViewMode] = useState<ViewMode>("single");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [comparisonDate, setComparisonDate] = useState<string>("");

  const selectedScan = data.find((scan) => scan.id === selectedDate);
  const comparisonScan = data.find((scan) => scan.id === comparisonDate);

  const boneDensityMetrics = [
    { key: "bone_density_g_cm2_head", name: "Head" },
    { key: "bone_density_g_cm2_arms", name: "Arms" },
    { key: "bone_density_g_cm2_legs", name: "Legs" },
    { key: "bone_density_g_cm2_trunk", name: "Trunk" },
    { key: "bone_density_g_cm2_ribs", name: "Ribs" },
    { key: "bone_density_g_cm2_spine", name: "Spine" },
    { key: "bone_density_g_cm2_pelvis", name: "Pelvis" },
    { key: "bone_density_g_cm2_total", name: "Total" },
  ];

  const calculateTScoreEstimate = (bmd: number | undefined) => {
    if (!bmd) return 0;

    const youngAdultMean = 1.2;
    const standardDeviation = 0.1;

    return (bmd - youngAdultMean) / standardDeviation;
  };

  const getBoneDensityData = (scan: DEXAScan | undefined) => {
    if (!scan) return [];

    return boneDensityMetrics.map((metric) => {
      const value = scan[metric.key as keyof DEXAScan] as number;
      const tScore = calculateTScoreEstimate(value);

      let color = "#82ca9d";
      if (tScore < -1.0 && tScore >= -2.5) {
        color = "#ffc658";
      } else if (tScore < -2.5) {
        color = "#ff8042";
      }

      return {
        region: metric.name,
        "BMD (g/cm²)": value || 0,
        "T-Score": tScore,
        color,
      };
    });
  };

  const getBoneDensityTrendData = () => {
    return data
      .map((item) => {
        const result: any = {
          date: formatDate(item.date),
          dateObj: item.date,
        };

        boneDensityMetrics.forEach((metric) => {
          result[metric.name] =
            (item[metric.key as keyof DEXAScan] as number) || 0;
        });

        return result;
      })
      .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
  };

  const getTotalBMDTrendData = () => {
    return data
      .map((item) => ({
        date: formatDate(item.date),
        "Total BMD": item.bone_density_g_cm2_total || 0,
        dateObj: item.date,
      }))
      .sort(
        (a, b) =>
          a.dateObj && b.dateObj && a.dateObj.getTime() - b.dateObj.getTime()
      );
  };

  const getRadarComparisonData = () => {
    if (!selectedScan || !comparisonScan) return [];

    const primaryDate = format(new Date(selectedScan.date), "MMM d, yyyy");
    const secondaryDate = format(new Date(comparisonScan.date), "MMM d, yyyy");

    return boneDensityMetrics.map((metric) => ({
      subject: metric.name,
      [primaryDate]:
        (selectedScan[metric.key as keyof DEXAScan] as number) || 0,
      [secondaryDate]:
        (comparisonScan[metric.key as keyof DEXAScan] as number) || 0,
    }));
  };

  const getBoneDensityLineConfigs = () => {
    return boneDensityMetrics.map((metric, index) => ({
      dataKey: metric.name,
      name: metric.name,
      stroke: getColorByIndex(index),
      unit: " g/cm²",
    }));
  };

  const getColorByIndex = (index: number) => {
    const colors = [
      "#8884d8",
      "#82ca9d",
      "#ffc658",
      "#ff8042",
      "#0088FE",
      "#00C49F",
      "#FFBB28",
      "#FF8042",
    ];
    return colors[index % colors.length];
  };

  const getBarColor = (value: number) => {
    const densityData = getBoneDensityData(selectedScan);
    const item = densityData.find((d) => d["BMD (g/cm²)"] === value);
    return item ? item.color : "#8884d8";
  };

  const getTScoreColor = (value: number) => {
    if (value < -2.5) return "#ff8042";
    if (value < -1.0) return "#ffc658";
    return "#82ca9d";
  };

  return (
    <div className="space-y-6">
      <ComparisonSelector
        data={data}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        selectedDate={selectedDate}
        comparisonDate={comparisonDate}
        onSelectedDateChange={setSelectedDate}
        onComparisonDateChange={setComparisonDate}
      />

      {viewMode === "single" ? (
        <div className="space-y-6">
          {/* Total BMD trend over time */}
          <CustomLineChart
            data={getTotalBMDTrendData()}
            lines={[
              {
                dataKey: "Total BMD",
                name: "Total BMD",
                color: "#8884d8",
                unit: " g/cm²",
                strokeWidth: 2,
                activeDot: { r: 8 },
              },
            ]}
            xAxisKey="date"
            yAxisUnit=" g/cm²"
            title="Total Bone Mineral Density Trend"
            height={350}
          />

          {/* Current scan bone density by region */}
          {selectedScan && (
            <div className="grid gap-6 md:grid-cols-2">
              <CustomBarChart
                data={getBoneDensityData(selectedScan)}
                bars={[
                  {
                    dataKey: "BMD (g/cm²)",
                    name: "BMD",
                    colorByValue: true,
                    getColorByValue: getBarColor,
                  },
                ]}
                xAxisKey="region"
                yAxisUnit=" g/cm²"
                title="Bone Mineral Density by Region"
                height={350}
              />

              <CustomBarChart
                data={getBoneDensityData(selectedScan)}
                bars={[
                  {
                    dataKey: "T-Score",
                    name: "T-Score (Estimate)",
                    colorByValue: true,
                    getColorByValue: getTScoreColor,
                  },
                ]}
                xAxisKey="region"
                title="Estimated T-Score by Region"
                height={350}
              />
            </div>
          )}

          {/* BMD Status Key */}
          <Card>
            <CardHeader>
              <CardTitle>Bone Health Reference</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 rounded-full bg-[#82ca9d]"></div>
                  <span>Normal (T-score ≥ -1.0)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 rounded-full bg-[#ffc658]"></div>
                  <span>Osteopenia (T-score between -1.0 and -2.5)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 rounded-full bg-[#ff8042]"></div>
                  <span>Osteoporosis (T-score ≤ -2.5)</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                Note: T-scores shown are estimates based on simplified
                calculations. Actual T-scores depend on reference population
                data and may differ.
              </p>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Bone Density Radar Comparison */}
          <CustomRadarChart
            data={getRadarComparisonData()}
            radars={[
              {
                dataKey: selectedScan
                  ? format(new Date(selectedScan.date), "MMM d, yyyy")
                  : "",
                name: selectedScan
                  ? format(new Date(selectedScan.date), "MMM d, yyyy")
                  : "",
                fill: "#8884d8",
                stroke: "#8884d8",
                fillOpacity: 0.6,
              },
              {
                dataKey: comparisonScan
                  ? format(new Date(comparisonScan.date), "MMM d, yyyy")
                  : "",
                name: comparisonScan
                  ? format(new Date(comparisonScan.date), "MMM d, yyyy")
                  : "",
                fill: "#82ca9d",
                stroke: "#82ca9d",
                fillOpacity: 0.6,
              },
            ]}
            title="Bone Density Comparison by Region"
            height={400}
            tooltipFormatter={(value) => `${Number(value).toFixed(3)} g/cm²`}
          />

          {/* All Bone Density Metrics Trend */}
          <CustomLineChart
            data={getBoneDensityTrendData()}
            lines={getBoneDensityLineConfigs()}
            xAxisKey="date"
            yAxisUnit=" g/cm²"
            title="Bone Density Trends by Region"
            height={400}
          />

          {/* Changes Summary */}
          {selectedScan && comparisonScan && (
            <Card>
              <CardHeader>
                <CardTitle>Bone Density Changes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {boneDensityMetrics.map((metric) => {
                    const currentValue = selectedScan[
                      metric.key as keyof DEXAScan
                    ] as number;
                    const previousValue = comparisonScan[
                      metric.key as keyof DEXAScan
                    ] as number;
                    const change =
                      currentValue && previousValue
                        ? currentValue - previousValue
                        : null;
                    const percentChange =
                      change && previousValue
                        ? (change / previousValue) * 100
                        : null;

                    return (
                      <div key={metric.key} className="p-4 rounded-lg bg-muted">
                        <p className="text-sm text-muted-foreground">
                          {metric.name} BMD
                        </p>
                        <p
                          className={`text-xl font-bold ${change && change > 0 ? "text-green-500" : change && change < 0 ? "text-red-500" : ""}`}
                        >
                          {change !== null
                            ? `${change > 0 ? "+" : ""}${change.toFixed(3)} g/cm²`
                            : "N/A"}
                        </p>
                        {percentChange !== null && (
                          <p
                            className={`text-sm ${percentChange > 0 ? "text-green-500" : percentChange < 0 ? "text-red-500" : ""}`}
                          >
                            {percentChange > 0 ? "+" : ""}
                            {percentChange.toFixed(1)}%
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default BoneDensityTab;
