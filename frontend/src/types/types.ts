export interface DatasetSummary {
  id: string;
  name: string;
  count: number;
  icon: React.ReactNode;
  href: string;
  lastUpdated: string | null;
}

// Define data types for our table
export type FieldType =
  | "date"
  | "boolean"
  | "number"
  | "percentage"
  | "text"
  | "select-single"
  | "select-multiple";

export interface SelectOption {
  id: string;
  label: string;
}

export interface ColumnMeta {
  type: FieldType;
  unit?: string;
  description?: string;
  isSearchable?: boolean;
  // Add relation-specific properties
  isRelation?: boolean;
  relatedDataset?: string;
  displayField?: string;
  secondaryDisplayField?: string;
}

export interface FieldDefinition {
  key: string;
  type: FieldType;
  displayName: string;
  description?: string;
  unit?: string;
  isSearchable?: boolean;
  isOptional?: boolean;
  // New relationship fields
  isRelation?: boolean;
  relatedDataset?: string;
  relatedField?: string;
  displayField?: string;
  displayFieldType?: FieldType;
  secondaryDisplayField?: string;
  secondaryDisplayFieldType?: FieldType;
  // New select field properties
  options?: SelectOption[];
}

export type DatasetType = "dexa" | "bloodwork";

// Interface for the store state
export interface FieldDefinitionsState {
  datasets: {
    [key: string]: FieldDefinitionsDataset;
  };
}

export type FieldDefinitionsDataset = {
  id: string;
  name: string;
  description?: string;
  fields: FieldDefinition[];
};
