// src/components/data-table/generic-data-table.tsx
import React, { useState, useEffect, useRef } from "react";
import { DataTable } from "@/components/data-table/data-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Loader2, Trash, Pencil, X } from "lucide-react";
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
import DataForm from "@/components/data-form/data-form";
import { ScrollArea } from "@/components/ui/scroll-area";

interface GenericDataTableProps {
  datasetId: string;
  fields: FieldDefinition[];
  title: string;
  dataKey?: string; // Optional key for identifying records in the data array
  disableImport?: boolean;
  disableDelete?: boolean;
  disableEdit?: boolean;
  onDataChange?: () => void;
  pageSize?: number;
  highlightedRecordId?: string | null;
}

export default function GenericDataTable({
  datasetId,
  fields,
  title,
  dataKey = "id",
  disableImport = false,
  disableDelete = false,
  disableEdit = false,
  onDataChange,
  pageSize = 10,
  highlightedRecordId = null,
}: GenericDataTableProps) {
  const [data, setData] = useState<Record<string, any>[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<Record<
    string,
    any
  > | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

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

    // Add actions column if edit or delete is enabled
    if (!disableDelete || !disableEdit) {
      columns.push({
        id: "actions",
        header: "Actions",
        cell: ({ row }: { row: { original: Record<string, any> } }) => (
          <div
            className="flex gap-2"
            onClick={(e) => {
              // This is crucial to prevent row click when clicking actions
              e.stopPropagation();
            }}
          >
            {!disableEdit && (
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditRecord(row.original);
                }}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            )}
            {!disableDelete && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent onClick={(e) => e.stopPropagation()}>
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
            )}
          </div>
        ),
      });
    }

    return columns;
  };

  // Load data when the component mounts
  useEffect(() => {
    loadData();
  }, [datasetId]);

  // Scroll to highlighted row when data is loaded or highlightedRecordId changes
  useEffect(() => {
    if (highlightedRecordId && data.length > 0) {
      // Find the highlighted record in the data
      const highlightedRecordIndex = data.findIndex(
        (item) => item[dataKey] === highlightedRecordId
      );

      if (highlightedRecordIndex !== -1) {
        // Find the corresponding row element and scroll to it
        setTimeout(() => {
          const table = tableContainerRef.current?.querySelector("table");
          if (table) {
            const rows = table.querySelectorAll("tbody tr");
            const highlightedRow = rows[highlightedRecordIndex];
            if (highlightedRow) {
              highlightedRow.scrollIntoView({
                behavior: "smooth",
                block: "center",
              });
              // Add a highlight class that will be animated
              highlightedRow.classList.add("bg-primary/10");
              // Remove the highlight after 2 seconds
              setTimeout(() => {
                highlightedRow.classList.remove("bg-primary/10");
              }, 2000);
            }
          }
        }, 100);
      }
    }
  }, [data, highlightedRecordId]);

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

  const handleEditRecord = (record: Record<string, any>) => {
    // Add debugging
    console.log("Row clicked! Opening edit sidebar for record:", record);

    // Create a deep copy of the record to avoid modifying the original
    const recordCopy = JSON.parse(JSON.stringify(record));

    // Convert date strings back to Date objects for the form
    fields.forEach((field) => {
      if (field.type === "date" && recordCopy[field.key]) {
        recordCopy[field.key] = new Date(recordCopy[field.key]);
      }
    });

    setSelectedRecord(recordCopy);
    setIsSidebarOpen(true);
  };

  const handleEditSuccess = async () => {
    setIsSidebarOpen(false);
    setSelectedRecord(null);
    await loadData();

    if (onDataChange) {
      onDataChange();
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Submit the form programmatically
      if (formRef.current) {
        // Create FormData from form elements
        const formData = new FormData(formRef.current);
        const formValues: Record<string, any> = {};

        // Process form data
        fields.forEach((field) => {
          const value = formData.get(field.key);

          // Process based on field type
          switch (field.type) {
            case "number":
            case "percentage":
              formValues[field.key] = value ? parseFloat(value.toString()) : 0;
              break;
            case "boolean":
              formValues[field.key] = value === "true";
              break;
            case "date":
              if (value) {
                // If it's already a Date object (from DataForm)
                if (
                  selectedRecord &&
                  selectedRecord[field.key] instanceof Date
                ) {
                  formValues[field.key] = selectedRecord[field.key];
                } else {
                  formValues[field.key] = new Date(value.toString());
                }
              }
              break;
            default:
              formValues[field.key] = value || "";
          }
        });

        // Update the record
        if (selectedRecord && selectedRecord[dataKey]) {
          const updatedRecord = await ApiService.updateRecord(
            selectedRecord[dataKey].toString(),
            formValues
          );
          toast.success(`${title} data updated successfully`);
          if (updatedRecord) {
            handleEditSuccess();
          }
        }
      }
    } catch (error) {
      console.error("Error updating record:", error);
      toast.error("Failed to update record");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get the searchable columns for the filter
  const getSearchableColumns = () => {
    return fields
      .filter((field) => field.isSearchable)
      .map((field) => field.key);
  };

  return (
    <div className="flex flex-col md:flex-row gap-4">
      {/* Edit Panel - Fixed width with height matching the table */}
      {isSidebarOpen && selectedRecord && (
        <div className="md:w-[450px] md:h-[800px] flex-shrink-0 bg-background border rounded-lg flex flex-col">
          <div className="flex justify-between items-center p-4 border-b">
            <h3 className="text-lg font-semibold">Edit Record</h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setIsSidebarOpen(false);
                setSelectedRecord(null);
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <form
            ref={formRef}
            onSubmit={handleFormSubmit}
            className="flex flex-col h-full"
          >
            <ScrollArea className="flex-1 p-4">
              {selectedRecord && (
                <DataForm
                  datasetId={datasetId}
                  fields={fields}
                  initialValues={selectedRecord}
                  mode="edit"
                  recordId={selectedRecord[dataKey]}
                  // Pass a custom handler to avoid default submission
                  onSuccess={() => {}}
                  hideSubmitButton={true}
                />
              )}
            </ScrollArea>

            {/* Fixed footer with update button */}
            <div className="p-4 border-t mt-auto">
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Record"
                )}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Main Table Card - Always takes available space but maintains fixed width */}
      <Card className="flex-1 min-w-0" ref={tableContainerRef}>
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
        <CardContent className="overflow-auto">
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
              onRowClick={
                disableEdit
                  ? undefined
                  : (row) => {
                      console.log("Row clicked in GenericDataTable, row:", row);
                      handleEditRecord(row);
                    }
              }
              rowClassName={(row) =>
                highlightedRecordId && row[dataKey] === highlightedRecordId
                  ? "highlight-row"
                  : ""
              }
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
