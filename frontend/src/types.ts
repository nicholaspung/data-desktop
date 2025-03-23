export interface DatasetSummary {
  id: string;
  name: string;
  count: number;
  icon: React.ReactNode;
  href: string;
  lastUpdated: string | null;
}

// Define data types for our table
export type FieldType = "date" | "boolean" | "number" | "percentage" | "text";

export interface ColumnMeta {
  type: FieldType;
  unit?: string;
  description?: string;
  isSearchable?: boolean;
}

export interface FieldDefinition {
  key: string;
  type: FieldType;
  displayName: string;
  description?: string;
  unit?: string;
  isSearchable?: boolean;
}

export type DatasetType = "dexa" | "bloodwork" | "paycheck" | "habit";
