// src/features/dexa/visualization/regional-analysis-tab.tsx
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

interface RegionalAnalysisTabProps {
  data: DexaScan[];
  formatDate: (date: Date) => string;
}

const RegionalAnalysisTab = ({
  data,
  formatDate,
}: RegionalAnalysisTabProps) => {
  // Different compare metrics for the comparison chart
  const compareMetrics = [
    { key: "arms_total_region_fat_percentage", name: "Arms" },
    { key: "legs_total_region_fat_percentage", name: "Legs" },
    { key: "trunk_total_region_fat_percentage", name: "Trunk" },
    { key: "android_total_region_fat_percentage", name: "Android" },
    { key: "gynoid_total_region_fat_percentage", name: "Gynoid" },
  ];

  // Get comparison data for comparison chart
  const getComparisonData = () => {
    if (data.length === 0) return [];

    return data
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

  return (
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
  );
};

export default RegionalAnalysisTab;
