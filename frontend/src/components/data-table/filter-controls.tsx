// src/components/data-table/filter-controls.tsx
import { Table } from "@tanstack/react-table";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Download } from "lucide-react";
import { exportToCSV } from "@/lib/csv-export";
import { FieldDefinition } from "@/types/types";
import { ExportColumnsDialog } from "./export-columns-dialog";
import ReusableSelect from "../reusable/reusable-select";

export default function FilterControls({
  filterableColumns,
  filterColumn,
  setFilterColumn,
  table,
  searchPlaceholder,
  onExport,
  data,
  fields,
  datasetId,
}: {
  filterableColumns: string[];
  filterColumn: string;
  setFilterColumn: (newFilterColumn: string) => void;
  table: Table<any>;
  searchPlaceholder: string;
  onExport?: () => void; // Optional callback for when export happens
  data: any[]; // Full dataset for export
  fields: FieldDefinition[]; // Field definitions for formatting
  datasetId: string; // Dataset ID for naming export files
}) {
  // Get field map for looking up display names
  const fieldMap = new Map<string, FieldDefinition>();
  fields.forEach((field) => fieldMap.set(field.key, field));

  // Handle export button click
  const handleExport = () => {
    // Get filtered rows if there's a filter applied, otherwise use all data
    const rowsToExport =
      table.getFilteredRowModel().rows.length > 0
        ? table.getFilteredRowModel().rows.map((row) => row.original)
        : data;

    // Generate a filename with timestamp
    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, "-")
      .substring(0, 19);
    const filename = `${datasetId}_export_${timestamp}.csv`;

    // Get visible columns (excluding the action and select columns)
    const visibleColumns = table
      .getVisibleLeafColumns()
      .filter((column) => column.id !== "actions" && column.id !== "select")
      .map((column) => column.id);

    // Export to CSV with visible columns
    exportToCSV(rowsToExport, fields, filename, visibleColumns);

    // Call optional callback
    if (onExport) {
      onExport();
    }
  };

  // Get placeholder text based on selected field
  const getPlaceholder = () => {
    if (!filterColumn) return searchPlaceholder;

    const field = fieldMap.get(filterColumn);
    if (field?.isRelation) {
      return `Search by ${field.displayName} values...`;
    }

    return searchPlaceholder;
  };

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div className="flex flex-wrap items-center gap-2">
        {filterableColumns.length > 0 && (
          <>
            <ReusableSelect
              options={filterableColumns.map((column) => ({
                id: column,
                label: column,
              }))}
              value={filterColumn}
              onChange={(value) => {
                setFilterColumn(value);
                table.resetColumnFilters();
              }}
              renderItem={(option) => {
                const field = fieldMap.get(option.label);
                const displayName = field?.displayName || option.label;
                return `${displayName} ${field?.isRelation ? "(Relation)" : ""}`;
              }}
              title={"column"}
              triggerClassName={"w-[180px]"}
            />

            <Input
              placeholder={getPlaceholder()}
              value={
                (table.getColumn(filterColumn)?.getFilterValue() as string) ||
                ""
              }
              onChange={(event) => {
                table
                  .getColumn(filterColumn)
                  ?.setFilterValue(event.target.value);
              }}
              className="max-w-sm"
            />
          </>
        )}
      </div>

      <div className="flex gap-2">
        {/* Quick Export button */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          disabled={data.length === 0}
        >
          <Download className="h-4 w-4 mr-2" />
          Quick Export
        </Button>

        {/* Advanced Export Dialog */}
        <ExportColumnsDialog
          fields={fields}
          data={data}
          table={table}
          datasetId={datasetId}
          onExport={onExport}
        />
      </div>
    </div>
  );
}
