// src/components/charts/composed-chart.tsx
import React from "react";
import {
  ComposedChart as RechartsComposedChart,
  Line,
  Bar,
  Area,
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

// Define the curve types accepted by Recharts
type CurveType =
  | "basis"
  | "basisClosed"
  | "basisOpen"
  | "linear"
  | "linearClosed"
  | "natural"
  | "monotoneX"
  | "monotoneY"
  | "monotone"
  | "step"
  | "stepBefore"
  | "stepAfter";

export interface DataPoint {
  [key: string]: any;
}

export interface ChartElement {
  type: "line" | "bar" | "area";
  dataKey: string;
  name?: string;
  color?: string;
  unit?: string;
  stackId?: string;
  barSize?: number;
  opacity?: number;
  strokeWidth?: number;
  activeDot?: boolean | object;
  connectNulls?: boolean;
  yAxisId?: string;
  curveType?: CurveType;
}

export interface ReferenceLineConfig {
  y?: number;
  x?: number | string;
  label: string;
  color?: string;
  yAxisId?: string;
}

export interface CustomComposedChartProps {
  data: DataPoint[];
  elements: ChartElement[];
  xAxisKey: string;
  yAxisUnit?: string;
  yAxisDomain?: [number | string, number | string];
  title?: string;
  description?: string;
  tooltipFormatter?: (value: any, name: string, props: any) => React.ReactNode;
  height?: number;
  referenceLines?: ReferenceLineConfig[];
  // Dual y-axis support
  secondYAxis?: {
    unit?: string;
    domain?: [number | string, number | string];
    orientation?: "left" | "right";
  };
  syncId?: string;
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

export default function CustomComposedChart({
  data,
  elements,
  xAxisKey,
  yAxisUnit = "",
  yAxisDomain = [0, "auto"],
  title,
  description,
  tooltipFormatter = defaultFormatter,
  height = 400,
  referenceLines = [],
  secondYAxis,
  syncId,
  className,
}: CustomComposedChartProps) {
  const renderElement = (element: ChartElement, index: number) => {
    const commonProps = {
      key: `element-${element.dataKey}`,
      dataKey: element.dataKey,
      name: element.name || element.dataKey,
      unit: element.unit || "",
      yAxisId: element.yAxisId || "left",
    };

    switch (element.type) {
      case "line":
        return (
          <Line
            {...commonProps}
            type={element.curveType || "monotone"}
            stroke={element.color || COLORS[index % COLORS.length]}
            strokeWidth={element.strokeWidth || 2}
            activeDot={element.activeDot || { r: 6 }}
            connectNulls={element.connectNulls || false}
          />
        );
      case "bar":
        return (
          <Bar
            {...commonProps}
            fill={element.color || COLORS[(index + 2) % COLORS.length]}
            stackId={element.stackId}
            barSize={element.barSize || 20}
          />
        );
      case "area":
        return (
          <Area
            {...commonProps}
            type={element.curveType || "monotone"}
            fill={element.color || COLORS[(index + 4) % COLORS.length]}
            stroke={element.color || COLORS[(index + 4) % COLORS.length]}
            fillOpacity={element.opacity || 0.2}
            stackId={element.stackId}
          />
        );
      default:
        return null;
    }
  };

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
            <RechartsComposedChart
              data={data}
              margin={{
                top: 20,
                right: secondYAxis ? 30 : 20,
                left: 20,
                bottom: 5,
              }}
              syncId={syncId}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={xAxisKey} />
              <YAxis
                yAxisId="left"
                unit={yAxisUnit}
                domain={yAxisDomain as [number, number | string]}
                orientation="left"
              />

              {secondYAxis && (
                <YAxis
                  yAxisId="right"
                  unit={secondYAxis.unit || ""}
                  domain={secondYAxis.domain || [0, "auto"]}
                  orientation={secondYAxis.orientation || "right"}
                />
              )}

              <Tooltip
                content={(props) => (
                  <CustomTooltip {...props} formatter={tooltipFormatter} />
                )}
              />
              <Legend />

              {elements.map(renderElement)}

              {referenceLines.map((refLine, index) => (
                <ReferenceLine
                  key={`ref-line-${index}`}
                  y={refLine.y}
                  x={refLine.x}
                  stroke={refLine.color || "red"}
                  strokeDasharray="3 3"
                  yAxisId={refLine.yAxisId || "left"}
                  label={{
                    value: refLine.label,
                    position: "insideBottomRight",
                  }}
                />
              ))}
            </RechartsComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
