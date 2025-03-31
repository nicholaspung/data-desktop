// src/components/charts/line-chart.tsx
import React from "react";
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
import { COLORS } from "@/lib/date-utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface DataPoint {
  [key: string]: any;
}

export interface LineConfig {
  dataKey: string;
  name?: string;
  color?: string;
  unit?: string;
  strokeWidth?: number;
  type?: "monotone" | "linear" | "step" | "basis" | "natural";
  activeDot?: boolean | object;
  connectNulls?: boolean;
}

export interface ReferenceLineConfig {
  y: number;
  label: string;
  color?: string;
}

export interface CustomLineChartProps {
  data: DataPoint[];
  lines: LineConfig[];
  xAxisKey: string;
  yAxisUnit?: string;
  yAxisDomain?: [number | string, number | string];
  title?: string;
  description?: string;
  tooltipFormatter?: (value: any, name: string, props: any) => React.ReactNode;
  height?: number;
  referenceLines?: ReferenceLineConfig[];
  className?: string;
}

// Custom tooltip component with better styling
const CustomTooltip = ({ active, payload, label, formatter }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border p-2 rounded shadow-sm">
        <p className="font-bold">{label}</p>
        {payload.map((entry: any, index: number) => {
          const displayValue = formatter
            ? formatter(entry.value, entry.name, entry.payload)
            : `${entry.value?.toFixed(2) || 0} ${entry.unit || ""}`;

          return (
            <p key={`item-${index}`} style={{ color: entry.color }}>
              {entry.name}: {displayValue}
            </p>
          );
        })}
      </div>
    );
  }
  return null;
};

// Default formatter for tooltip values
const defaultFormatter = (value: any, name: string, props: any) => {
  let displayValue = value?.toFixed(2) || 0;
  const unit = props.unit || "";

  // Special handling for percentage values
  if (
    name.toLowerCase().includes("percentage") ||
    name.toLowerCase().includes("%")
  ) {
    displayValue = `${displayValue}%`;
  } else if (unit) {
    displayValue = `${displayValue} ${unit}`;
  }

  return displayValue;
};

export default function CustomLineChart({
  data,
  lines,
  xAxisKey,
  yAxisUnit = "",
  yAxisDomain = [0, "auto"],
  title,
  description,
  tooltipFormatter = defaultFormatter,
  height = 400,
  referenceLines = [],
  className,
}: CustomLineChartProps) {
  return (
    <Card className={cn("", className)}>
      {title && (
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && (
            <p className="text-muted-foreground">{description}</p>
          )}
        </CardHeader>
      )}
      <CardContent>
        <div style={{ height: `${height}px` }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={xAxisKey} />
              <YAxis unit={yAxisUnit} domain={yAxisDomain} />
              <Tooltip
                content={(props) => (
                  <CustomTooltip {...props} formatter={tooltipFormatter} />
                )}
              />
              <Legend />

              {lines.map((line, index) => (
                <Line
                  key={`line-${line.dataKey}`}
                  type={line.type || "monotone"}
                  dataKey={line.dataKey}
                  name={line.name || line.dataKey}
                  stroke={line.color || COLORS[index % COLORS.length]}
                  unit={line.unit || ""}
                  strokeWidth={line.strokeWidth || 2}
                  activeDot={line.activeDot || { r: 6 }}
                  connectNulls={line.connectNulls || false}
                />
              ))}

              {referenceLines.map((refLine, index) => (
                <ReferenceLine
                  key={`ref-line-${index}`}
                  y={refLine.y}
                  stroke={refLine.color || "red"}
                  strokeDasharray="3 3"
                  label={{
                    value: refLine.label,
                    position: "insideBottomRight",
                  }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
