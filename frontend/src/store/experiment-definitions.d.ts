// Types for Experiment tracking system

// Main Experiment definition
export interface Experiment {
  name: string;
  description?: string;
  start_date: Date;
  end_date?: Date;
  goal: string;
  status: ExperimentStatus;

  // Metadata fields
  id?: string;
  createdAt?: Date;
  lastModified?: Date;
}

// Enum for experiment status
export enum ExperimentStatus {
  ACTIVE = "active",
  PAUSED = "paused",
  COMPLETED = "completed",
}

// Metric definition
export interface Metric {
  name: string;
  description?: string;
  type: MetricType;
  unit?: string;
  default_value: string; // JSON-encoded default value
  category_id: string;
  active: boolean;
  private: boolean;

  // Relation data that might be added when fetched
  category_id_data?: MetricCategory;

  // Metadata fields
  id?: string;
  createdAt?: Date;
  lastModified?: Date;
}

// Enum for metric types
export enum MetricType {
  NUMBER = "number",
  BOOLEAN = "boolean",
  TIME = "time",
  PERCENTAGE = "percentage",
  TEXT = "text",
}

// Daily Log entry
export interface DailyLog {
  date: Date;
  metric_id: string;
  experiment_id?: string;
  value: string; // JSON-encoded value
  notes?: string;

  // Relation data that might be added when fetched
  metric_id_data?: Metric;
  experiment_id_data?: Experiment;

  // Metadata fields
  id?: string;
  createdAt?: Date;
  lastModified?: Date;
}

// Metric Category
export interface MetricCategory {
  name: string;

  // Metadata fields
  id?: string;
  createdAt?: Date;
  lastModified?: Date;
}

// Experiment Metric mapping (with targets)
export interface ExperimentMetric {
  experiment_id: string;
  metric_id: string;
  target: string; // JSON-encoded target value
  target_type: TargetType;
  importance: number; // 1-10 scale

  // Relation data
  experiment_id_data?: Experiment;
  metric_id_data?: Metric;

  // Metadata fields
  id?: string;
  createdAt?: Date;
  lastModified?: Date;
}

// Enum for target evaluation types
export enum TargetType {
  AT_LEAST = "atleast",
  AT_MOST = "atmost",
  EXACTLY = "exactly",
  BOOLEAN = "boolean",
}

// Extended type for metrics with their current log values
export interface MetricWithLog extends Metric {
  log: DailyLog | null;
  value: any; // Parsed value
  notes: string;
  hasChanged: boolean;
}

// Partial types for form handling and updates
export type PartialExperiment = Partial<Experiment>;
export type PartialMetric = Partial<Metric>;
export type PartialDailyLog = Partial<DailyLog>;
export type PartialMetricCategory = Partial<MetricCategory>;
export type PartialExperimentMetric = Partial<ExperimentMetric>;

// Input types for creating new records (without metadata)
export type ExperimentInput = Omit<
  Experiment,
  "id" | "createdAt" | "lastModified"
>;
export type MetricInput = Omit<
  Metric,
  "id" | "createdAt" | "lastModified" | "category_id_data"
>;
export type DailyLogInput = Omit<
  DailyLog,
  "id" | "createdAt" | "lastModified" | "metric_id_data" | "experiment_id_data"
>;
export type MetricCategoryInput = Omit<
  MetricCategory,
  "id" | "createdAt" | "lastModified"
>;
export type ExperimentMetricInput = Omit<
  ExperimentMetric,
  "id" | "createdAt" | "lastModified" | "experiment_id_data" | "metric_id_data"
>;

// Type for tracking progress data
export interface ExperimentProgress {
  overall: number;
  byMetric: Record<string, number>;
  completionRate: Record<string, number>;
}

// Type for chart data points
export interface CompletionChartDataPoint {
  date: string;
  displayDate: string;
  completionRate: number;
  logCount: number;
}

export interface MetricChartDataPoint {
  date: string;
  displayDate: string;
  [metricName: string]: any;
}

export interface PieChartDataPoint {
  name: string;
  value: number;
  color: string;
}
