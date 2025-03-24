// src/features/dexa/visualization/trends-tab.tsx
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

interface TrendsTabProps {
  data: DexaScan[];
  formatDate: (date: Date) => string;
  selectedMetric: string;
  metricOptions: { value: string; label: string }[];
}

const TrendsTab = ({
  data,
  formatDate,
  selectedMetric,
  metricOptions,
}: TrendsTabProps) => {
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

  // Get trend data for trend chart
  const getTrendData = () => {
    return data
      .map((item) => ({
        date: formatDate(item.date),
        [selectedMetric]: item[selectedMetric] || 0,
        dateObj: item.date, // Keep original date for sorting
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
  );
};

export default TrendsTab;
