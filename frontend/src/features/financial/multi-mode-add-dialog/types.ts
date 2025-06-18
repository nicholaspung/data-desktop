import { FieldDefinition } from "@/types/types";

export type AddMode = "single" | "multiple" | "bulk";

export interface MultiModeAddDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  datasetId: string;
  fieldDefinitions: FieldDefinition[];
  onSuccess?: () => void;
  recentEntries?: any[];
  existingEntries?: any[];
  formatters?: {
    [key: string]: (value: any, record: any) => string | React.ReactNode;
  };
  availableModes?: AddMode[];
}

export interface MultiEntryRow {
  id: string;
  data: Record<string, any>;
  isValid: boolean;
  errors: Record<string, string>;
}
