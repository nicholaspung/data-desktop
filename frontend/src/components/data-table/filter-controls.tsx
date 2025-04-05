// Updated FilterControls with Export Button
import { Table } from "@tanstack/react-table";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Button } from "../ui/button";
import { Download } from "lucide-react";
import { exportToCSV } from "@/lib/csv-export";
import { FieldDefinition } from "@/types";

interface FilterControlsProps {
  filterableColumns: string[];
  filterColumn: string;
  setFilterColumn: React.Dispatch<React.SetStateAction<string>>;
  table: Table<any>;
  searchPlaceholder: string;
  onExport?: () => void; // Optional callback for when export happens
  data: any[]; // Full dataset for export
  fields: FieldDefinition[]; // Field definitions for formatting
  datasetId: string; // Dataset ID for naming export files
}

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
}: FilterControlsProps) {
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

    // Export to CSV
    exportToCSV(rowsToExport, fields, filename);

    // Call optional callback
    if (onExport) {
      onExport();
    }
  };

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div className="flex flex-wrap items-center gap-2">
        {filterableColumns.length > 0 && (
          <>
            <Select
              value={filterColumn}
              onValueChange={(value) => {
                setFilterColumn(value);
                table.resetColumnFilters();
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select column" />
              </SelectTrigger>
              <SelectContent>
                {filterableColumns.map((column) => (
                  <SelectItem key={column} value={column}>
                    {column}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              placeholder={searchPlaceholder}
              value={
                (table.getColumn(filterColumn)?.getFilterValue() as string) ||
                ""
              }
              onChange={(event) =>
                table
                  .getColumn(filterColumn)
                  ?.setFilterValue(event.target.value)
              }
              className="max-w-sm"
            />
          </>
        )}
      </div>

      {/* Export button */}
      <Button
        variant="outline"
        size="sm"
        className="ml-auto"
        onClick={handleExport}
        disabled={data.length === 0}
      >
        <Download className="h-4 w-4 mr-2" />
        Export CSV
      </Button>
    </div>
  );
}
