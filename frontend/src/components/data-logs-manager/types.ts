import { FieldDefinition } from "@/types/types";

export interface DataLogsManagerProps<T extends Record<string, any>> {
  logs: T[];
  fieldDefinitions: FieldDefinition[];
  datasetId: string;
  onUpdate?: () => void;
  title?: string;

  formatters?: {
    [key: string]: (value: any, record: T) => string | React.ReactNode;
  };
  sortableFields?: string[];
  filterableFields?: string[];
  defaultSortField?: string;
  defaultSortOrder?: "asc" | "desc";
  compactFields?: string[];
  primaryField?: string;
  amountField?: string;
  dateField?: string;
  badgeFields?: string[];
  tagFields?: string[];
  hideFields?: string[];
}

export interface EditDialogProps<T extends Record<string, any>> {
  record: T | null;
  fieldDefinitions: FieldDefinition[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (updatedRecord: Partial<T>) => void;
  onCancel: () => void;
}
