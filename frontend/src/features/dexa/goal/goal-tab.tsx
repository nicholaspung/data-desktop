import { useEffect, useState } from "react";
import DexaGoalDisplay from "./dexa-goal-display";
import { GoalStorageService } from "./goal-storage-service";
import { formatDate } from "@/lib/date-utils";
import CustomLineChart from "@/components/charts/line-chart";
import { DEXAScan } from "@/store/dexa-definitions";

export default function GoalTab({ data }: { data: DEXAScan[] }) {
  const [goal, setGoal] = useState<any>(null);
  const [refresh, setRefresh] = useState(0);

  const loadGoal = () => {
    const dexaGoal = GoalStorageService.getGoal();
    setGoal(dexaGoal);
  };

  useEffect(() => {
    loadGoal();
  }, [refresh]);

  const latestScan =
    data.length > 0
      ? data.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        )[0]
      : undefined;

  const getBodyFatChartData = () => {
    const chartData = data
      .map((item) => ({
        date: formatDate(item.date),
        bodyFat: item.total_body_fat_percentage * 100 || 0,
        dateObj: item.date,
      }))
      .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());

    return chartData;
  };

  const getWeightChartData = () => {
    const chartData = data
      .map((item) => ({
        date: formatDate(item.date),
        weight: item.total_mass_lbs || 0,
        dateObj: item.date,
      }))
      .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());

    return chartData;
  };

  const getVatChartData = () => {
    const chartData = data
      .map((item) => ({
        date: formatDate(item.date),
        vatMass: item.vat_mass_lbs || 0,
        dateObj: item.date,
      }))
      .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());

    return chartData;
  };

  const handleGoalChange = () => {
    setRefresh((prev) => prev + 1);
  };

  const bodyFatLineConfig = [
    {
      dataKey: "bodyFat",
      name: "Body Fat",
      stroke: "#8884d8",
      unit: "%",
      strokeWidth: 2,
      activeDot: { r: 8 },
    },
  ];

  const weightLineConfig = [
    {
      dataKey: "weight",
      name: "Weight",
      stroke: "#FF8042",
      unit: " lbs",
      strokeWidth: 2,
    },
  ];

  const vatLineConfig = [
    {
      dataKey: "vatMass",
      name: "VAT Mass",
      stroke: "#82ca9d",
      unit: " lbs",
      strokeWidth: 2,
    },
  ];

  const getBodyFatReferenceLines = () => {
    if (!goal) return [];
    return [
      {
        y: goal.bodyFatPercent,
        label: `Goal: ${goal.bodyFatPercent}%`,
        color: "red",
      },
    ];
  };

  const getWeightReferenceLines = () => {
    if (!goal) return [];
    return [
      {
        y: goal.totalWeightLbs,
        label: `Goal: ${goal.totalWeightLbs} lbs`,
        color: "red",
      },
    ];
  };

  const getVatReferenceLines = () => {
    if (!goal) return [];
    return [
      {
        y: goal.vatMassLbs,
        label: `Goal: ${goal.vatMassLbs} lbs`,
        color: "red",
      },
    ];
  };

  return (
    <div className="space-y-6">
      <DexaGoalDisplay
        latestScan={
          latestScan
            ? {
                total_body_fat_percentage: latestScan.total_body_fat_percentage,
                total_mass_lbs: latestScan.total_mass_lbs,
                vat_mass_lbs: latestScan.vat_mass_lbs,
                date: latestScan.date,
              }
            : undefined
        }
        onGoalChange={handleGoalChange}
      />

      {goal && data.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2">
          <CustomLineChart
            data={getBodyFatChartData()}
            lines={bodyFatLineConfig}
            xAxisKey="date"
            yAxisUnit="%"
            title="Body Fat % Progress"
            referenceLines={getBodyFatReferenceLines()}
            height={400}
            className="md:col-span-2"
          />

          <CustomLineChart
            data={getWeightChartData()}
            lines={weightLineConfig}
            xAxisKey="date"
            yAxisUnit=" lbs"
            title="Weight Progress"
            referenceLines={getWeightReferenceLines()}
            height={300}
          />

          <CustomLineChart
            data={getVatChartData()}
            lines={vatLineConfig}
            xAxisKey="date"
            yAxisUnit=" lbs"
            title="VAT Mass Progress"
            referenceLines={getVatReferenceLines()}
            height={300}
          />
        </div>
      )}
    </div>
  );
}
