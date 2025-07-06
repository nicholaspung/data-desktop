import { ColumnMeta, FieldDefinition } from "@/types/types";
import { ColumnDef } from "@tanstack/react-table";
import { getFilterFunctionForField } from "./table-filter-utils";
import { formatDate } from "./date-utils";
import { formatCurrency } from "./data-utils";
import { getNestedValue } from "./utils";
import JsonViewCell from "@/components/data-table/json-view-cell";
import FileViewCell from "@/components/data-table/file-view-cell";
import MultipleFileViewCell from "@/components/data-table/multiple-file-view-cell";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";

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
      if (typeof value === "number") {
        if (meta.unit === "$") {
          return formatCurrency(value);
        }
        return `${value.toLocaleString()}${meta.unit ? ` ${meta.unit}` : ""}`;
      }
      return value;
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
    case "markdown":
      return (
        <div className="prose prose-sm dark:prose-invert max-w-none
                   prose-headings:font-semibold prose-headings:text-foreground
                   prose-p:text-foreground
                   prose-a:text-primary prose-a:underline prose-a:underline-offset-4 hover:prose-a:text-primary/80
                   prose-strong:text-foreground prose-strong:font-semibold
                   prose-blockquote:border-l-border prose-blockquote:text-muted-foreground
                   prose-code:bg-muted prose-code:text-foreground prose-code:font-mono prose-code:rounded prose-code:px-1 prose-code:py-0.5
                   prose-pre:bg-muted prose-pre:text-foreground prose-pre:font-mono prose-pre:rounded-md prose-pre:p-4 prose-pre:overflow-x-auto
                   prose-li:marker:text-muted-foreground
                   prose-hr:border-border">
          <ReactMarkdown remarkPlugins={[remarkBreaks]}>{value}</ReactMarkdown>
        </div>
      );
    case "text":
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
    // Add field to meta for all columns
    column.meta = {
      ...column.meta,
      field: field,
    };

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

export function createTimestampColumns<TData>(): ColumnDef<TData, any>[] {
  return [
    {
      id: "createdAt",
      accessorKey: "createdAt",
      header: "Created",
      meta: { type: "date" },
      cell: ({ cell }) => {
        const value = cell.getValue();
        return value ? formatDate(value) : "—";
      },
    },
    {
      id: "lastModified", 
      accessorKey: "lastModified",
      header: "Updated",
      meta: { type: "date" },
      cell: ({ cell }) => {
        const value = cell.getValue();
        return value ? formatDate(value) : "—";
      },
    },
  ];
}
