export interface DatasetConfig {
  id: DataStoreName;
  title: string;
  description?: string;
  fields: FieldDefinition[];
  icon?: React.ReactNode;
  addLabel?: string;
  customTabs?: any[]; // Using any for brevity, but you can define the full type from GenericDataPage
  disableBatchEntry?: boolean;
  disableTableView?: boolean;
  disableAddForm?: boolean;
  defaultTab?: string;
}

export interface CustomTab {
  id: string;
  label: string;
  icon?: React.ReactElement;
  content: React.ReactNode;
  position?: "before" | "after"; // Position relative to standard tabs
}
