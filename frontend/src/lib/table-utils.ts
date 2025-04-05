// src/lib/table-utils.ts
import { ColumnMeta, FieldDefinition } from "@/types/types";
import { ColumnDef } from "@tanstack/react-table";
import { getFilterFunctionForField } from "./table-filter-utils";

// Function to format cell values based on type
export const formatCellValue = (value: any, meta?: ColumnMeta) => {
  if (value === null || value === undefined) return "—";

  if (!meta) return value;

  switch (meta.type) {
    case "date":
      return value instanceof Date
        ? value.toLocaleDateString()
        : new Date(value).toLocaleDateString();
    case "boolean":
      return value ? "Yes" : "No";
    case "number":
      return typeof value === "number"
        ? `${value.toLocaleString()}${meta.unit ? ` ${meta.unit}` : ""}`
        : value;
    case "percentage":
      return typeof value === "number"
        ? `${(value * 100).toLocaleString()}%`
        : value;
    case "text":
    default:
      return value;
  }
};

// Helper function to create column definitions with proper rendering and filtering based on field type
export function createColumn<TData, TValue = any>(
  accessorKey: keyof TData,
  header: string,
  meta: ColumnMeta,
  field?: FieldDefinition // Optional field definition for advanced features
): ColumnDef<TData, TValue> {
  const column: ColumnDef<TData, TValue> = {
    accessorKey: accessorKey as string,
    header,
    meta,
    cell: ({ cell }) => {
      const value = cell.getValue();
      return formatCellValue(value, meta);
    },
  };

  // Add filtering capability if a field definition is provided
  if (field) {
    // If the field is searchable, add filter function
    if (field.isSearchable) {
      column.filterFn = getFilterFunctionForField(field);

      // Enable filtering only for searchable fields to avoid confusion
      column.enableColumnFilter = true;
    } else {
      column.enableColumnFilter = false;
    }

    // Add information about whether this is a relation field
    if (field.isRelation) {
      column.meta = {
        ...column.meta,
        isRelation: true,
        relatedDataset: field.relatedDataset,
        displayField: field.displayField,
      };
    }
  }

  return column;
}
