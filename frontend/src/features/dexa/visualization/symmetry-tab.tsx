// src/features/dexa/visualization/symmetry-tab.tsx
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts";
import { DexaScan } from "../dexa-visualization";
import { ComparisonSelector, ViewMode } from "./comparison-selector";
import { format } from "date-fns";

const SymmetryTab = ({ data }: { data: DexaScan[] }) => {
  const [viewMode, setViewMode] = useState<ViewMode>("single");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [comparisonDate, setComparisonDate] = useState<string>("");

  // Find selected scans
  const selectedScan = data.find((scan) => scan.id === selectedDate);
  const comparisonScan = data.find((scan) => scan.id === comparisonDate);

  // Get limb symmetry data (right vs left comparison) for a single scan
  const getLimbSymmetryData = (scan: DexaScan | undefined) => {
    if (!scan) return [];

    return [
      {
        category: "Arms Fat %",
        Right: scan.right_arm_total_region_fat_percentage * 100 || 0,
        Left: scan.left_arm_total_region_fat_percentage * 100 || 0,
        difference: Math.abs(
          (scan.right_arm_total_region_fat_percentage * 100 || 0) -
            (scan.left_arm_total_region_fat_percentage * 100 || 0)
        ).toFixed(2),
      },
      {
        category: "Arms Lean (lbs)",
        Right: scan.right_arm_lean_tissue_lbs || 0,
        Left: scan.left_arm_lean_tissue_lbs || 0,
        difference: Math.abs(
          (scan.right_arm_lean_tissue_lbs || 0) -
            (scan.left_arm_lean_tissue_lbs || 0)
        ).toFixed(2),
      },
      {
        category: "Legs Fat %",
        Right: scan.right_leg_total_region_fat_percentage * 100 || 0,
        Left: scan.left_leg_total_region_fat_percentage * 100 || 0,
        difference: Math.abs(
          (scan.right_leg_total_region_fat_percentage * 100 || 0) -
            (scan.left_leg_total_region_fat_percentage * 100 || 0)
        ).toFixed(2),
      },
      {
        category: "Legs Lean (lbs)",
        Right: scan.right_leg_lean_tissue_lbs || 0,
        Left: scan.left_leg_lean_tissue_lbs || 0,
        difference: Math.abs(
          (scan.right_leg_lean_tissue_lbs || 0) -
            (scan.left_leg_lean_tissue_lbs || 0)
        ).toFixed(2),
      },
    ];
  };

  // Calculate symmetry score (0-100) for a scan
  const calculateSymmetryScores = (scan: DexaScan | undefined) => {
    if (!scan) return [];

    const armsFatSymmetry =
      100 -
      Math.abs(
        (((scan.right_arm_total_region_fat_percentage || 0) -
          (scan.left_arm_total_region_fat_percentage || 0)) /
          ((scan.right_arm_total_region_fat_percentage || 0) +
            (scan.left_arm_total_region_fat_percentage || 0) || 1)) *
          200
      );

    const armsLeanSymmetry =
      100 -
      Math.abs(
        (((scan.right_arm_lean_tissue_lbs || 0) -
          (scan.left_arm_lean_tissue_lbs || 0)) /
          ((scan.right_arm_lean_tissue_lbs || 0) +
            (scan.left_arm_lean_tissue_lbs || 0) || 1)) *
          200
      );

    const legsFatSymmetry =
      100 -
      Math.abs(
        (((scan.right_leg_total_region_fat_percentage || 0) -
          (scan.left_leg_total_region_fat_percentage || 0)) /
          ((scan.right_leg_total_region_fat_percentage || 0) +
            (scan.left_leg_total_region_fat_percentage || 0) || 1)) *
          200
      );

    const legsLeanSymmetry =
      100 -
      Math.abs(
        (((scan.right_leg_lean_tissue_lbs || 0) -
          (scan.left_leg_lean_tissue_lbs || 0)) /
          ((scan.right_leg_lean_tissue_lbs || 0) +
            (scan.left_leg_lean_tissue_lbs || 0) || 1)) *
          200
      );

    // Average for overall symmetry
    const overallSymmetry =
      (armsFatSymmetry +
        armsLeanSymmetry +
        legsFatSymmetry +
        legsLeanSymmetry) /
      4;

    return [
      {
        name: "Arms Fat",
        value: armsFatSymmetry.toFixed(2),
        fill: armsFatSymmetry > 90 ? "#82ca9d" : "#ffc658",
      },
      {
        name: "Arms Lean",
        value: armsLeanSymmetry.toFixed(2),
        fill: armsLeanSymmetry > 90 ? "#82ca9d" : "#ffc658",
      },
      {
        name: "Legs Fat",
        value: legsFatSymmetry.toFixed(2),
        fill: legsFatSymmetry > 90 ? "#82ca9d" : "#ffc658",
      },
      {
        name: "Legs Lean",
        value: legsLeanSymmetry.toFixed(2),
        fill: legsLeanSymmetry > 90 ? "#82ca9d" : "#ffc658",
      },
      {
        name: "Overall",
        value: overallSymmetry.toFixed(2),
        fill: overallSymmetry > 90 ? "#82ca9d" : "#ffc658",
      },
    ];
  };

  // Generate data for radar comparison between two scans
  const getRadarComparisonData = () => {
    if (!selectedScan || !comparisonScan) return [];

    const primaryDate = format(new Date(selectedScan.date), "MMM d, yyyy");
    const secondaryDate = format(new Date(comparisonScan.date), "MMM d, yyyy");

    const metrics = [
      {
        subject: "Arms Fat Symmetry",
        [primaryDate]:
          100 -
          Math.abs(
            (((selectedScan.right_arm_total_region_fat_percentage || 0) -
              (selectedScan.left_arm_total_region_fat_percentage || 0)) /
              ((selectedScan.right_arm_total_region_fat_percentage || 0) +
                (selectedScan.left_arm_total_region_fat_percentage || 0) ||
                1)) *
              200
          ),
        [secondaryDate]:
          100 -
          Math.abs(
            (((comparisonScan.right_arm_total_region_fat_percentage || 0) -
              (comparisonScan.left_arm_total_region_fat_percentage || 0)) /
              ((comparisonScan.right_arm_total_region_fat_percentage || 0) +
                (comparisonScan.left_arm_total_region_fat_percentage || 0) ||
                1)) *
              200
          ),
      },
      {
        subject: "Arms Lean Symmetry",
        [primaryDate]:
          100 -
          Math.abs(
            (((selectedScan.right_arm_lean_tissue_lbs || 0) -
              (selectedScan.left_arm_lean_tissue_lbs || 0)) /
              ((selectedScan.right_arm_lean_tissue_lbs || 0) +
                (selectedScan.left_arm_lean_tissue_lbs || 0) || 1)) *
              200
          ),
        [secondaryDate]:
          100 -
          Math.abs(
            (((comparisonScan.right_arm_lean_tissue_lbs || 0) -
              (comparisonScan.left_arm_lean_tissue_lbs || 0)) /
              ((comparisonScan.right_arm_lean_tissue_lbs || 0) +
                (comparisonScan.left_arm_lean_tissue_lbs || 0) || 1)) *
              200
          ),
      },
      {
        subject: "Legs Fat Symmetry",
        [primaryDate]:
          100 -
          Math.abs(
            (((selectedScan.right_leg_total_region_fat_percentage || 0) -
              (selectedScan.left_leg_total_region_fat_percentage || 0)) /
              ((selectedScan.right_leg_total_region_fat_percentage || 0) +
                (selectedScan.left_leg_total_region_fat_percentage || 0) ||
                1)) *
              200
          ),
        [secondaryDate]:
          100 -
          Math.abs(
            (((comparisonScan.right_leg_total_region_fat_percentage || 0) -
              (comparisonScan.left_leg_total_region_fat_percentage || 0)) /
              ((comparisonScan.right_leg_total_region_fat_percentage || 0) +
                (comparisonScan.left_leg_total_region_fat_percentage || 0) ||
                1)) *
              200
          ),
      },
      {
        subject: "Legs Lean Symmetry",
        [primaryDate]:
          100 -
          Math.abs(
            (((selectedScan.right_leg_lean_tissue_lbs || 0) -
              (selectedScan.left_leg_lean_tissue_lbs || 0)) /
              ((selectedScan.right_leg_lean_tissue_lbs || 0) +
                (selectedScan.left_leg_lean_tissue_lbs || 0) || 1)) *
              200
          ),
        [secondaryDate]:
          100 -
          Math.abs(
            (((comparisonScan.right_leg_lean_tissue_lbs || 0) -
              (comparisonScan.left_leg_lean_tissue_lbs || 0)) /
              ((comparisonScan.right_leg_lean_tissue_lbs || 0) +
                (comparisonScan.left_leg_lean_tissue_lbs || 0) || 1)) *
              200
          ),
      },
    ];

    return metrics;
  };

  // Custom tooltip formatter
  const renderTooltip = (props: any) => {
    const { active, payload, label } = props;
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border p-2 rounded shadow-sm">
          <p className="font-bold">{label}</p>
          {payload.map((entry: any, index: number) => {
            let displayValue = entry.value?.toFixed(2) || 0;

            if (entry.payload.category.includes("%")) {
              displayValue = `${displayValue}%`;
            } else {
              displayValue = `${displayValue} lbs`;
            }
            return (
              <p key={`item-${index}`} style={{ color: entry.color }}>
                {entry.name}: {displayValue} {entry.unit || ""}
              </p>
            );
          })}
        </div>
      );
    }
    return null;
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
        <div className="grid gap-6 md:grid-cols-2">
          {/* Left vs Right Comparison */}
          <Card>
            <CardHeader>
              <CardTitle>Left vs Right Symmetry</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={getLimbSymmetryData(selectedScan)}
                    layout="vertical"
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="category" type="category" />
                    <Tooltip content={renderTooltip} />
                    <Legend />
                    <Bar dataKey="Right" fill="#8884d8" name="Right Side" />
                    <Bar dataKey="Left" fill="#82ca9d" name="Left Side" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Symmetry Scores */}
          <Card>
            <CardHeader>
              <CardTitle>Symmetry Scores</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={calculateSymmetryScores(selectedScan)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 100]} unit="%" />
                    <Tooltip
                      formatter={(value) => [
                        `${Number(value).toFixed(2)}%`,
                        "Symmetry Score",
                      ]}
                    />
                    <Bar dataKey="value" name="Symmetry Score">
                      {calculateSymmetryScores(selectedScan).map(
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
      ) : (
        // Comparison view
        <div className="space-y-6">
          {/* Symmetry Radar Comparison */}
          <Card>
            <CardHeader>
              <CardTitle>Symmetry Score Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart outerRadius={160} data={getRadarComparisonData()}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} />
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
                    <Tooltip
                      formatter={(value) => [
                        `${Number(value).toFixed(2)}%`,
                        "Symmetry Score",
                      ]}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Comparison */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Primary Scan Symmetry */}
            <Card>
              <CardHeader>
                <CardTitle>
                  {selectedScan
                    ? format(new Date(selectedScan.date), "MMM d, yyyy")
                    : ""}{" "}
                  Symmetry
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={getLimbSymmetryData(selectedScan)}
                      layout="vertical"
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="category" type="category" />
                      <Tooltip content={renderTooltip} />
                      <Legend />
                      <Bar dataKey="Right" fill="#8884d8" name="Right Side" />
                      <Bar dataKey="Left" fill="#82ca9d" name="Left Side" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Comparison Scan Symmetry */}
            <Card>
              <CardHeader>
                <CardTitle>
                  {comparisonScan
                    ? format(new Date(comparisonScan.date), "MMM d, yyyy")
                    : ""}{" "}
                  Symmetry
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={getLimbSymmetryData(comparisonScan)}
                      layout="vertical"
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="category" type="category" />
                      <Tooltip content={renderTooltip} />
                      <Legend />
                      <Bar dataKey="Right" fill="#8884d8" name="Right Side" />
                      <Bar dataKey="Left" fill="#82ca9d" name="Left Side" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default SymmetryTab;
