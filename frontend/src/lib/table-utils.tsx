import { ColumnMeta, FieldDefinition } from "@/types/types";
import { ColumnDef } from "@tanstack/react-table";
import { getFilterFunctionForField } from "./table-filter-utils";
import { formatDate } from "./date-utils";
import ImageViewer from "@/components/reusable/image-viewer";

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
    case "image":
      return { _isImage: true, src: value };
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

      if (meta.type === "image") {
        if (!value) return "—";

        if (typeof value === "object" && "_isImage" in value) {
          return (
            <ImageViewer
              src={(value as unknown as { src: string }).src}
              alt={header}
            />
          );
        }

        if (typeof value === "string") {
          return <ImageViewer src={value} alt={header} />;
        }

        return "—";
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

  if (field.displayField && record[field.displayField] !== undefined) {
    if (field.displayFieldType === "date") {
      label = formatDate(record[field.displayField]);
    } else {
      label = record[field.displayField] || "";
    }

    if (
      field.secondaryDisplayField &&
      record[field.secondaryDisplayField] !== undefined &&
      record[field.secondaryDisplayField] !== ""
    ) {
      if (field.secondaryDisplayFieldType === "date") {
        label += ` (${formatDate(record[field.secondaryDisplayField])})`;
      } else {
        label += ` (${record[field.secondaryDisplayField]})`;
      }
    }
  } else {
    label = record.name || record.title || `ID: ${record.id}`;
  }

  return label;
};
