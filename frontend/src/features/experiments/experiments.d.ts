// Type definitions
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
}

export interface MetricWithLog extends Metric {
  log: DailyLog | null;
  value: any;
  notes: string;
  hasChanged: boolean;
}

export interface Experiment {
  id: string;
  name: string;
  description: string;
  start_date: Date;
  end_date?: Date;
  goal: string;
  status: "active" | "completed" | "paused";
}

export interface DailyLog {
  id: string;
  date: Date;
  metric_id: string;
  experiment_id?: string;
  value: string;
  notes?: string;
}

// Type for experiment metric
export interface ExperimentMetric {
  id: string;
  experiment_id: string;
  metric_id: string;
  metric_id_data?: any;
  target: string; // JSON stringified target value
  target_type: "atleast" | "atmost" | "exactly" | "boolean";
  importance: number; // 1-10 scale
}
