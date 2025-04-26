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
import ReusableCard from "@/components/reusable/reusable-card";
import { ChartElement, DataPoint, ReferenceLineConfig } from "./charts";
import { CustomTooltip } from "./custom-tooltip";
import { defaultFormatter } from "./chart-utils";

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
}: {
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
  secondYAxis?: {
    unit?: string;
    domain?: [number | string, number | string];
    orientation?: "left" | "right";
  };
  syncId?: string;
  className?: string;
}) {
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
    <ReusableCard
      showHeader={!!title}
      title={title}
      description={
        description && <p className="text-muted-foreground">{description}</p>
      }
      cardClassName={className}
      content={
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
      }
    />
  );
}
