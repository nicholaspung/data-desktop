export interface BloodMarker {
  id: string;
  name: string;
  category: string;
  unit?: string;
  description?: string;
  lower_reference?: number;
  upper_reference?: number;
  general_reference?: string;
  optimal_low?: number;
  optimal_high?: number;
  optimal_general?: string;
}

export interface BloodTestData {
  id: string;
  date: string;
  fasted: boolean;
  lab_name?: string;
  notes?: string;
}

export interface BloodResult {
  id: string;
  blood_test_id: string;
  blood_marker_id: string;
  value_number: number;
  value_text?: string;
  notes?: string;
  blood_test_id_data?: BloodTestData;
  blood_marker_id_data?: BloodMarker;
}

export interface ChartDataPoint {
  date: string;
  value: number;
  inOptimalRange: boolean;
}
