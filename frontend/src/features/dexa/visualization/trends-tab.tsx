import { useState } from "react";
import { formatDate } from "@/lib/date-utils";
import CustomLineChart from "@/components/charts/line-chart";
import CustomComposedChart from "@/components/charts/composed-chart";
import { DEXAScan } from "@/store/dexa-definitions";
import ReusableTabs from "@/components/reusable/reusable-tabs";

const TrendsTab = ({ data }: { data: DEXAScan[] }) => {
  const [activeTab, setActiveTab] = useState("bodyFat");

  const getBodyWeightTrendData = () => {
    return data
      .map((item) => ({
        date: formatDate(item.date),
        weight: item.total_mass_lbs || 0,
        dateObj: item.date,
      }))
      .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
  };

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

  const bodyFatTooltipFormatter = (value: any) => {
    if (value < 1 && value > 0) {
      return `${(value * 100).toFixed(1)}%`;
    }
    return `${value.toFixed(2)}%`;
  };

  return (
    <div className="space-y-6">
      <ReusableTabs
        tabs={[
          {
            id: "bodyFat",
            label: "Body Fat %",
            content: (
              <div className="mt-6 space-y-6">
                <CustomLineChart
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
                <CustomLineChart
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
            ),
          },
          {
            id: "bodyWeight",
            label: "Body Weight",
            content: (
              <div className="mt-6">
                <CustomLineChart
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
              </div>
            ),
          },
          {
            id: "leanFat",
            label: "Lean vs Fat",
            content: (
              <div className="mt-6">
                <CustomComposedChart
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
              </div>
            ),
          },
          {
            id: "symmetry",
            label: "Symmetry",
            content: (
              <div className="mt-6">
                <CustomLineChart
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
              </div>
            ),
          },
        ]}
        defaultTabId={activeTab}
        onChange={setActiveTab}
        className="w-full"
        tabsListClassName="grid w-full grid-cols-4"
        tabsContentClassName=""
      />
    </div>
  );
};

export default TrendsTab;
