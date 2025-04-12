// src/features/dexa/visualization/body-composition-tab.tsx
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ComparisonSelector } from "./comparison-selector";
import { format } from "date-fns";
import { ViewMode } from "../dexa";
import CustomPieChart from "@/components/charts/pie-chart";
import CustomBarChart from "@/components/charts/bar-chart";
import CustomRadarChart from "@/components/charts/radar-chart";
import { DEXAScan } from "@/store/dexa-definitions";

// Mapping percentage values to different semantic colors
const getColorForPercentage = (value: number) => {
  if (value < 10) return "#82ca9d"; // Lean - Green
  if (value < 20) return "#8884d8"; // Athletic - Purple
  if (value < 25) return "#ffc658"; // Fitness - Yellow
  if (value < 30) return "#ff8042"; // Average - Orange
  return "#d32f2f"; // Higher body fat - Red
};

const BodyCompositionTab = ({ data }: { data: DEXAScan[] }) => {
  const [viewMode, setViewMode] = useState<ViewMode>("single");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [comparisonDate, setComparisonDate] = useState<string>("");

  // Find selected scans
  const selectedScan = data.find((scan) => scan.id === selectedDate);
  const comparisonScan = data.find((scan) => scan.id === comparisonDate);

  // Generate the body composition data for the pie chart
  const getBodyCompData = (scan: DEXAScan | undefined) => {
    if (!scan) return [];

    const fatMass = scan.fat_tissue_lbs || 0;
    const leanMass = scan.lean_tissue_lbs || 0;
    const boneMass = scan.bone_mineral_content
      ? scan.bone_mineral_content / 453.59237 // Convert grams to lbs
      : 0;

    const result = [
      { name: "Fat Mass", value: fatMass },
      { name: "Lean Mass", value: leanMass },
      { name: "Bone Mass", value: boneMass },
    ];

    // Check if we have any non-zero values
    const hasValidData = result.some((item) => item.value > 0);

    // If all values are zero, add some minimal value to make the chart visible
    if (!hasValidData) {
      return [
        { name: "Fat Mass", value: 1 },
        { name: "Lean Mass", value: 1 },
        { name: "Bone Mass", value: 1 },
      ];
    }

    return result;
  };

  // Create data for the body fat distribution comparison
  const getBodyFatDistributionData = (scan: DEXAScan | undefined) => {
    if (!scan) return [];

    const compareMetrics = [
      {
        key: "arms_total_region_fat_percentage",
        name: "Arms",
        multiplier: 100,
      },
      {
        key: "legs_total_region_fat_percentage",
        name: "Legs",
        multiplier: 100,
      },
      {
        key: "trunk_total_region_fat_percentage",
        name: "Trunk",
        multiplier: 100,
      },
      {
        key: "android_total_region_fat_percentage",
        name: "Android",
        multiplier: 100,
      },
      {
        key: "gynoid_total_region_fat_percentage",
        name: "Gynoid",
        multiplier: 100,
      },
    ];

    return compareMetrics.map((metric) => {
      const value = scan[metric.key as keyof DEXAScan] as number;
      return {
        name: metric.name,
        value: value * 100 || 0,
        fill: getColorForPercentage(value * 100 || 0),
      };
    });
  };

  // Generate data for comparison view
  const getComparisonData = () => {
    if (!selectedScan || !comparisonScan) return [];

    const primaryDate = format(new Date(selectedScan.date), "MMM d, yyyy");
    const secondaryDate = format(new Date(comparisonScan.date), "MMM d, yyyy");

    const compareMetrics = [
      {
        key: "total_body_fat_percentage",
        name: "Body Fat %",
        multiplier: 100,
        unit: "%",
      },
      { key: "fat_tissue_lbs", name: "Fat Mass (lbs)", unit: "lbs" },
      { key: "lean_tissue_lbs", name: "Lean Mass (lbs)", unit: "lbs" },
      { key: "total_mass_lbs", name: "Total Mass (lbs)", unit: "lbs" },
      { key: "vat_mass_lbs", name: "VAT Mass (lbs)", unit: "lbs" },
    ];

    return compareMetrics.map((metric) => {
      const selectedScanValue = selectedScan[
        metric.key as keyof DEXAScan
      ] as number;
      const comparisonScanValue = comparisonScan[
        metric.key as keyof DEXAScan
      ] as number;
      return {
        name: metric.name,
        [primaryDate]: metric.multiplier
          ? selectedScanValue * metric.multiplier
          : selectedScanValue || 0,
        [secondaryDate]: metric.multiplier
          ? comparisonScanValue * metric.multiplier
          : comparisonScanValue || 0,
        unit: metric.unit,
      };
    });
  };

  // Generate radar chart data for body fat distribution comparison
  const getRadarComparisonData = () => {
    if (!selectedScan || !comparisonScan) return [];

    const primaryDate = format(new Date(selectedScan.date), "MMM d, yyyy");
    const secondaryDate = format(new Date(comparisonScan.date), "MMM d, yyyy");

    const metrics = [
      {
        key: "arms_total_region_fat_percentage",
        name: "Arms",
        multiplier: 100,
        unit: "%",
      },
      {
        key: "legs_total_region_fat_percentage",
        name: "Legs",
        multiplier: 100,
        unit: "%",
      },
      {
        key: "trunk_total_region_fat_percentage",
        name: "Trunk",
        multiplier: 100,
        unit: "%",
      },
      {
        key: "android_total_region_fat_percentage",
        name: "Android",
        multiplier: 100,
        unit: "%",
      },
      {
        key: "gynoid_total_region_fat_percentage",
        name: "Gynoid",
        multiplier: 100,
        unit: "%",
      },
    ];

    return metrics.map((metric) => {
      const selectedScanValue = selectedScan[
        metric.key as keyof DEXAScan
      ] as number;
      const comparisonScanValue = comparisonScan[
        metric.key as keyof DEXAScan
      ] as number;
      return {
        subject: metric.name,
        [primaryDate]: metric.multiplier
          ? selectedScanValue * metric.multiplier
          : selectedScanValue || 0,
        [secondaryDate]: metric.multiplier
          ? comparisonScanValue * metric.multiplier
          : comparisonScanValue || 0,
        fullMark:
          Math.max(selectedScanValue || 0, comparisonScanValue || 0) * 1.2, // To leave some space at the edge
        unit: metric.unit,
      };
    });
  };

  // Custom tooltip formatter for charts
  const tooltipFormatter = (value: any, name: string, props: any) => {
    let displayValue = value?.toFixed(2) || 0;

    // Special handling for body fat percentage
    if (name.includes("Fat") && name.includes("%")) {
      // If the value is stored as decimal (less than 1), convert to percentage
      if (value < 1 && value > 0) {
        displayValue = (value * 100).toFixed(1);
      }
    }

    return `${displayValue} ${props.unit || ""}`;
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
        // Single view
        <div className="space-y-6">
          {/* Key Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Key Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg bg-muted">
                  <p className="text-sm text-muted-foreground">Body Fat %</p>
                  <p className="text-2xl font-bold">
                    {selectedScan
                      ? (selectedScan.total_body_fat_percentage < 1
                          ? selectedScan.total_body_fat_percentage * 100
                          : selectedScan.total_body_fat_percentage
                        ).toFixed(1)
                      : "0"}
                    %
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-muted">
                  <p className="text-sm text-muted-foreground">Total Weight</p>
                  <p className="text-2xl font-bold">
                    {selectedScan?.total_mass_lbs?.toFixed(2) || "0"} lbs
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-muted">
                  <p className="text-sm text-muted-foreground">VAT Mass</p>
                  <p className="text-2xl font-bold">
                    {selectedScan?.vat_mass_lbs?.toFixed(2) || "0"} lbs
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-muted">
                  <p className="text-sm text-muted-foreground">RMR</p>
                  <p className="text-2xl font-bold">
                    {selectedScan?.resting_metabolic_rate?.toFixed(0) || "0"}{" "}
                    cal
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Current Body Composition */}
            <CustomPieChart
              data={getBodyCompData(selectedScan)}
              pieConfig={{
                dataKey: "value",
                nameKey: "name",
                outerRadius: 100,
                minAngle: 5,
                label: ({ name, percent }) =>
                  percent > 0 ? `${name}: ${(percent * 100).toFixed(1)}%` : "",
              }}
              title="Body Composition"
              valueUnit="lbs"
              tooltipFormatter={(value) => `${Number(value).toFixed(2)} lbs`}
            />

            {/* Body Fat Distribution */}
            <CustomBarChart
              data={getBodyFatDistributionData(selectedScan)}
              bars={[
                {
                  dataKey: "value",
                  name: "Body Fat %",
                  colorByValue: true,
                  getColorByValue: getColorForPercentage,
                },
              ]}
              xAxisKey="name"
              yAxisUnit="%"
              title="Body Fat Distribution"
              tooltipFormatter={(value) => `${Number(value).toFixed(2)}%`}
            />
          </div>
        </div>
      ) : (
        // Comparison view
        <div className="space-y-6">
          {/* Changes Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Changes Summary</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedScan && comparisonScan ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 rounded-lg bg-muted">
                    <p className="text-sm text-muted-foreground">
                      Body Fat % Change
                    </p>
                    <p
                      className={`text-2xl font-bold ${(selectedScan?.total_body_fat_percentage || 0) - (comparisonScan?.total_body_fat_percentage || 0) < 0 ? "text-green-500" : "text-red-500"}`}
                    >
                      {(
                        (selectedScan?.total_body_fat_percentage || 0) -
                        (comparisonScan?.total_body_fat_percentage || 0)
                      ).toFixed(2)}
                      %
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted">
                    <p className="text-sm text-muted-foreground">
                      Weight Change
                    </p>
                    <p
                      className={`text-2xl font-bold ${(selectedScan?.total_mass_lbs || 0) - (comparisonScan?.total_mass_lbs || 0) < 0 ? "text-red-500" : "text-green-500"}`}
                    >
                      {(
                        (selectedScan?.total_mass_lbs || 0) -
                        (comparisonScan?.total_mass_lbs || 0)
                      ).toFixed(2)}{" "}
                      lbs
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted">
                    <p className="text-sm text-muted-foreground">
                      Lean Mass Change
                    </p>
                    <p
                      className={`text-2xl font-bold ${(selectedScan?.lean_tissue_lbs || 0) - (comparisonScan?.lean_tissue_lbs || 0) > 0 ? "text-green-500" : "text-red-500"}`}
                    >
                      {(
                        (selectedScan?.lean_tissue_lbs || 0) -
                        (comparisonScan?.lean_tissue_lbs || 0)
                      ).toFixed(2)}{" "}
                      lbs
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted">
                    <p className="text-sm text-muted-foreground">
                      Fat Mass Change
                    </p>
                    <p
                      className={`text-2xl font-bold ${(selectedScan?.fat_tissue_lbs || 0) - (comparisonScan?.fat_tissue_lbs || 0) < 0 ? "text-green-500" : "text-red-500"}`}
                    >
                      {(
                        (selectedScan?.fat_tissue_lbs || 0) -
                        (comparisonScan?.fat_tissue_lbs || 0)
                      ).toFixed(2)}{" "}
                      lbs
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-center text-muted-foreground">
                  Select two dates to compare changes
                </p>
              )}
            </CardContent>
          </Card>

          {/* Body Composition Comparison */}
          <CustomBarChart
            data={getComparisonData()}
            bars={[
              {
                dataKey: selectedScan
                  ? format(new Date(selectedScan.date), "MMM d, yyyy")
                  : "",
                name: "Primary",
                color: "#8884d8",
              },
              {
                dataKey: comparisonScan
                  ? format(new Date(comparisonScan.date), "MMM d, yyyy")
                  : "",
                name: "Comparison",
                color: "#82ca9d",
              },
            ]}
            xAxisKey="name"
            layout="vertical"
            title="Body Composition Comparison"
            height={400}
            tooltipFormatter={tooltipFormatter}
          />

          {/* Body Fat Distribution Comparison */}
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
            title="Body Fat Distribution Comparison"
            height={400}
            outerRadius={150}
            tooltipFormatter={tooltipFormatter}
          />
        </div>
      )}
    </div>
  );
};

export default BodyCompositionTab;
