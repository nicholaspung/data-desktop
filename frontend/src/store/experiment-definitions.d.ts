// Types for Experiment tracking system

// Main Experiment definition
export interface Experiment {
  name: string;
  description?: string;
  start_date: Date;
  end_date?: Date;
  goal: string;
  status: "active" | "paused" | "completed";
  private: boolean;
  start_state: string;
  end_state: string;
  starting_images?: string[];
  ending_images?: string[];

  // Metadata fields
  id: string;
  createdAt?: Date;
  lastModified?: Date;
}

// Metric definition
export interface Metric {
  id: string;
  name: string;
  description: string;
  type: "number" | "boolean" | "time" | "percentage" | "text";
  unit?: string;
  default_value: string;
  category_id: string;
  category_id_data?: {
    name: string;
    color: string;
  };
  active: boolean;
  private: boolean;
  // New goal fields
  goal_value?: string;
  goal_type?: string;
  // New scheduling fields
  schedule_start_date?: Date | null; // When to start showing this metric
  schedule_end_date?: Date | null; // When to stop showing this metric
  schedule_days?: number[]; // Days of week to show (0=Sunday, 6=Saturday)
  schedule_frequency?: "daily" | "weekly" | "interval" | "custom"; // How often to show
  // New interval scheduling fields
  schedule_interval_value?: number;
  schedule_interval_unit?: "days" | "weeks" | "months";
  schedule_last_occurrence?: Date | null;
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
  goal_value?: string; // New field for goal value
  goal_type?: string; // How to interpret the goal (min, max, exact)

  // Relation data that might be added when fetched
  metric_id_data?: Metric;
  experiment_id_data?: Experiment;

  // Metadata fields
  id: string;
  createdAt?: Date;
  lastModified?: Date;
}

// Metric Category
export interface MetricCategory {
  name: string;

  // Metadata fields
  id: string;
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

  private: boolean;

  // Metadata fields
  id: string;
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
  goal_value?: any; // Parsed goal value
  goal_type?: GoalType; // How to interpret the goal
}

// Enum for goal types
export enum GoalType {
  MINIMUM = "minimum",
  MAXIMUM = "maximum",
  EXACT = "exact",
  BOOLEAN = "boolean", // For yes/no metrics
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
