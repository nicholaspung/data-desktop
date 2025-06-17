import { FieldDefinition } from "@/types/types";

export interface DataLogsManagerProps<T extends Record<string, any>> {
  logs: T[];
  fieldDefinitions: FieldDefinition[];
  onUpdate?: () => void;
  title?: string;
  
  // Optional customization props
  formatters?: {
    [key: string]: (value: any, record: T) => string | React.ReactNode;
  };
  sortableFields?: string[];
  filterableFields?: string[];
  defaultSortField?: string;
  defaultSortOrder?: "asc" | "desc";
  compactFields?: string[]; // Fields to show in compact mode
  primaryField?: string; // Main field to display prominently
  amountField?: string; // Field to format as currency
  dateField?: string; // Field to use for date display
  badgeFields?: string[]; // Fields to display as badges
  tagFields?: string[]; // Fields to display as tag lists
  hideFields?: string[]; // Fields to hide from display
}

export interface EditDialogProps<T extends Record<string, any>> {
  record: T | null;
  fieldDefinitions: FieldDefinition[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (updatedRecord: Partial<T>) => void;
  onCancel: () => void;
}