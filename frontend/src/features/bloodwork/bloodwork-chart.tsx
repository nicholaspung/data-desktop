import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea,
} from "recharts";

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

const BloodMarkerChart = ({
  data,
  optimalLow,
  optimalHigh,
  unit,
  height = 120,
  showOptimalRange = true,
}: {
  data: {
    date: string;
    value: number;
    inOptimalRange?: boolean;
  }[];
  optimalLow?: number;
  optimalHigh?: number;
  unit?: string;
  height?: number;
  showOptimalRange?: boolean;
}) => {
  const hasOptimalRange =
    showOptimalRange && optimalLow !== undefined && optimalHigh !== undefined;

  const values = data.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);

  const yMin = hasOptimalRange ? Math.min(optimalLow!, min) * 0.9 : min * 0.9;
  const yMax = hasOptimalRange ? Math.max(optimalHigh!, max) * 1.1 : max * 1.1;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
        <XAxis dataKey="date" hide />
        <YAxis domain={[yMin, yMax]} hide />
        <Tooltip
          content={<CustomTooltip unit={unit} />}
          cursor={{ strokeDasharray: "3 3" }}
        />

        {hasOptimalRange && (
          <ReferenceArea
            y1={optimalLow}
            y2={optimalHigh}
            fill="#10b981"
            fillOpacity={0.2}
          />
        )}

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
