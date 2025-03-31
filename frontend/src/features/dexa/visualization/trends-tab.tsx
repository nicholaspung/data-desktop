// src/features/dexa/visualization/trends-tab.tsx
import { useState } from "react";
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
  ComposedChart,
  Bar,
  Area,
} from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DexaScan } from "../dexa-visualization";
import { formatDate } from "@/lib/date-utils";

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
            if (entry.name === "Body Fat" || entry.name.includes("Fat %")) {
              // If the value is stored as decimal (less than 1), convert to percentage
              if (entry.value < 1 && entry.value > 0) {
                displayValue = (entry.value * 100).toFixed(1);
              }
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
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="bodyFat">Body Fat %</TabsTrigger>
          <TabsTrigger value="bodyWeight">Body Weight</TabsTrigger>
          <TabsTrigger value="leanFat">Lean vs Fat</TabsTrigger>
          <TabsTrigger value="symmetry">Symmetry</TabsTrigger>
        </TabsList>

        <TabsContent value="bodyFat" className="mt-6">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Body Fat Percentage Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={data
                        .map((item) => ({
                          date: formatDate(item.date),
                          bodyFat: item.total_body_fat_percentage * 100 || 0,
                          dateObj: item.date,
                        }))
                        .sort(
                          (a, b) => a.dateObj.getTime() - b.dateObj.getTime()
                        )}
                    >
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
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>VAT Mass Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={data
                        .map((item) => ({
                          date: formatDate(item.date),
                          vatMass: item.vat_mass_lbs || 0,
                          dateObj: item.date,
                        }))
                        .sort(
                          (a, b) => a.dateObj.getTime() - b.dateObj.getTime()
                        )}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis unit=" lbs" />
                      <Tooltip content={renderTooltip} />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="vatMass"
                        name="VAT Mass"
                        stroke="#FF8042"
                        activeDot={{ r: 8 }}
                        unit=" lbs"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="bodyWeight" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Body Weight Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={getBodyWeightTrendData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis unit=" lbs" />
                    <Tooltip content={renderTooltip} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="weight"
                      name="Body Weight"
                      stroke="#FF8042"
                      activeDot={{ r: 8 }}
                      unit="lbs"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leanFat" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Lean vs Fat Tissue Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={getLeanVsFatTrendData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis unit=" lbs" />
                    <Tooltip content={renderTooltip} />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="Total Weight"
                      fill="#8884d8"
                      stroke="#8884d8"
                      fillOpacity={0.2}
                    />
                    <Bar dataKey="Fat Tissue" fill="#FF8042" barSize={20} />
                    <Line
                      type="monotone"
                      dataKey="Lean Tissue"
                      stroke="#82ca9d"
                      strokeWidth={2}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="symmetry" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Body Symmetry Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={getSymmetryTrendData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis unit="%" domain={[0, 100]} />
                    <Tooltip content={renderTooltip} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="Arms Symmetry"
                      stroke="#8884d8"
                      activeDot={{ r: 8 }}
                      unit="%"
                    />
                    <Line
                      type="monotone"
                      dataKey="Legs Symmetry"
                      stroke="#82ca9d"
                      activeDot={{ r: 8 }}
                      unit="%"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TrendsTab;
