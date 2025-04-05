import "@tanstack/react-table";

// Augment the TanStack table types to include our custom metadata
declare module "@tanstack/react-table" {
  interface ColumnMeta {
    // Add your custom properties here
    isRelation?: boolean;
    relatedDataset?: string;
    displayField?: string;
    secondaryDisplayField?: string;
    type?: string;
    unit?: string;
    description?: string;
    isSearchable?: boolean;
  }
}
