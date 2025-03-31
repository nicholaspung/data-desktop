// src/features/dexa/visualization/body-composition-tab.tsx
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PieChart,
  Pie,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import { DexaScan } from "../dexa-visualization";
import { ComparisonSelector, ViewMode } from "./comparison-selector";
import { format } from "date-fns";
import { COLORS } from "@/lib/date-utils";

// Mapping percentage values to different semantic colors
const getColorForPercentage = (value: number) => {
  if (value < 10) return "#82ca9d"; // Lean - Green
  if (value < 20) return "#8884d8"; // Athletic - Purple
  if (value < 25) return "#ffc658"; // Fitness - Yellow
  if (value < 30) return "#ff8042"; // Average - Orange
  return "#d32f2f"; // Higher body fat - Red
};

const BodyCompositionTab = ({ data }: { data: DexaScan[] }) => {
  const [viewMode, setViewMode] = useState<ViewMode>("single");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [comparisonDate, setComparisonDate] = useState<string>("");

  // Find selected scans
  const selectedScan = data.find((scan) => scan.id === selectedDate);
  const comparisonScan = data.find((scan) => scan.id === comparisonDate);

  // Custom tooltip formatter
  const renderTooltip = (props: any) => {
    const { active, payload, label } = props;
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border p-2 rounded shadow-sm">
          <p className="font-bold">{label}</p>
          {payload.map((entry: any, index: number) => {
            let displayValue = entry.value?.toFixed(2) || 0;

            // Special handling for body fat percentage
            if (entry.name.includes("Fat") && entry.name.includes("%")) {
              // If the value is stored as decimal (less than 1), convert to percentage
              if (entry.value < 1 && entry.value > 0) {
                displayValue = (entry.value * 100).toFixed(1);
              }
            }

            return (
              <p key={`item-${index}`} style={{ color: entry.color }}>
                {entry.name}: {displayValue} {entry.payload.unit || ""}
              </p>
            );
          })}
        </div>
      );
    }
    return null;
  };

  // Generate the body composition data for the pie chart
  const getBodyCompData = (scan: DexaScan | undefined) => {
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
  const getBodyFatDistributionData = (scan: DexaScan | undefined) => {
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

    return compareMetrics.map((metric) => ({
      name: metric.name,
      value: metric.multiplier ? scan[metric.key] * 100 : scan[metric.key] || 0,
      fill: getColorForPercentage(scan[metric.key] || 0),
    }));
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

    return compareMetrics.map((metric) => ({
      name: metric.name,
      [primaryDate]: metric.multiplier
        ? selectedScan[metric.key] * metric.multiplier
        : selectedScan[metric.key] || 0,
      [secondaryDate]: metric.multiplier
        ? comparisonScan[metric.key] * metric.multiplier
        : comparisonScan[metric.key] || 0,
      unit: metric.unit,
    }));
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

    return metrics.map((metric) => ({
      subject: metric.name,
      [primaryDate]: metric.multiplier
        ? selectedScan[metric.key] * metric.multiplier
        : selectedScan[metric.key] || 0,
      [secondaryDate]: metric.multiplier
        ? comparisonScan[metric.key] * metric.multiplier
        : comparisonScan[metric.key] || 0,
      fullMark:
        Math.max(
          selectedScan[metric.key] || 0,
          comparisonScan[metric.key] || 0
        ) * 1.2, // To leave some space at the edge
      unit: metric.unit,
    }));
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
          <div className="grid gap-6 md:grid-cols-2">
            {/* Current Body Composition */}
            <Card>
              <CardHeader>
                <CardTitle>Body Composition</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      {selectedScan ? (
                        <>
                          <Pie
                            data={getBodyCompData(selectedScan)}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) =>
                              percent > 0
                                ? `${name}: ${(percent * 100).toFixed(1)}%`
                                : ""
                            }
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                            minAngle={5}
                          >
                            {getBodyCompData(selectedScan).map((_, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={COLORS[index % COLORS.length]}
                              />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value) =>
                              `${Number(value).toFixed(2)} lbs`
                            }
                          />
                          <Legend />
                        </>
                      ) : (
                        <text
                          x="50%"
                          y="50%"
                          textAnchor="middle"
                          dominantBaseline="middle"
                        >
                          No data available
                        </text>
                      )}
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Body Fat Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Body Fat Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={getBodyFatDistributionData(selectedScan)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis unit="%" />
                      <Tooltip
                        formatter={(value) => `${Number(value).toFixed(2)}%`}
                      />
                      <Bar
                        dataKey="value"
                        name="Body Fat %"
                        radius={[4, 4, 0, 0]}
                      >
                        {getBodyFatDistributionData(selectedScan).map(
                          (entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          )
                        )}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

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
        </div>
      ) : (
        // Comparison view
        <div className="space-y-6">
          {/* Body Composition Comparison */}
          <Card>
            <CardHeader>
              <CardTitle>Body Composition Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={getComparisonData()}
                    layout="vertical"
                    margin={{ top: 20, right: 30, left: 40, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={100} />
                    <Tooltip content={renderTooltip} />
                    <Legend />
                    {selectedScan && comparisonScan && (
                      <>
                        <Bar
                          dataKey={format(
                            new Date(selectedScan.date),
                            "MMM d, yyyy"
                          )}
                          fill="#8884d8"
                          name="Primary"
                        />
                        <Bar
                          dataKey={format(
                            new Date(comparisonScan.date),
                            "MMM d, yyyy"
                          )}
                          fill="#82ca9d"
                          name="Comparison"
                        />
                      </>
                    )}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Body Fat Distribution Comparison */}
          <Card>
            <CardHeader>
              <CardTitle>Body Fat Distribution Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart outerRadius={150} data={getRadarComparisonData()}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" />
                    <PolarRadiusAxis angle={30} domain={[0, "auto"]} />
                    {selectedScan && comparisonScan && (
                      <>
                        <Radar
                          name={format(
                            new Date(selectedScan.date),
                            "MMM d, yyyy"
                          )}
                          dataKey={format(
                            new Date(selectedScan.date),
                            "MMM d, yyyy"
                          )}
                          stroke="#8884d8"
                          fill="#8884d8"
                          fillOpacity={0.6}
                        />
                        <Radar
                          name={format(
                            new Date(comparisonScan.date),
                            "MMM d, yyyy"
                          )}
                          dataKey={format(
                            new Date(comparisonScan.date),
                            "MMM d, yyyy"
                          )}
                          stroke="#82ca9d"
                          fill="#82ca9d"
                          fillOpacity={0.6}
                        />
                      </>
                    )}
                    <Legend />
                    <Tooltip content={renderTooltip} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

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
        </div>
      )}
    </div>
  );
};

export default BodyCompositionTab;
