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
  y?: number;
  x?: number | string;
  label: string;
  color?: string;
  yAxisId?: string;
}

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

export interface PieDataPoint {
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

export interface RadarDataPoint {
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
