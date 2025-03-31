// src/features/dexa/goal/goal-tab.tsx
import { useEffect, useState } from "react";
import { DexaScan } from "../dexa-visualization";
import DexaGoalDisplay from "./dexa-goal-display";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { GoalStorageService } from "./goal-storage-service";
import { formatDate } from "@/lib/date-utils";

export default function GoalTab({ data }: { data: DexaScan[] }) {
  const [goal, setGoal] = useState<any>(null);
  const [refresh, setRefresh] = useState(0);

  const loadGoal = () => {
    const dexaGoal = GoalStorageService.getGoal();
    setGoal(dexaGoal);
  };

  useEffect(() => {
    loadGoal();
  }, [refresh]);

  // Get the latest scan
  const latestScan =
    data.length > 0
      ? data.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        )[0]
      : undefined;

  // Custom tooltip renderer
  const renderTooltip = (props: any) => {
    const { active, payload, label } = props;
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border p-2 rounded shadow-sm">
          <p className="font-bold">{label}</p>
          {payload.map((entry: any, index: number) => {
            let displayValue = entry.value?.toFixed(2) || 0;

            // Special handling for body fat percentage
            if (entry.name === "Body Fat" || entry.name.includes("Fat %")) {
              // If the value is stored as decimal (less than 1), convert to percentage
              if (entry.value < 1 && entry.value > 0) {
                displayValue = (entry.value * 100).toFixed(1);
              }
            }

            return (
              <p key={`item-${index}`} style={{ color: entry.color }}>
                {entry.name}: {displayValue} {entry.unit || ""}
                {entry.payload?.isGoal ? " (Goal)" : ""}
              </p>
            );
          })}
        </div>
      );
    }
    return null;
  };

  // Prepare chart data for Body Fat Percentage
  const getBodyFatChartData = () => {
    const chartData = data
      .map((item) => ({
        date: formatDate(item.date),
        bodyFat: item.total_body_fat_percentage * 100 || 0,
        dateObj: item.date,
      }))
      .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());

    // No need to add goal date point since target date was removed
    return chartData;
  };

  // Prepare chart data for Weight
  const getWeightChartData = () => {
    const chartData = data
      .map((item) => ({
        date: formatDate(item.date),
        weight: item.total_mass_lbs || 0,
        dateObj: item.date,
      }))
      .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());

    // No need to add goal point since target date was removed
    return chartData;
  };

  // Prepare chart data for VAT Mass
  const getVatChartData = () => {
    const chartData = data
      .map((item) => ({
        date: formatDate(item.date),
        vatMass: item.vat_mass_lbs || 0,
        dateObj: item.date,
      }))
      .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());

    // No need to add goal point since target date was removed
    return chartData;
  };

  const handleGoalChange = () => {
    setRefresh((prev) => prev + 1);
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
          <Card className="md:col-span-2 lg:col-span-3">
            <CardHeader>
              <CardTitle>Body Fat % Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={getBodyFatChartData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis unit="%" />
                    <Tooltip content={renderTooltip} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="bodyFat"
                      name="Body Fat"
                      stroke="#8884d8"
                      activeDot={{ r: 8 }}
                      unit="%"
                      strokeWidth={2}
                    />
                    {goal && (
                      <ReferenceLine
                        y={goal.bodyFatPercent}
                        stroke="red"
                        strokeDasharray="3 3"
                        label={{
                          value: `Goal: ${goal.bodyFatPercent}%`,
                          position: "insideBottomRight",
                        }}
                      />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Weight Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={getWeightChartData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis unit=" lbs" />
                    <Tooltip content={renderTooltip} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="weight"
                      name="Weight"
                      stroke="#FF8042"
                      unit=" lbs"
                      strokeWidth={2}
                    />
                    {goal && (
                      <ReferenceLine
                        y={goal.totalWeightLbs}
                        stroke="red"
                        strokeDasharray="3 3"
                        label={{
                          value: `Goal: ${goal.totalWeightLbs} lbs`,
                          position: "insideBottomRight",
                        }}
                      />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>VAT Mass Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={getVatChartData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis unit=" lbs" />
                    <Tooltip content={renderTooltip} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="vatMass"
                      name="VAT Mass"
                      stroke="#82ca9d"
                      unit=" lbs"
                      strokeWidth={2}
                    />
                    {goal && (
                      <ReferenceLine
                        y={goal.vatMassLbs}
                        stroke="red"
                        strokeDasharray="3 3"
                        label={{
                          value: `Goal: ${goal.vatMassLbs} lbs`,
                          position: "insideBottomRight",
                        }}
                      />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
