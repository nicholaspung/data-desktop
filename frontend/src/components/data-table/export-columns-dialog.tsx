import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Download, Settings } from "lucide-react";
import { FieldDefinition } from "@/types/types";
import { Label } from "@/components/ui/label";
import { Table } from "@tanstack/react-table";
import { exportToCSV, exportToZipWithFiles } from "@/lib/csv-export";
import { toast } from "sonner";
import ReusableDialog from "@/components/reusable/reusable-dialog";

export function ExportColumnsDialog({
  fields,
  data,
  table,
  datasetId,
  onExport,
}: {
  fields: FieldDefinition[];
  data: Record<string, any>[];
  table: Table<any>;
  datasetId: string;
  onExport?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(true);
  const [exportAsZip, setExportAsZip] = useState(false);

  const initializeColumns = () => {
    const visibleColumns = table
      .getVisibleLeafColumns()
      .filter((column) => column.id !== "actions" && column.id !== "select")
      .map((column) => column.id);

    setSelectedColumns(visibleColumns);
    setSelectAll(true);
  };

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

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedColumns([]);
    } else {
      setSelectedColumns(fields.map((field) => field.key));
    }
    setSelectAll(!selectAll);
  };

  const handleExport = async () => {
    if (selectedColumns.length === 0) {
      toast.error("Please select at least one column to export");
      return;
    }

    const rowsToExport =
      table.getFilteredRowModel().rows.length > 0
        ? table.getFilteredRowModel().rows.map((row) => row.original)
        : data;

    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, "-")
      .substring(0, 19);
    const filename = `${datasetId}_export_${timestamp}`;

    try {
      if (exportAsZip) {
        await exportToZipWithFiles(
          rowsToExport,
          fields,
          filename,
          selectedColumns
        );
        toast.success("Data exported to ZIP with files");
      } else {
        exportToCSV(rowsToExport, fields, `${filename}.csv`, selectedColumns);
        toast.success("Data exported to CSV");
      }

      setOpen(false);

      if (onExport) {
        onExport();
      }
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export data");
    }
  };

  const hasFileFields = () => {
    const visibleColumns = table
      .getVisibleLeafColumns()
      .filter((column) => column.id !== "actions" && column.id !== "select")
      .map((column) => column.id);

    const columnsToCheck =
      selectedColumns.length > 0 ? selectedColumns : visibleColumns;

    return fields.some(
      (field) =>
        (field.type === "file" || field.type === "file-multiple") &&
        columnsToCheck.includes(field.key)
    );
  };

  const renderDialogContent = () => (
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

      {hasFileFields() && (
        <div className="flex items-center space-x-2 mb-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-md">
          <Checkbox
            id="export-as-zip"
            checked={exportAsZip}
            onCheckedChange={(checked) => setExportAsZip(checked === true)}
          />
          <Label htmlFor="export-as-zip" className="font-medium">
            Export as ZIP with files
          </Label>
          <p className="text-sm text-muted-foreground ml-2">
            (Includes file downloads in a "files" folder)
          </p>
        </div>
      )}

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
  );

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

      <ReusableDialog
        title="Export Options"
        description="Select the columns you want to include in the CSV export."
        open={open}
        onOpenChange={setOpen}
        showTrigger={false}
        customContent={renderDialogContent()}
        onCancel={() => setOpen(false)}
        onConfirm={handleExport}
        footerActionDisabled={selectedColumns.length === 0}
        confirmIcon={<Download className="h-4 w-4 mr-2" />}
        confirmText="Export Selected"
      />
    </>
  );
}
