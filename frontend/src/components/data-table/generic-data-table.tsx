// src/components/data-table/generic-data-table.tsx
import React, { useState, useEffect } from "react";
import { DataTable } from "@/components/data-table/data-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Loader2, Trash } from "lucide-react";
import { parseCSV } from "@/lib/csv-parser";
import { toast } from "sonner";
import { ApiService } from "@/services/api";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ColumnDef } from "@tanstack/react-table";
import { createColumn } from "@/lib/table-utils";
import { FieldDefinition } from "@/types";

interface GenericDataTableProps {
  datasetId: string;
  fields: FieldDefinition[];
  title: string;
  dataKey?: string; // Optional key for identifying records in the data array
  disableImport?: boolean;
  disableDelete?: boolean;
  onDataChange?: () => void;
  pageSize?: number;
}

export default function GenericDataTable({
  datasetId,
  fields,
  title,
  dataKey = "id",
  disableImport = false,
  disableDelete = false,
  onDataChange,
  pageSize = 10,
}: GenericDataTableProps) {
  const [data, setData] = useState<Record<string, any>[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  // We don't need to track the selected record ID separately
  // as it's handled within the AlertDialog's onClick

  // Function to create columns for the data table with explicit type
  const createTableColumns = (): ColumnDef<Record<string, any>, any>[] => {
    // Type the columns array explicitly
    const columns: ColumnDef<Record<string, any>, any>[] = fields.map((field) =>
      createColumn<Record<string, any>, any>(
        field.key as keyof Record<string, any>,
        field.displayName,
        {
          type: field.type,
          unit: field.unit,
          description: field.description,
          isSearchable: field.isSearchable,
        }
      )
    );

    // Add actions column if delete is enabled
    if (!disableDelete) {
      columns.push({
        id: "actions",
        header: "Actions",
        cell: ({ row }: { row: { original: Record<string, any> } }) => (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon">
                <Trash className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete
                  this record.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => handleDeleteRecord(row.original[dataKey])}
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ),
      });
    }

    return columns;
  };

  // Load data when the component mounts
  useEffect(() => {
    loadData();
  }, [datasetId]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const records = await ApiService.getRecords(datasetId);

      // Process dates to ensure they're Date objects
      const processedRecords = records.map((record) => {
        const processed = { ...record };

        // Convert dates
        fields.forEach((field) => {
          if (field.type === "date" && processed[field.key]) {
            processed[field.key] = new Date(processed[field.key]);
          }
        });

        return processed;
      });

      setData(processedRecords);
    } catch (error) {
      console.error(`Error loading ${datasetId} data:`, error);
      toast.error(`Failed to load ${title} data`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      // Parse the CSV file
      const parsedData = await parseCSV(file, fields);

      // Import the data through the API
      const count = await ApiService.importRecords(datasetId, parsedData);

      // Refresh the data
      await loadData();

      toast.success(`Successfully imported ${count} records`);

      if (onDataChange) {
        onDataChange();
      }
    } catch (error) {
      console.error("Error importing CSV:", error);
      toast.error(
        "Failed to import CSV file. Please check the format and try again."
      );
    } finally {
      setIsImporting(false);

      // Clear the file input
      if (event.target) {
        event.target.value = "";
      }
    }
  };

  const handleDeleteRecord = async (id: string) => {
    try {
      await ApiService.deleteRecord(id);
      toast.success("Record deleted successfully");
      await loadData();

      if (onDataChange) {
        onDataChange();
      }
    } catch (error) {
      console.error("Error deleting record:", error);
      toast.error("Failed to delete record");
    }
  };

  // Get the searchable columns for the filter
  const getSearchableColumns = () => {
    return fields
      .filter((field) => field.isSearchable)
      .map((field) => field.key);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{title}</CardTitle>
        {!disableImport && (
          <Button
            variant="outline"
            className="cursor-pointer"
            disabled={isImporting}
          >
            {isImporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Import CSV
              </>
            )}
            <input
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFileUpload}
              disabled={isImporting}
            />
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <DataTable
            columns={createTableColumns()}
            data={data}
            filterableColumns={getSearchableColumns()}
            searchPlaceholder="Search..."
            pageSize={pageSize}
          />
        )}
      </CardContent>
    </Card>
  );
}
