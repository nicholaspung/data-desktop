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
import { DataPoint, LineConfig, ReferenceLineConfig } from "./charts";
import { CustomTooltip } from "./custom-tooltip";
import { defaultFormatter } from "./chart-utils";

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
}: {
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
}) {
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
