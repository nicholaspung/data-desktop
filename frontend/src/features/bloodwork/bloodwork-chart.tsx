import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea,
} from "recharts";

interface BloodMarkerChartProps {
  data: {
    date: string;
    value: number;
    inOptimalRange?: boolean;
  }[];
  optimalLow?: number;
  optimalHigh?: number;
  unit?: string;
  height?: number;
  showOptimalRange?: boolean; // New prop to control whether to show the optimal range
}

const CustomTooltip = ({ active, payload, label, unit }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border rounded-md p-2 shadow-sm text-sm">
        <p className="font-semibold">{label}</p>
        <p className="text-primary">
          {payload[0].value.toFixed(2)} {unit || ""}
        </p>
      </div>
    );
  }

  return null;
};

const BloodMarkerChart: React.FC<BloodMarkerChartProps> = ({
  data,
  optimalLow,
  optimalHigh,
  unit,
  height = 120,
  showOptimalRange = true, // Default to showing the optimal range if it exists
}) => {
  const hasOptimalRange =
    showOptimalRange && optimalLow !== undefined && optimalHigh !== undefined;

  // Calculate min and max values to set a good Y domain
  const values = data.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);

  // Add 10% padding to the domain
  const yMin = hasOptimalRange ? Math.min(optimalLow!, min) * 0.9 : min * 0.9;
  const yMax = hasOptimalRange ? Math.max(optimalHigh!, max) * 1.1 : max * 1.1;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
        {/* Hide axes but keep for structure */}
        <XAxis dataKey="date" hide />
        <YAxis domain={[yMin, yMax]} hide />
        <Tooltip
          content={<CustomTooltip unit={unit} />}
          cursor={{ strokeDasharray: "3 3" }}
        />

        {/* Add optimal range as colored area if available and should be shown */}
        {hasOptimalRange && (
          <ReferenceArea
            y1={optimalLow}
            y2={optimalHigh}
            fill="#10b981"
            fillOpacity={0.2}
          />
        )}

        {/* The data line */}
        <Line
          type="monotone"
          dataKey="value"
          stroke="#6366f1"
          strokeWidth={2}
          dot={{ r: 4, strokeWidth: 2 }}
          activeDot={{ r: 6, stroke: "#4f46e5", strokeWidth: 2 }}
          connectNulls
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default BloodMarkerChart;
