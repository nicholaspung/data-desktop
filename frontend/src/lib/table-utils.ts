import { ColumnMeta } from "@/types";
import { ColumnDef } from "@tanstack/react-table";

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
      return typeof value === "number" ? `${value.toLocaleString()}%` : value;
    case "text":
    default:
      return value;
  }
};

// Helper function to create column definitions with proper rendering based on field type
export function createColumn<TData, TValue = any>(
  accessorKey: keyof TData,
  header: string,
  meta: ColumnMeta
): ColumnDef<TData, TValue> {
  return {
    accessorKey: accessorKey as string,
    header,
    meta,
    cell: ({ cell }) => {
      const value = cell.getValue();
      return formatCellValue(value, meta);
    },
  };
}
