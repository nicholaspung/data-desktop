export interface DatasetSummary {
  id: string;
  name: string;
  count: number;
  icon: React.ReactNode;
  href: string;
  lastUpdated: string | null;
}

export type FieldType =
  | "date"
  | "boolean"
  | "number"
  | "percentage"
  | "text"
  | "select-single"
  | "select-multiple"
  | "markdown"
  | "tags"
  | "image";

export interface SelectOption {
  id: string;
  label: string;
}

export interface ColumnMeta {
  type: FieldType;
  unit?: string;
  description?: string;
  isSearchable?: boolean;

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

  isRelation?: boolean;
  relatedDataset?: string;
  relatedField?: string;
  displayField?: string;
  displayFieldType?: FieldType;
  secondaryDisplayField?: string;
  secondaryDisplayFieldType?: FieldType;

  options?: SelectOption[];
}

export type DatasetType = "dexa" | "bloodwork";

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
