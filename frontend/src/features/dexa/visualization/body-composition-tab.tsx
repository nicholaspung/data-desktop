// src/features/dexa/visualization/body-composition-tab.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PieChart,
  Pie,
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
  Cell,
} from "recharts";
import { DexaScan } from "../dexa-visualization";

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

interface BodyCompositionTabProps {
  data: DexaScan[];
  formatDate: (date: Date) => string;
}

const BodyCompositionTab = ({ data, formatDate }: BodyCompositionTabProps) => {
  console.log("BodyCompositionTab - data received:", data);

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
    console.log("Latest DEXA scan for pie chart:", latest);

    const fatMass = latest.fat_tissue_lbs || 0;
    const leanMass = latest.lean_tissue_lbs || 0;
    const boneMass = latest.bone_mineral_content
      ? latest.bone_mineral_content / 453.59237
      : 0; // Convert grams to lbs

    console.log("Pie chart data:", { fatMass, leanMass, boneMass });

    const result = [
      { name: "Fat Mass", value: fatMass },
      { name: "Lean Mass", value: leanMass },
      { name: "Bone Mass", value: boneMass },
    ];

    // Check if we have any non-zero values
    const hasValidData = result.some((item) => item.value > 0);
    console.log("Pie chart has valid data:", hasValidData);

    // If all values are zero, add some minimal value to make the chart visible
    if (!hasValidData) {
      console.log("No valid data for pie chart, using placeholder values");
      return [
        { name: "Fat Mass", value: 1 },
        { name: "Lean Mass", value: 1 },
        { name: "Bone Mass", value: 1 },
      ];
    }

    return result;
  };

  // Create data for the body fat distribution comparison
  const getBodyFatDistributionData = () => {
    if (data.length === 0) return [];

    const latest = data[data.length - 1];
    console.log("Latest DEXA scan for body fat distribution:", latest);

    const compareMetrics = [
      { key: "arms_total_region_fat_percentage", name: "Arms" },
      { key: "legs_total_region_fat_percentage", name: "Legs" },
      { key: "trunk_total_region_fat_percentage", name: "Trunk" },
      { key: "android_total_region_fat_percentage", name: "Android" },
      { key: "gynoid_total_region_fat_percentage", name: "Gynoid" },
    ];

    return compareMetrics.map((metric) => ({
      name: metric.name,
      value: latest[metric.key] || 0,
      fill: getColorForPercentage(latest[metric.key] || 0),
    }));
  };

  // Get lean vs fat trend data
  const getLeanVsFatData = () => {
    console.log(
      "Processing data for lean vs fat trend chart, data length:",
      data.length
    );

    const chartData = data
      .map((item) => ({
        date: formatDate(item.date),
        "Lean Tissue": item.lean_tissue_lbs || 0,
        "Fat Tissue": item.fat_tissue_lbs || 0,
        dateObj: item.date,
      }))
      .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());

    console.log("Lean vs Fat trend chart data:", chartData);
    return chartData;
  };

  return (
    <div className="space-y-6">
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
                  {data.length > 0 ? (
                    <>
                      <Pie
                        data={getLatestBodyCompData()}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) =>
                          percent > 0
                            ? `${name}: ${(percent * 100).toFixed(1)}%`
                            : ""
                        }
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        minAngle={5}
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
                    </>
                  ) : (
                    <text
                      x="50%"
                      y="50%"
                      textAnchor="middle"
                      dominantBaseline="middle"
                    >
                      No data available
                    </text>
                  )}
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
                  <Line type="monotone" dataKey="Fat Tissue" stroke="#82ca9d" />
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
    </div>
  );
};

export default BodyCompositionTab;
