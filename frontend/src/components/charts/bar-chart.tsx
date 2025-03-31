// src/components/charts/bar-chart.tsx
import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from "recharts";
import { COLORS } from "@/lib/date-utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface DataPoint {
  [key: string]: any;
}

export interface BarConfig {
  dataKey: string;
  name?: string;
  color?: string;
  unit?: string;
  stackId?: string;
  barSize?: number;
  colorByValue?: boolean;
  getColorByValue?: (value: number) => string;
}

export interface ReferenceLineConfig {
  y?: number;
  x?: number | string;
  label: string;
  color?: string;
}

export interface CustomBarChartProps {
  data: DataPoint[];
  bars: BarConfig[];
  xAxisKey: string;
  yAxisUnit?: string;
  yAxisDomain?: [number | string, number | string];
  title?: string;
  description?: string;
  tooltipFormatter?: (value: any, name: string, props: any) => React.ReactNode;
  height?: number;
  layout?: "horizontal" | "vertical";
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

// Default function to get colors based on values (for heat maps and similar visualizations)
const defaultGetColorByValue = (value: number) => {
  if (value < 10) return "#82ca9d"; // Low - Green
  if (value < 20) return "#8884d8"; // Medium-Low - Purple
  if (value < 30) return "#ffc658"; // Medium - Yellow
  if (value < 40) return "#ff8042"; // Medium-High - Orange
  return "#d32f2f"; // High - Red
};

export default function CustomBarChart({
  data,
  bars,
  xAxisKey,
  yAxisUnit = "",
  yAxisDomain = [0, "auto"],
  title,
  description,
  tooltipFormatter = defaultFormatter,
  height = 400,
  layout = "horizontal",
  referenceLines = [],
  className,
}: CustomBarChartProps) {
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
            <BarChart
              data={data}
              layout={layout}
              margin={{
                top: 20,
                right: 30,
                left: layout === "vertical" ? 40 : 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />

              {layout === "horizontal" ? (
                <>
                  <XAxis dataKey={xAxisKey} />
                  <YAxis unit={yAxisUnit} domain={yAxisDomain} />
                </>
              ) : (
                <>
                  <XAxis type="number" domain={yAxisDomain} unit={yAxisUnit} />
                  <YAxis dataKey={xAxisKey} type="category" width={100} />
                </>
              )}

              <Tooltip
                content={(props) => (
                  <CustomTooltip {...props} formatter={tooltipFormatter} />
                )}
              />
              <Legend />

              {bars.map((bar, index) => (
                <Bar
                  key={`bar-${bar.dataKey}`}
                  dataKey={bar.dataKey}
                  name={bar.name || bar.dataKey}
                  fill={bar.color || COLORS[index % COLORS.length]}
                  unit={bar.unit || ""}
                  stackId={bar.stackId}
                  barSize={bar.barSize || 20}
                  radius={[4, 4, 0, 0]}
                >
                  {bar.colorByValue &&
                    data.map((entry, i) => (
                      <Cell
                        key={`cell-${i}`}
                        fill={(bar.getColorByValue || defaultGetColorByValue)(
                          entry[bar.dataKey]
                        )}
                      />
                    ))}
                </Bar>
              ))}

              {referenceLines.map((refLine, index) => (
                <ReferenceLine
                  key={`ref-line-${index}`}
                  y={refLine.y}
                  x={refLine.x}
                  stroke={refLine.color || "red"}
                  strokeDasharray="3 3"
                  label={{
                    value: refLine.label,
                    position: "insideBottomRight",
                  }}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
