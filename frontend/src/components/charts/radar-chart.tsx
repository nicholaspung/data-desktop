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
import ReusableCard from "@/components/reusable/reusable-card";
import { CustomTooltip } from "./custom-tooltip";
import { defaultFormatter } from "./chart-utils";
import { RadarConfig, RadarDataPoint } from "./charts";

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
}: {
  data: RadarDataPoint[];
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
}) {
  return (
    <ReusableCard
      showHeader={!!title}
      title={title}
      description={
        description && <p className="text-muted-foreground">{description}</p>
      }
      cardClassName={className}
      content={
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
      }
    />
  );
}
