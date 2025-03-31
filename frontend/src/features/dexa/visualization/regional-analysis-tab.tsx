// src/features/dexa/visualization/regional-analysis-tab.tsx
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
  BarChart,
  Bar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import { DexaScan } from "../dexa-visualization";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { COLORS, formatDate } from "@/lib/date-utils";

const RegionalAnalysisTab = ({ data }: { data: DexaScan[] }) => {
  const [activeTab, setActiveTab] = useState("percentage");
  const [selectedScan, setSelectedScan] = useState<string>("");

  // Define metrics for percentage and absolute values
  const percentageMetrics = [
    { key: "arms_total_region_fat_percentage", name: "Arms" },
    { key: "legs_total_region_fat_percentage", name: "Legs" },
    { key: "trunk_total_region_fat_percentage", name: "Trunk" },
    { key: "android_total_region_fat_percentage", name: "Android" },
    { key: "gynoid_total_region_fat_percentage", name: "Gynoid" },
  ];

  const absoluteMetrics = [
    { key: "arms_fat_tissue_lbs", name: "Arms Fat" },
    { key: "legs_fat_tissue_lbs", name: "Legs Fat" },
    { key: "trunk_fat_tissue_lbs", name: "Trunk Fat" },
    { key: "android_fat_tissue_lbs", name: "Android Fat" },
    { key: "gynoid_fat_tissue_lbs", name: "Gynoid Fat" },
  ];

  const leanMassMetrics = [
    { key: "arms_lean_tissue_lbs", name: "Arms Lean" },
    { key: "legs_lean_tissue_lbs", name: "Legs Lean" },
    { key: "trunk_lean_tissue_lbs", name: "Trunk Lean" },
  ];

  // Date options for the scan selector
  const dateOptions = data
    .map((scan) => ({
      value: scan.id,
      label: formatDate(scan.date),
      date: new Date(scan.date),
    }))
    .sort((a, b) => b.date.getTime() - a.date.getTime()); // Sort newest first

  // Set default scan when component loads
  if (dateOptions.length > 0 && !selectedScan) {
    setSelectedScan(dateOptions[0].value);
  }

  // Get comparison data for line charts
  const getPercentageComparisonData = () => {
    return data
      .map((item) => {
        const result: any = {
          date: formatDate(item.date),
          dateObj: item.date,
        };

        percentageMetrics.forEach((metric) => {
          result[metric.name] = item[metric.key] * 100 || 0;
        });

        return result;
      })
      .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
  };

  // Get absolute comparison data for line charts
  const getAbsoluteComparisonData = () => {
    return data
      .map((item) => {
        const result: any = {
          date: formatDate(item.date),
          dateObj: item.date,
        };

        absoluteMetrics.forEach((metric) => {
          result[metric.name] = item[metric.key] || 0;
        });

        return result;
      })
      .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
  };

  // Get lean mass comparison data for line charts
  const getLeanMassComparisonData = () => {
    return data
      .map((item) => {
        const result: any = {
          date: formatDate(item.date),
          dateObj: item.date,
        };

        leanMassMetrics.forEach((metric) => {
          result[metric.name] = item[metric.key] || 0;
        });

        return result;
      })
      .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
  };

  // Get current scan data for radar chart
  const getCurrentScanData = () => {
    const scan = data.find((s) => s.id === selectedScan);
    if (!scan) return [];

    // For percentage data
    if (activeTab === "percentage") {
      return percentageMetrics.map((metric) => ({
        subject: metric.name,
        value: scan[metric.key] * 100 || 0,
        fullMark: 40, // Typical max for body fat percentage in most regions
      }));
    }

    // For absolute data
    if (activeTab === "absolute") {
      return [...absoluteMetrics, ...leanMassMetrics].map((metric) => ({
        subject: metric.name,
        value: scan[metric.key] || 0,
        fullMark: Math.max(...data.map((s) => s[metric.key] || 0)) * 1.2, // Scale based on max values
      }));
    }

    return [];
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

            // Special handling for fat percentage values
            if (activeTab === "percentage" || entry.name.includes("Fat %")) {
              // If the value is stored as decimal (less than 1), convert to percentage
              if (entry.value < 1 && entry.value > 0) {
                displayValue = (entry.value * 100).toFixed(1);
              }
            }

            return (
              <p key={`item-${index}`} style={{ color: entry.color }}>
                {entry.name}: {displayValue}{" "}
                {activeTab === "percentage" ? "%" : "lbs"}
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
        <TabsList className="grid w-full md:w-[400px] grid-cols-2">
          <TabsTrigger value="percentage">Fat Percentage</TabsTrigger>
          <TabsTrigger value="absolute">Mass Distribution</TabsTrigger>
        </TabsList>

        <TabsContent value="percentage" className="mt-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Regional Fat % Comparison Over Time */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Regional Fat Percentage Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={getPercentageComparisonData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis unit="%" domain={[0, "auto"]} />
                      <Tooltip content={renderTooltip} />
                      <Legend />
                      {percentageMetrics.map((metric, index) => (
                        <Line
                          key={metric.key}
                          type="monotone"
                          dataKey={metric.name}
                          stroke={COLORS[index % COLORS.length]}
                          unit="%"
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Current Scan Regional Distribution */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Current Distribution</CardTitle>
                <Select
                  value={selectedScan}
                  onValueChange={setSelectedScan}
                  disabled={dateOptions.length === 0}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select date" />
                  </SelectTrigger>
                  <SelectContent>
                    {dateOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart outerRadius={90} data={getCurrentScanData()}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="subject" />
                      <PolarRadiusAxis angle={30} domain={[0, "auto"]} />
                      <Radar
                        name="Fat %"
                        dataKey="value"
                        stroke="#8884d8"
                        fill="#8884d8"
                        fillOpacity={0.6}
                      />
                      <Tooltip
                        formatter={(value) => `${Number(value).toFixed(2)}%`}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Current Scan Bar Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Region Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={getCurrentScanData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="subject" />
                      <YAxis unit="%" />
                      <Tooltip
                        formatter={(value) => `${Number(value).toFixed(2)}%`}
                      />
                      <Bar dataKey="value" name="Fat %" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="absolute" className="mt-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Regional Fat Mass Comparison Over Time */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Fat Tissue Distribution (lbs)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={getAbsoluteComparisonData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis unit=" lbs" domain={[0, "auto"]} />
                      <Tooltip content={renderTooltip} />
                      <Legend />
                      {absoluteMetrics.map((metric, index) => (
                        <Line
                          key={metric.key}
                          type="monotone"
                          dataKey={metric.name}
                          stroke={COLORS[index % COLORS.length]}
                          unit=" lbs"
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Regional Lean Mass Comparison Over Time */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Lean Tissue Distribution (lbs)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={getLeanMassComparisonData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis unit=" lbs" domain={[0, "auto"]} />
                      <Tooltip content={renderTooltip} />
                      <Legend />
                      {leanMassMetrics.map((metric, index) => (
                        <Line
                          key={metric.key}
                          type="monotone"
                          dataKey={metric.name}
                          stroke={COLORS[(index + 5) % COLORS.length]} // Use different colors
                          unit=" lbs"
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Current Scan Distribution */}
            <Card className="md:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Current Distribution (lbs)</CardTitle>
                <Select
                  value={selectedScan}
                  onValueChange={setSelectedScan}
                  disabled={dateOptions.length === 0}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select date" />
                  </SelectTrigger>
                  <SelectContent>
                    {dateOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={getCurrentScanData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="subject" />
                      <YAxis unit=" lbs" />
                      <Tooltip
                        formatter={(value) => `${Number(value).toFixed(2)} lbs`}
                      />
                      <Bar dataKey="value" name="Mass" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RegionalAnalysisTab;
