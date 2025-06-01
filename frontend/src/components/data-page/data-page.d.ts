export interface DatasetConfig {
  id: DataStoreName;
  title: string;
  description?: string;
  fields: FieldDefinition[];
  icon?: React.ReactNode;
  addLabel?: string;
  customTabs?: any[];
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
  position?: "before" | "after";
}
