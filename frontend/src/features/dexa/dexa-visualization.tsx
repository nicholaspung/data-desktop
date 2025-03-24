// src/features/dexa/dexa-visualization.tsx
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { ApiService } from "@/services/api";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface DexaVisualizationProps {
  className?: string;
}

// Define color palette
const COLORS = [
  "#8884d8", // Purple
  "#82ca9d", // Green
  "#ffc658", // Yellow
  "#ff8042", // Orange
  "#0088fe", // Blue
  "#00C49F", // Teal
  "#FFBB28", // Amber
  "#FF8042", // Coral
];

// Mapping percentage values to different semantic colors
const getColorForPercentage = (value: number) => {
  if (value < 10) return "#82ca9d"; // Lean - Green
  if (value < 20) return "#8884d8"; // Athletic - Purple
  if (value < 25) return "#ffc658"; // Fitness - Yellow
  if (value < 30) return "#ff8042"; // Average - Orange
  return "#d32f2f"; // Higher body fat - Red
};

export default function DexaVisualization({
  className = "",
}: DexaVisualizationProps) {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("bodyComp");
  const [timeRange, setTimeRange] = useState("all");
  const [selectedMetric, setSelectedMetric] = useState(
    "total_body_fat_percentage"
  );

  const metricOptions = [
    { value: "total_body_fat_percentage", label: "Body Fat %" },
    { value: "lean_tissue_lbs", label: "Lean Tissue (lbs)" },
    { value: "fat_tissue_lbs", label: "Fat Tissue (lbs)" },
    { value: "total_mass_lbs", label: "Total Mass (lbs)" },
    { value: "vat_mass_lbs", label: "VAT Mass (lbs)" },
    { value: "bone_density_g_cm2_total", label: "Bone Density (g/cm²)" },
    { value: "resting_metabolic_rate", label: "RMR (calories)" },
  ];

  // Different compare metrics for the comparison chart
  const compareMetrics = [
    { key: "arms_total_region_fat_percentage", name: "Arms" },
    { key: "legs_total_region_fat_percentage", name: "Legs" },
    { key: "trunk_total_region_fat_percentage", name: "Trunk" },
    { key: "android_total_region_fat_percentage", name: "Android" },
    { key: "gynoid_total_region_fat_percentage", name: "Gynoid" },
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const records = await ApiService.getRecords("dexa");

      // Process and sort the data
      const processedRecords = records
        .map((record: any) => ({
          ...record,
          date: new Date(record.date),
        }))
        .sort((a, b) => a.date.getTime() - b.date.getTime());

      setData(processedRecords);
    } catch (error) {
      console.error("Error loading DEXA data:", error);
      setError("Failed to load DEXA scan data");
    } finally {
      setIsLoading(false);
    }
  };

  // Filter data based on time range
  const getFilteredData = () => {
    if (timeRange === "all" || data.length === 0) return data;

    const now = new Date();
    const startDate = new Date();

    switch (timeRange) {
      case "3m":
        startDate.setMonth(now.getMonth() - 3);
        break;
      case "6m":
        startDate.setMonth(now.getMonth() - 6);
        break;
      case "1y":
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      case "2y":
        startDate.setFullYear(now.getFullYear() - 2);
        break;
    }

    return data.filter((item) => item.date >= startDate);
  };

  // Format date for charts
  const formatDate = (date: Date) => {
    return format(new Date(date), "MMM d, yyyy");
  };

  // Custom tooltip formatter
  const renderTooltip = (props: any) => {
    const { active, payload, label } = props;
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border p-2 rounded shadow-sm">
          <p className="font-bold">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={`item-${index}`} style={{ color: entry.color }}>
              {entry.name}: {entry.value.toFixed(2)} {entry.unit || ""}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Generate the latest body composition data for the pie chart
  const getLatestBodyCompData = () => {
    if (data.length === 0) return [];

    const latest = data[data.length - 1];
    const fatMass = latest.fat_tissue_lbs || 0;
    const leanMass = latest.lean_tissue_lbs || 0;
    const boneMass = latest.bone_mineral_content || 0;

    return [
      { name: "Fat Mass", value: fatMass },
      { name: "Lean Mass", value: leanMass },
      { name: "Bone Mass", value: boneMass },
    ];
  };

  // Create data for the body fat distribution comparison
  const getBodyFatDistributionData = () => {
    if (data.length === 0) return [];

    const latest = data[data.length - 1];

    return compareMetrics.map((metric) => ({
      name: metric.name,
      value: latest[metric.key] || 0,
      fill: getColorForPercentage(latest[metric.key] || 0),
    }));
  };

  // Get trend data for trend chart
  const getTrendData = () => {
    const filtered = getFilteredData();

    return filtered
      .map((item) => ({
        date: formatDate(item.date),
        [selectedMetric]: item[selectedMetric] || 0,
        dateObj: item.date, // Keep original date for sorting
      }))
      .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
  };

  // Get comparison data for comparison chart
  const getComparisonData = () => {
    const filtered = getFilteredData();
    if (filtered.length === 0) return [];

    return filtered
      .map((item) => {
        const result: any = {
          date: formatDate(item.date),
          dateObj: item.date,
        };

        compareMetrics.forEach((metric) => {
          result[metric.name] = item[metric.key] || 0;
        });

        return result;
      })
      .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
  };

  // Get lean vs fat trend data
  const getLeanVsFatData = () => {
    const filtered = getFilteredData();

    return filtered
      .map((item) => ({
        date: formatDate(item.date),
        "Lean Tissue": item.lean_tissue_lbs || 0,
        "Fat Tissue": item.fat_tissue_lbs || 0,
        dateObj: item.date,
      }))
      .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
  };

  // Get limb symmetry data (right vs left comparison)
  const getLimbSymmetryData = () => {
    if (data.length === 0) return [];

    const latest = data[data.length - 1];

    return [
      {
        category: "Arms Fat %",
        Right: latest.right_arm_total_region_fat_percentage || 0,
        Left: latest.left_arm_total_region_fat_percentage || 0,
      },
      {
        category: "Arms Lean (lbs)",
        Right: latest.right_arm_lean_tissue_lbs || 0,
        Left: latest.left_arm_lean_tissue_lbs || 0,
      },
      {
        category: "Legs Fat %",
        Right: latest.right_leg_total_region_fat_percentage || 0,
        Left: latest.left_leg_total_region_fat_percentage || 0,
      },
      {
        category: "Legs Lean (lbs)",
        Right: latest.right_leg_lean_tissue_lbs || 0,
        Left: latest.left_leg_lean_tissue_lbs || 0,
      },
    ];
  };

  // Get unit for selected metric
  const getUnitForMetric = (metric: string) => {
    switch (metric) {
      case "total_body_fat_percentage":
      case "arms_total_region_fat_percentage":
      case "legs_total_region_fat_percentage":
      case "trunk_total_region_fat_percentage":
      case "android_total_region_fat_percentage":
      case "gynoid_total_region_fat_percentage":
        return "%";
      case "lean_tissue_lbs":
      case "fat_tissue_lbs":
      case "total_mass_lbs":
      case "vat_mass_lbs":
        return "lbs";
      case "bone_density_g_cm2_total":
        return "g/cm²";
      case "resting_metabolic_rate":
        return "cal";
      default:
        return "";
    }
  };

  // Get display name for metric
  const getMetricDisplayName = () => {
    const found = metricOptions.find(
      (option) => option.value === selectedMetric
    );
    return found ? found.label : selectedMetric;
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (error || data.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="py-10">
          <div className="text-center">
            <h3 className="text-lg font-medium">No Data Available</h3>
            <p className="text-muted-foreground mt-2">
              {error ||
                "No DEXA scan data has been added yet. Add your first scan to see visualizations."}
            </p>
            <Button onClick={loadData} variant="outline" className="mt-4">
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={className}>
      <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-4"
        >
          <TabsList>
            <TabsTrigger value="bodyComp">Body Composition</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="regional">Regional Analysis</TabsTrigger>
            <TabsTrigger value="symmetry">Symmetry</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Time Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="3m">Last 3 Months</SelectItem>
              <SelectItem value="6m">Last 6 Months</SelectItem>
              <SelectItem value="1y">Last Year</SelectItem>
              <SelectItem value="2y">Last 2 Years</SelectItem>
            </SelectContent>
          </Select>

          {activeTab === "trends" && (
            <Select value={selectedMetric} onValueChange={setSelectedMetric}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select Metric" />
              </SelectTrigger>
              <SelectContent>
                {metricOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      <TabsContent value="bodyComp" className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Current Body Composition */}
          <Card>
            <CardHeader>
              <CardTitle>Current Body Composition</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={getLatestBodyCompData()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name}: ${(percent * 100).toFixed(1)}%`
                      }
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {getLatestBodyCompData().map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => `${Number(value).toFixed(2)} lbs`}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Fat vs Lean Tissue Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Fat vs Lean Tissue Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={getLeanVsFatData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis unit=" lbs" />
                    <Tooltip content={renderTooltip} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="Lean Tissue"
                      stroke="#8884d8"
                      activeDot={{ r: 8 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="Fat Tissue"
                      stroke="#82ca9d"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Body Fat Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Body Fat Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={getBodyFatDistributionData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis unit="%" />
                  <Tooltip
                    formatter={(value) => `${Number(value).toFixed(2)}%`}
                  />
                  <Bar dataKey="value" name="Body Fat %" radius={[4, 4, 0, 0]}>
                    {getBodyFatDistributionData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="trends" className="space-y-6">
        {/* Metric Trend Over Time */}
        <Card>
          <CardHeader>
            <CardTitle>{getMetricDisplayName()} Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={getTrendData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis unit={` ${getUnitForMetric(selectedMetric)}`} />
                  <Tooltip content={renderTooltip} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey={selectedMetric}
                    name={getMetricDisplayName()}
                    stroke="#8884d8"
                    activeDot={{ r: 8 }}
                    unit={getUnitForMetric(selectedMetric)}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="regional" className="space-y-6">
        {/* Regional Fat Comparison */}
        <Card>
          <CardHeader>
            <CardTitle>Regional Fat Percentage Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={getComparisonData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis unit="%" />
                  <Tooltip content={renderTooltip} />
                  <Legend />
                  {compareMetrics.map((metric, index) => (
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
      </TabsContent>

      <TabsContent value="symmetry" className="space-y-6">
        {/* Limb Symmetry */}
        <Card>
          <CardHeader>
            <CardTitle>Left vs Right Symmetry</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={getLimbSymmetryData()}
                  layout="vertical"
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="category" type="category" />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Right" fill="#8884d8" name="Right Side" />
                  <Bar dataKey="Left" fill="#82ca9d" name="Left Side" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </div>
  );
}
