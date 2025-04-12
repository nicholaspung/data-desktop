import { useState } from "react";
import { ComparisonSelector } from "./comparison-selector";
import BodyRepresentation from "./body-representation";
import { formatDate } from "@/lib/date-utils";
import { ViewMode } from "../dexa";
import { DEXAScan } from "@/store/dexa-definitions";

const BodyAnatomyTab = ({ data }: { data: DEXAScan[] }) => {
  const [viewMode, setViewMode] = useState<ViewMode>("single");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [comparisonDate, setComparisonDate] = useState<string>("");

  // Find selected scans
  const selectedScan = data.find((scan) => scan.id === selectedDate);
  const comparisonScan = data.find((scan) => scan.id === comparisonDate);

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
        // Single view mode
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-1">
          {selectedScan ? (
            <BodyRepresentation
              data={selectedScan}
              title={`Body Composition - ${formatDate(selectedScan.date)}`}
            />
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              Select a scan date to view body composition
            </div>
          )}
        </div>
      ) : (
        // Comparison view mode
        <div className="grid gap-6 md:grid-cols-2">
          {selectedScan ? (
            <BodyRepresentation
              data={selectedScan}
              title={`${formatDate(selectedScan.date)}`}
            />
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              Select a primary scan date
            </div>
          )}

          {comparisonScan ? (
            <BodyRepresentation
              data={comparisonScan}
              title={`${formatDate(comparisonScan.date)}`}
            />
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              Select a comparison scan date
            </div>
          )}

          {selectedScan && comparisonScan && (
            <div className="md:col-span-2">
              <ComparisonSummary
                primaryScan={selectedScan}
                compareScan={comparisonScan}
                primaryDate={formatDate(selectedScan.date)}
                compareDate={formatDate(comparisonScan.date)}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Helper component to show a summary of changes between two scans
const ComparisonSummary = ({
  primaryScan,
  compareScan,
  primaryDate,
  compareDate,
}: {
  primaryScan: DEXAScan;
  compareScan: DEXAScan;
  primaryDate: string;
  compareDate: string;
}) => {
  // Calculate differences between scans
  const calculateDifference = (
    current: number | undefined,
    previous: number | undefined,
    isPercentage: boolean = false
  ) => {
    if (current === undefined || previous === undefined) return null;

    // If values are stored as decimals for percentages, convert to percentage
    const currentValue = isPercentage && current < 1 ? current * 100 : current;
    const previousValue =
      isPercentage && previous < 1 ? previous * 100 : previous;

    return currentValue - previousValue;
  };

  // Function to determine if a change is positive or negative (for styling)
  const isPositiveChange = (diff: number | null, metric: string) => {
    if (diff === null) return false;

    // For fat percentages and masses, negative is good
    if (metric.toLowerCase().includes("fat")) {
      return diff < 0;
    }

    // For lean mass, positive is good
    if (metric.toLowerCase().includes("lean")) {
      return diff > 0;
    }

    // For total mass, depends on goals but we'll assume negative is good
    return diff < 0;
  };

  // Calculate differences for key metrics
  const differences = {
    totalBodyFat: calculateDifference(
      primaryScan.total_body_fat_percentage,
      compareScan.total_body_fat_percentage,
      true
    ),
    totalMass: calculateDifference(
      primaryScan.total_mass_lbs,
      compareScan.total_mass_lbs
    ),
    leanMass: calculateDifference(
      primaryScan.lean_tissue_lbs,
      compareScan.lean_tissue_lbs
    ),
    fatMass: calculateDifference(
      primaryScan.fat_tissue_lbs,
      compareScan.fat_tissue_lbs
    ),
    // Region-specific differences
    rightArmFat: calculateDifference(
      primaryScan.right_arm_total_region_fat_percentage,
      compareScan.right_arm_total_region_fat_percentage,
      true
    ),
    leftArmFat: calculateDifference(
      primaryScan.left_arm_total_region_fat_percentage,
      compareScan.left_arm_total_region_fat_percentage,
      true
    ),
    rightLegFat: calculateDifference(
      primaryScan.right_leg_total_region_fat_percentage,
      compareScan.right_leg_total_region_fat_percentage,
      true
    ),
    leftLegFat: calculateDifference(
      primaryScan.left_leg_total_region_fat_percentage,
      compareScan.left_leg_total_region_fat_percentage,
      true
    ),
    trunkFat: calculateDifference(
      primaryScan.trunk_total_region_fat_percentage,
      compareScan.trunk_total_region_fat_percentage,
      true
    ),
  };

  return (
    <div className="bg-muted/30 rounded-lg p-4 border">
      <h3 className="text-lg font-medium mb-4 text-center">
        Changes from {compareDate} to {primaryDate}
      </h3>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Overall metrics */}
        <div className="bg-background rounded-md p-3 shadow-sm">
          <p className="text-sm text-muted-foreground">Body Fat %</p>
          <p
            className={`text-xl font-bold ${
              isPositiveChange(differences.totalBodyFat, "fat")
                ? "text-green-500"
                : differences.totalBodyFat === null
                  ? ""
                  : "text-red-500"
            }`}
          >
            {differences.totalBodyFat !== null
              ? `${differences.totalBodyFat > 0 ? "+" : ""}${differences.totalBodyFat.toFixed(2)}%`
              : "N/A"}
          </p>
        </div>

        <div className="bg-background rounded-md p-3 shadow-sm">
          <p className="text-sm text-muted-foreground">Total Weight</p>
          <p
            className={`text-xl font-bold ${
              isPositiveChange(differences.totalMass, "mass")
                ? "text-green-500"
                : differences.totalMass === null
                  ? ""
                  : "text-red-500"
            }`}
          >
            {differences.totalMass !== null
              ? `${differences.totalMass > 0 ? "+" : ""}${differences.totalMass.toFixed(2)} lbs`
              : "N/A"}
          </p>
        </div>

        <div className="bg-background rounded-md p-3 shadow-sm">
          <p className="text-sm text-muted-foreground">Lean Mass</p>
          <p
            className={`text-xl font-bold ${
              isPositiveChange(differences.leanMass, "lean")
                ? "text-green-500"
                : differences.leanMass === null
                  ? ""
                  : "text-red-500"
            }`}
          >
            {differences.leanMass !== null
              ? `${differences.leanMass > 0 ? "+" : ""}${differences.leanMass.toFixed(2)} lbs`
              : "N/A"}
          </p>
        </div>

        <div className="bg-background rounded-md p-3 shadow-sm">
          <p className="text-sm text-muted-foreground">Fat Mass</p>
          <p
            className={`text-xl font-bold ${
              isPositiveChange(differences.fatMass, "fat")
                ? "text-green-500"
                : differences.fatMass === null
                  ? ""
                  : "text-red-500"
            }`}
          >
            {differences.fatMass !== null
              ? `${differences.fatMass > 0 ? "+" : ""}${differences.fatMass.toFixed(2)} lbs`
              : "N/A"}
          </p>
        </div>
      </div>

      <h4 className="text-md font-medium mt-4 mb-2">
        Regional Changes (Fat %)
      </h4>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-background rounded-md p-3 shadow-sm">
          <p className="text-sm text-muted-foreground">Right Arm</p>
          <p
            className={`text-lg font-bold ${
              isPositiveChange(differences.rightArmFat, "fat")
                ? "text-green-500"
                : differences.rightArmFat === null
                  ? ""
                  : "text-red-500"
            }`}
          >
            {differences.rightArmFat !== null
              ? `${differences.rightArmFat > 0 ? "+" : ""}${differences.rightArmFat.toFixed(2)}%`
              : "N/A"}
          </p>
        </div>

        <div className="bg-background rounded-md p-3 shadow-sm">
          <p className="text-sm text-muted-foreground">Left Arm</p>
          <p
            className={`text-lg font-bold ${
              isPositiveChange(differences.leftArmFat, "fat")
                ? "text-green-500"
                : differences.leftArmFat === null
                  ? ""
                  : "text-red-500"
            }`}
          >
            {differences.leftArmFat !== null
              ? `${differences.leftArmFat > 0 ? "+" : ""}${differences.leftArmFat.toFixed(2)}%`
              : "N/A"}
          </p>
        </div>

        <div className="bg-background rounded-md p-3 shadow-sm">
          <p className="text-sm text-muted-foreground">Right Leg</p>
          <p
            className={`text-lg font-bold ${
              isPositiveChange(differences.rightLegFat, "fat")
                ? "text-green-500"
                : differences.rightLegFat === null
                  ? ""
                  : "text-red-500"
            }`}
          >
            {differences.rightLegFat !== null
              ? `${differences.rightLegFat > 0 ? "+" : ""}${differences.rightLegFat.toFixed(2)}%`
              : "N/A"}
          </p>
        </div>

        <div className="bg-background rounded-md p-3 shadow-sm">
          <p className="text-sm text-muted-foreground">Left Leg</p>
          <p
            className={`text-lg font-bold ${
              isPositiveChange(differences.leftLegFat, "fat")
                ? "text-green-500"
                : differences.leftLegFat === null
                  ? ""
                  : "text-red-500"
            }`}
          >
            {differences.leftLegFat !== null
              ? `${differences.leftLegFat > 0 ? "+" : ""}${differences.leftLegFat.toFixed(2)}%`
              : "N/A"}
          </p>
        </div>

        <div className="bg-background rounded-md p-3 shadow-sm">
          <p className="text-sm text-muted-foreground">Trunk</p>
          <p
            className={`text-lg font-bold ${
              isPositiveChange(differences.trunkFat, "fat")
                ? "text-green-500"
                : differences.trunkFat === null
                  ? ""
                  : "text-red-500"
            }`}
          >
            {differences.trunkFat !== null
              ? `${differences.trunkFat > 0 ? "+" : ""}${differences.trunkFat.toFixed(2)}%`
              : "N/A"}
          </p>
        </div>
      </div>
    </div>
  );
};

export default BodyAnatomyTab;
