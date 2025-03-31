// src/components/charts/index.ts
export { default as LineChart } from "./line-chart";
export { default as BarChart } from "./bar-chart";
export { default as PieChart } from "./pie-chart";
export { default as RadarChart } from "./radar-chart";
export { default as ComposedChart } from "./composed-chart";

export * from "./chart-utils";

// Also export the types
export type {
  DataPoint as LineChartDataPoint,
  LineConfig,
  ReferenceLineConfig as LineReferenceConfig,
  CustomLineChartProps,
} from "./line-chart";

export type {
  DataPoint as BarChartDataPoint,
  BarConfig,
  ReferenceLineConfig as BarReferenceConfig,
  CustomBarChartProps,
} from "./bar-chart";

export type {
  DataPoint as PieChartDataPoint,
  PieConfig,
  CustomPieChartProps,
} from "./pie-chart";

export type {
  DataPoint as RadarChartDataPoint,
  RadarConfig,
  CustomRadarChartProps,
} from "./radar-chart";

export type {
  DataPoint as ComposedChartDataPoint,
  ChartElement,
  ReferenceLineConfig as ComposedReferenceConfig,
  CustomComposedChartProps,
} from "./composed-chart";
