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
