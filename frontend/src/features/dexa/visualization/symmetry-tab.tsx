// src/features/dexa/visualization/symmetry-tab.tsx
import { useState } from "react";
import { ComparisonSelector } from "./comparison-selector";
import { format } from "date-fns";
import { ViewMode } from "../dexa";
import CustomBarChart from "@/components/charts/bar-chart";
import CustomRadarChart from "@/components/charts/radar-chart";
import { DEXAScan } from "@/store/dexa-definitions";

const SymmetryTab = ({ data }: { data: DEXAScan[] }) => {
  const [viewMode, setViewMode] = useState<ViewMode>("single");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [comparisonDate, setComparisonDate] = useState<string>("");

  // Find selected scans
  const selectedScan = data.find((scan) => scan.id === selectedDate);
  const comparisonScan = data.find((scan) => scan.id === comparisonDate);

  // Get limb symmetry data (right vs left comparison) for a single scan
  const getLimbSymmetryData = (scan: DEXAScan | undefined) => {
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
  const calculateSymmetryScores = (scan: DEXAScan | undefined) => {
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
        value: parseFloat(armsFatSymmetry.toFixed(2)),
        fill: armsFatSymmetry > 90 ? "#82ca9d" : "#ffc658",
      },
      {
        name: "Arms Lean",
        value: parseFloat(armsLeanSymmetry.toFixed(2)),
        fill: armsLeanSymmetry > 90 ? "#82ca9d" : "#ffc658",
      },
      {
        name: "Legs Fat",
        value: parseFloat(legsFatSymmetry.toFixed(2)),
        fill: legsFatSymmetry > 90 ? "#82ca9d" : "#ffc658",
      },
      {
        name: "Legs Lean",
        value: parseFloat(legsLeanSymmetry.toFixed(2)),
        fill: legsLeanSymmetry > 90 ? "#82ca9d" : "#ffc658",
      },
      {
        name: "Overall",
        value: parseFloat(overallSymmetry.toFixed(2)),
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

  // Configure bar chart for symmetry data
  const getSymmetryBarConfigs = () => {
    return [
      {
        dataKey: "value",
        name: "Symmetry Score",
        colorByValue: true,
        getColorByValue: (value: number) =>
          value > 90 ? "#82ca9d" : "#ffc658",
      },
    ];
  };

  // Configure bars for limb symmetry comparison
  const getLimbSymmetryBarConfigs = () => {
    return [
      {
        dataKey: "Right",
        name: "Right Side",
        color: "#8884d8",
      },
      {
        dataKey: "Left",
        name: "Left Side",
        color: "#82ca9d",
      },
    ];
  };

  // Configure radars for comparison view
  const getRadarConfigs = () => {
    if (!selectedScan || !comparisonScan) return [];

    const primaryDate = format(new Date(selectedScan.date), "MMM d, yyyy");
    const secondaryDate = format(new Date(comparisonScan.date), "MMM d, yyyy");

    return [
      {
        dataKey: primaryDate,
        name: primaryDate,
        fill: "#8884d8",
        stroke: "#8884d8",
        fillOpacity: 0.6,
      },
      {
        dataKey: secondaryDate,
        name: secondaryDate,
        fill: "#82ca9d",
        stroke: "#82ca9d",
        fillOpacity: 0.6,
      },
    ];
  };

  // Custom tooltip formatter for symmetry percentage values
  const symmetryTooltipFormatter = (value: any) => {
    return `${Number(value).toFixed(2)}%`;
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
          <CustomBarChart
            data={getLimbSymmetryData(selectedScan)}
            bars={getLimbSymmetryBarConfigs()}
            xAxisKey="category"
            layout="vertical"
            title="Left vs Right Symmetry"
            height={400}
            tooltipFormatter={(value, _, props) => {
              if (props.category.includes("%")) {
                return `${value.toFixed(2)}%`;
              }
              return `${value.toFixed(2)} lbs`;
            }}
          />

          {/* Symmetry Scores */}
          <CustomBarChart
            data={calculateSymmetryScores(selectedScan)}
            bars={getSymmetryBarConfigs()}
            xAxisKey="name"
            yAxisUnit="%"
            yAxisDomain={[0, 100]}
            title="Symmetry Scores"
            height={400}
            tooltipFormatter={symmetryTooltipFormatter}
          />
        </div>
      ) : (
        // Comparison view
        <div className="space-y-6">
          {/* Symmetry Radar Comparison */}
          <CustomRadarChart
            data={getRadarComparisonData()}
            radars={getRadarConfigs()}
            title="Symmetry Score Comparison"
            height={400}
            outerRadius={160}
            tooltipFormatter={(value) => `${Number(value).toFixed(2)}%`}
          />

          {/* Detailed Comparison */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Primary Scan Symmetry */}
            <CustomBarChart
              data={getLimbSymmetryData(selectedScan)}
              bars={getLimbSymmetryBarConfigs()}
              xAxisKey="category"
              layout="vertical"
              title={
                selectedScan
                  ? `${format(new Date(selectedScan.date), "MMM d, yyyy")} Symmetry`
                  : "Symmetry"
              }
              height={300}
              tooltipFormatter={(value, _, props) => {
                if (props.category.includes("%")) {
                  return `${value.toFixed(2)}%`;
                }
                return `${value.toFixed(2)} lbs`;
              }}
            />

            {/* Comparison Scan Symmetry */}
            <CustomBarChart
              data={getLimbSymmetryData(comparisonScan)}
              bars={getLimbSymmetryBarConfigs()}
              xAxisKey="category"
              layout="vertical"
              title={
                comparisonScan
                  ? `${format(new Date(comparisonScan.date), "MMM d, yyyy")} Symmetry`
                  : "Symmetry"
              }
              height={300}
              tooltipFormatter={(value, _, props) => {
                if (props.category.includes("%")) {
                  return `${value.toFixed(2)}%`;
                }
                return `${value.toFixed(2)} lbs`;
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default SymmetryTab;
