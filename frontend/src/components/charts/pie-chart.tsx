// src/components/charts/pie-chart.tsx
import React from "react";
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieLabel,
} from "recharts";
import { COLORS } from "@/lib/date-utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface DataPoint {
  name: string;
  value: number;
  color?: string;
  [key: string]: any;
}

export interface PieConfig {
  dataKey: string;
  nameKey: string;
  innerRadius?: number;
  outerRadius?: number;
  cornerRadius?: number;
  startAngle?: number;
  endAngle?: number;
  paddingAngle?: number;
  minAngle?: number;
  label?: boolean | React.ReactElement | ((props: any) => React.ReactNode);
}

export interface CustomPieChartProps {
  data: DataPoint[];
  pieConfig: PieConfig;
  title?: string;
  description?: string;
  tooltipFormatter?: (value: any, name: string, props: any) => React.ReactNode;
  height?: number;
  width?: number;
  valueUnit?: string;
  useCustomColors?: boolean;
  className?: string;
}

// Custom tooltip component with better styling
const CustomTooltip = ({ active, payload, formatter, valueUnit }: any) => {
  if (active && payload && payload.length) {
    const entry = payload[0]; // Pie chart typically has one entry per tooltip

    const displayValue = formatter
      ? formatter(entry.value, entry.name, entry.payload)
      : valueUnit
        ? `${entry.value?.toFixed(2) || 0} ${valueUnit}`
        : entry.value?.toFixed(2) || 0;

    return (
      <div className="bg-background border p-2 rounded shadow-sm">
        <p className="font-bold" style={{ color: entry.color }}>
          {entry.name}
        </p>
        <p>{displayValue}</p>
      </div>
    );
  }
  return null;
};

// Default formatter for tooltip values
const defaultFormatter = (value: any, valueUnit?: string) => {
  const displayValue = value?.toFixed(2) || 0;

  if (valueUnit) {
    return `${displayValue} ${valueUnit}`;
  }

  return displayValue;
};

// Default label renderer
const renderCustomizedLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
  name,
}: any): React.ReactNode => {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return percent > 0.05 ? (
    <text
      x={x}
      y={y}
      fill="currentColor"
      textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central"
      fontSize={12}
    >
      {`${name}: ${(percent * 100).toFixed(1)}%`}
    </text>
  ) : null;
};

export default function CustomPieChart({
  data,
  pieConfig,
  title,
  description,
  tooltipFormatter,
  height = 400,
  width,
  valueUnit = "",
  useCustomColors = false,
  className,
}: CustomPieChartProps) {
  // Default formatter that includes the value unit if provided
  const defaultFormatterWithUnit = (value: any, name: string) =>
    defaultFormatter(value, name);

  // Handle label prop correctly for Recharts Pie component
  const getLabelProp = (): boolean | PieLabel<any> | undefined => {
    if (pieConfig.label === undefined) {
      return renderCustomizedLabel as PieLabel<any>;
    }

    if (typeof pieConfig.label === "boolean") {
      return pieConfig.label;
    }

    if (typeof pieConfig.label === "function") {
      return pieConfig.label as PieLabel<any>;
    }

    // React element case - we can't directly use React elements in Pie label prop
    // so we'd need to create a function that returns the element
    return renderCustomizedLabel as PieLabel<any>;
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
        <div
          style={{
            height: `${height}px`,
            width: width ? `${width}px` : "100%",
          }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <RechartsPieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                dataKey={pieConfig.dataKey}
                nameKey={pieConfig.nameKey}
                innerRadius={pieConfig.innerRadius || 0}
                outerRadius={pieConfig.outerRadius || 150}
                cornerRadius={pieConfig.cornerRadius}
                startAngle={pieConfig.startAngle || 0}
                endAngle={pieConfig.endAngle || 360}
                paddingAngle={pieConfig.paddingAngle || 0}
                minAngle={pieConfig.minAngle || 5}
                label={getLabelProp()}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      useCustomColors && entry.color
                        ? entry.color
                        : COLORS[index % COLORS.length]
                    }
                  />
                ))}
              </Pie>
              <Tooltip
                content={(props) => (
                  <CustomTooltip
                    {...props}
                    formatter={tooltipFormatter || defaultFormatterWithUnit}
                    valueUnit={valueUnit}
                  />
                )}
              />
              <Legend />
            </RechartsPieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
