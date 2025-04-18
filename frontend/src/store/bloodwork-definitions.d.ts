// Types for Bloodwork data

// Main Bloodwork Test information
export interface BloodworkTest {
  date: Date;
  fasted: boolean;
  lab_name?: string;
  notes?: string;

  // Metadata fields
  id: string;
  createdAt?: Date;
  lastModified?: Date;
}

// Blood Marker definitions
export interface BloodMarker {
  name: string;
  unit?: string;
  lower_reference?: number;
  upper_reference?: number;
  general_reference?: string;
  description?: string;
  category: string;
  optimal_low?: number;
  optimal_high?: number;
  optimal_general?: string;

  // Metadata fields
  id: string;
  createdAt?: Date;
  lastModified?: Date;
}

// Individual blood test results
export interface BloodResult {
  blood_test_id: string;
  blood_marker_id: string;
  value_number?: number;
  value_text?: string;
  notes?: string;

  // Relation data that might be added when fetched
  blood_test_id_data?: BloodworkTest;
  blood_marker_id_data?: BloodMarker;

  // Metadata fields
  id: string;
  createdAt?: Date;
  lastModified?: Date;
}

// Combined blood test with all results and markers (for display purposes)
export interface BloodworkWithResults {
  test: BloodworkTest;
  results: Array<BloodResult & { marker?: BloodMarker }>;
}

// Partial types for form handling and updates
export type PartialBloodworkTest = Partial<BloodworkTest>;
export type PartialBloodMarker = Partial<BloodMarker>;
export type PartialBloodResult = Partial<BloodResult>;

// Input types for creating new records (without metadata)
export type BloodworkTestInput = Omit<
  BloodworkTest,
  "id" | "createdAt" | "lastModified"
>;
export type BloodMarkerInput = Omit<
  BloodMarker,
  "id" | "createdAt" | "lastModified"
>;
export type BloodResultInput = Omit<
  BloodResult,
  | "id"
  | "createdAt"
  | "lastModified"
  | "blood_test_id_data"
  | "blood_marker_id_data"
>;

// Type for valid keys in each model
export type BloodworkTestKey = keyof BloodworkTest;
export type BloodMarkerKey = keyof BloodMarker;
export type BloodResultKey = keyof BloodResult;

// Enum for common blood marker categories
export enum BloodMarkerCategory {
  LIPIDS = "Lipids",
  METABOLIC = "Metabolic",
  THYROID = "Thyroid",
  INFLAMMATION = "Inflammation",
  VITAMINS = "Vitamins",
  HORMONES = "Hormones",
  ELECTROLYTES = "Electrolytes",
  LIVER = "Liver",
  KIDNEY = "Kidney",
  BLOOD_CELLS = "Blood Cells",
  OTHER = "Other",
}
