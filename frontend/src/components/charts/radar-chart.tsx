// src/components/charts/radar-chart.tsx
import React from "react";
import {
  RadarChart as RechartsRadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { COLORS } from "@/lib/date-utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface DataPoint {
  subject: string;
  [key: string]: any;
}

export interface RadarConfig {
  dataKey: string;
  name?: string;
  fill?: string;
  stroke?: string;
  fillOpacity?: number;
}

export interface CustomRadarChartProps {
  data: DataPoint[];
  radars: RadarConfig[];
  title?: string;
  description?: string;
  tooltipFormatter?: (value: any, name: string, props?: any) => React.ReactNode;
  height?: number;
  width?: number;
  outerRadius?: number;
  polarRadiusProps?: {
    angle?: number;
    domain?: [number | string, number | string];
    orientation?: "left" | "right" | "middle";
  };
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
            : `${entry.value?.toFixed(2) || 0}`;

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
const defaultFormatter = (value: any, name: string) => {
  let displayValue = value?.toFixed(2) || 0;

  // Special handling for percentage values
  if (
    name.toLowerCase().includes("percentage") ||
    name.toLowerCase().includes("%")
  ) {
    displayValue = `${displayValue}%`;
  }

  return displayValue;
};

export default function CustomRadarChart({
  data,
  radars,
  title,
  description,
  tooltipFormatter = defaultFormatter,
  height = 400,
  width,
  outerRadius = 150,
  polarRadiusProps = {
    angle: 30,
    domain: [0, "auto"],
    orientation: "left",
  },
  className,
}: CustomRadarChartProps) {
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
        <div
          style={{
            height: `${height}px`,
            width: width ? `${width}px` : "100%",
          }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <RechartsRadarChart outerRadius={outerRadius} data={data}>
              <PolarGrid />
              <PolarAngleAxis dataKey="subject" />
              <PolarRadiusAxis
                angle={polarRadiusProps.angle}
                domain={polarRadiusProps.domain}
                orientation={polarRadiusProps.orientation}
              />

              {radars.map((radar, index) => (
                <Radar
                  key={`radar-${radar.dataKey}`}
                  name={radar.name || radar.dataKey}
                  dataKey={radar.dataKey}
                  stroke={radar.stroke || COLORS[index % COLORS.length]}
                  fill={radar.fill || COLORS[index % COLORS.length]}
                  fillOpacity={radar.fillOpacity || 0.6}
                />
              ))}

              <Tooltip
                content={(props) => (
                  <CustomTooltip {...props} formatter={tooltipFormatter} />
                )}
              />
              <Legend />
            </RechartsRadarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
