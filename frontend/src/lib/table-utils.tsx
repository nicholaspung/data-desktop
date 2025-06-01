import { ColumnMeta, FieldDefinition } from "@/types/types";
import { ColumnDef } from "@tanstack/react-table";
import { getFilterFunctionForField } from "./table-filter-utils";
import { formatDate } from "./date-utils";
import { getNestedValue } from "./utils";
import JsonViewCell from "@/components/data-table/json-view-cell";
import FileViewCell from "@/components/data-table/file-view-cell";
import MultipleFileViewCell from "@/components/data-table/multiple-file-view-cell";

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
    case "select-multiple":
      if (!value || !Array.isArray(value) || value.length === 0) {
        return "—";
      }
      return value.join(", ");
    case "json":
      return <JsonViewCell value={value} title={meta.description} />;
    case "file":
      return <FileViewCell value={value as any} />;
    case "file-multiple":
      if (!value || !Array.isArray(value) || value.length === 0) {
        return "—";
      }
      return <MultipleFileViewCell files={value} />;
    case "text":
    case "markdown":
    default:
      return value;
  }
};

export function createColumn<TData, TValue = any>(
  accessorKey: keyof TData,
  header: string,
  meta: ColumnMeta,
  field?: FieldDefinition
): ColumnDef<TData, TValue> {
  const column: ColumnDef<TData, TValue> = {
    id: field?.key,
    accessorKey: accessorKey as string,
    header,
    meta,
    cell: ({ cell }) => {
      const value = cell.getValue();

      if (meta.type === "file") {
        return <FileViewCell value={value as any} />;
      }

      if (meta.type === "file-multiple") {
        if (!value || !Array.isArray(value) || value.length === 0) {
          return "—";
        }
        return <MultipleFileViewCell files={value} title={header} />;
      }

      return formatCellValue(value, meta);
    },
  };

  if (field) {
    if (field.isSearchable) {
      column.filterFn = getFilterFunctionForField(field);

      column.enableColumnFilter = true;
    } else {
      column.enableColumnFilter = false;
    }

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

export const getDisplayValue = (field: FieldDefinition, record: any) => {
  let label = "";

  if (field.displayField) {
    const displayValue = getNestedValue(record, field.displayField);
    if (displayValue !== undefined) {
      if (field.displayFieldType === "date") {
        label = formatDate(displayValue);
      } else {
        label = displayValue || "";
      }

      if (field.secondaryDisplayField) {
        const secondaryValue = getNestedValue(
          record,
          field.secondaryDisplayField
        );
        if (secondaryValue !== undefined && secondaryValue !== "") {
          if (field.secondaryDisplayFieldType === "date") {
            label += ` (${formatDate(secondaryValue)})`;
          } else {
            label += ` (${secondaryValue})`;
          }
        }
      }
    } else {
      label = record.name || record.title || `ID: ${record.id}`;
    }
  } else {
    label = record.name || record.title || `ID: ${record.id}`;
  }

  return label;
};
