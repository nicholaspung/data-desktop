// src/features/dexa/visualization/trends-tab.tsx
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DexaScan } from "../dexa-visualization";
import { formatDate } from "@/lib/date-utils";
import { LineChart, ComposedChart } from "@/components/charts";

const TrendsTab = ({ data }: { data: DexaScan[] }) => {
  const [activeTab, setActiveTab] = useState("bodyFat");

  // Get body weight trend data
  const getBodyWeightTrendData = () => {
    return data
      .map((item) => ({
        date: formatDate(item.date),
        weight: item.total_mass_lbs || 0,
        dateObj: item.date,
      }))
      .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
  };

  // Get lean vs fat trend data
  const getLeanVsFatTrendData = () => {
    return data
      .map((item) => ({
        date: formatDate(item.date),
        "Lean Tissue": item.lean_tissue_lbs || 0,
        "Fat Tissue": item.fat_tissue_lbs || 0,
        "Total Weight": item.total_mass_lbs || 0,
        dateObj: item.date,
      }))
      .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
  };

  // Get symmetry trend data
  const getSymmetryTrendData = () => {
    return data
      .map((item) => ({
        date: formatDate(item.date),
        "Arms Symmetry":
          100 -
          Math.abs(
            (((item.right_arm_lean_tissue_lbs || 0) -
              (item.left_arm_lean_tissue_lbs || 0)) /
              ((item.right_arm_lean_tissue_lbs || 0) +
                (item.left_arm_lean_tissue_lbs || 0) || 1)) *
              200
          ),
        "Legs Symmetry":
          100 -
          Math.abs(
            (((item.right_leg_lean_tissue_lbs || 0) -
              (item.left_leg_lean_tissue_lbs || 0)) /
              ((item.right_leg_lean_tissue_lbs || 0) +
                (item.left_leg_lean_tissue_lbs || 0) || 1)) *
              200
          ),
        dateObj: item.date,
      }))
      .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
  };

  // Custom tooltip formatter for percentage values
  const bodyFatTooltipFormatter = (value: any) => {
    // If the value is stored as decimal (less than 1), convert to percentage
    if (value < 1 && value > 0) {
      return `${(value * 100).toFixed(1)}%`;
    }
    return `${value.toFixed(2)}%`;
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="bodyFat">Body Fat %</TabsTrigger>
          <TabsTrigger value="bodyWeight">Body Weight</TabsTrigger>
          <TabsTrigger value="leanFat">Lean vs Fat</TabsTrigger>
          <TabsTrigger value="symmetry">Symmetry</TabsTrigger>
        </TabsList>

        <TabsContent value="bodyFat" className="mt-6">
          <div className="space-y-6">
            <LineChart
              data={data
                .map((item) => ({
                  date: formatDate(item.date),
                  bodyFat: item.total_body_fat_percentage * 100 || 0,
                  dateObj: item.date,
                }))
                .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime())}
              lines={[
                {
                  dataKey: "bodyFat",
                  name: "Body Fat",
                  color: "#8884d8",
                  unit: "%",
                  strokeWidth: 2,
                  activeDot: { r: 8 },
                },
              ]}
              xAxisKey="date"
              yAxisUnit="%"
              title="Body Fat Percentage Trend"
              tooltipFormatter={bodyFatTooltipFormatter}
              height={400}
            />

            <LineChart
              data={data
                .map((item) => ({
                  date: formatDate(item.date),
                  vatMass: item.vat_mass_lbs || 0,
                  dateObj: item.date,
                }))
                .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime())}
              lines={[
                {
                  dataKey: "vatMass",
                  name: "VAT Mass",
                  color: "#FF8042",
                  unit: " lbs",
                  strokeWidth: 2,
                  activeDot: { r: 8 },
                },
              ]}
              xAxisKey="date"
              yAxisUnit=" lbs"
              title="VAT Mass Trend"
              height={400}
            />
          </div>
        </TabsContent>

        <TabsContent value="bodyWeight" className="mt-6">
          <LineChart
            data={getBodyWeightTrendData()}
            lines={[
              {
                dataKey: "weight",
                name: "Body Weight",
                color: "#FF8042",
                unit: "lbs",
                strokeWidth: 2,
                activeDot: { r: 8 },
              },
            ]}
            xAxisKey="date"
            yAxisUnit=" lbs"
            title="Body Weight Trend"
            height={400}
          />
        </TabsContent>

        <TabsContent value="leanFat" className="mt-6">
          <ComposedChart
            data={getLeanVsFatTrendData()}
            elements={[
              {
                type: "area",
                dataKey: "Total Weight",
                color: "#8884d8",
                opacity: 0.2,
              },
              {
                type: "bar",
                dataKey: "Fat Tissue",
                color: "#FF8042",
                barSize: 20,
              },
              {
                type: "line",
                dataKey: "Lean Tissue",
                color: "#82ca9d",
                strokeWidth: 2,
              },
            ]}
            xAxisKey="date"
            yAxisUnit=" lbs"
            title="Lean vs Fat Tissue Trend"
            height={400}
          />
        </TabsContent>

        <TabsContent value="symmetry" className="mt-6">
          <LineChart
            data={getSymmetryTrendData()}
            lines={[
              {
                dataKey: "Arms Symmetry",
                color: "#8884d8",
                strokeWidth: 2,
                activeDot: { r: 8 },
                unit: "%",
              },
              {
                dataKey: "Legs Symmetry",
                color: "#82ca9d",
                strokeWidth: 2,
                activeDot: { r: 8 },
                unit: "%",
              },
            ]}
            xAxisKey="date"
            yAxisUnit="%"
            yAxisDomain={[0, 100]}
            title="Body Symmetry Trend"
            height={400}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TrendsTab;
