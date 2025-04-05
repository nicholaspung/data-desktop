// src/components/data-table/export-columns-dialog.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Download, Settings } from "lucide-react";
import { FieldDefinition } from "@/types";
import { Label } from "@/components/ui/label";
import { Table } from "@tanstack/react-table";
import { exportToCSV } from "@/lib/csv-export";
import { toast } from "sonner";

interface ExportColumnsDialogProps {
  fields: FieldDefinition[];
  data: Record<string, any>[];
  table: Table<any>;
  datasetId: string;
  onExport?: () => void;
}

export function ExportColumnsDialog({
  fields,
  data,
  table,
  datasetId,
  onExport,
}: ExportColumnsDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(true);

  // Initialize selected columns with all visible columns when dialog opens
  const initializeColumns = () => {
    const visibleColumns = table
      .getVisibleLeafColumns()
      .filter((column) => column.id !== "actions" && column.id !== "select")
      .map((column) => column.id);

    setSelectedColumns(visibleColumns);
    setSelectAll(true);
  };

  // Handle column selection
  const toggleColumn = (columnKey: string) => {
    setSelectedColumns((prev) => {
      if (prev.includes(columnKey)) {
        const newSelection = prev.filter((key) => key !== columnKey);
        setSelectAll(newSelection.length === fields.length);
        return newSelection;
      } else {
        const newSelection = [...prev, columnKey];
        setSelectAll(newSelection.length === fields.length);
        return newSelection;
      }
    });
  };

  // Handle select all
  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedColumns([]);
    } else {
      setSelectedColumns(fields.map((field) => field.key));
    }
    setSelectAll(!selectAll);
  };

  // Handle export
  const handleExport = () => {
    if (selectedColumns.length === 0) {
      toast.error("Please select at least one column to export");
      return;
    }

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

    // Export to CSV with selected columns
    exportToCSV(rowsToExport, fields, filename, selectedColumns);

    // Close dialog
    setOpen(false);

    // Show success message
    toast.success("Data exported to CSV");

    // Call optional callback
    if (onExport) {
      onExport();
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="ml-2"
        onClick={() => {
          initializeColumns();
          setOpen(true);
        }}
        disabled={data.length === 0}
      >
        <Settings className="h-4 w-4 mr-2" />
        Export Options
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Export Options</DialogTitle>
            <DialogDescription>
              Select the columns you want to include in the CSV export.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="flex items-center space-x-2 mb-4">
              <Checkbox
                id="select-all"
                checked={selectAll}
                onCheckedChange={toggleSelectAll}
              />
              <Label htmlFor="select-all" className="font-medium">
                Select All
              </Label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto">
              {fields.map((field) => (
                <div key={field.key} className="flex items-center space-x-2">
                  <Checkbox
                    id={`col-${field.key}`}
                    checked={selectedColumns.includes(field.key)}
                    onCheckedChange={() => toggleColumn(field.key)}
                  />
                  <Label
                    htmlFor={`col-${field.key}`}
                    className="text-sm"
                    title={field.description || ""}
                  >
                    {field.displayName}
                    {field.isRelation && " (Relation)"}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleExport}
              disabled={selectedColumns.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Export Selected
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
