import "@tanstack/react-table";

declare module "@tanstack/react-table" {
  interface ColumnMeta {
    isRelation?: boolean;
    relatedDataset?: string;
    displayField?: string;
    secondaryDisplayField?: string;
    type?: string;
    unit?: string;
    description?: string;
    isSearchable?: boolean;
    options?: { id: string; label: string }[];
  }
}
