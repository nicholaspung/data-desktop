// src/components/data-table/generic-data-table.tsx
import React, { useState, useEffect, useRef } from "react";
import { DataTable } from "@/components/data-table/data-table";
import { EditableDataTable } from "@/components/data-table/editable-data-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Trash, Pencil } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { ConfirmDeleteDialog } from "../reusable/confirm-delete-dialog";
import { ConfirmChangesDialog } from "../reusable/confirm-changes-dialog";
import EditPanel from "./edit-panel";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface GenericDataTableProps {
  datasetId: string;
  fields: FieldDefinition[];
  title: string;
  dataKey?: string; // Optional key for identifying records in the data array
  disableImport?: boolean;
  disableDelete?: boolean;
  disableEdit?: boolean;
  enableSelection?: boolean; // Enable row selection
  onDataChange?: () => void;
  pageSize?: number;
  highlightedRecordId?: string | null;
  initialPage?: number; // Initial page index
  persistState?: boolean; // Whether to persist pagination state
  enableInlineEditing?: boolean; // New prop to control inline editing
  onRowClick?: (row: Record<string, any>) => void;
}

export default function GenericDataTable({
  datasetId,
  fields,
  title,
  dataKey = "id",
  disableDelete = false,
  disableEdit = false,
  enableSelection = false,
  onDataChange,
  pageSize = 10,
  highlightedRecordId = null,
  initialPage = 0,
  persistState = true,
  enableInlineEditing = true, // Default to true for inline editing
  onRowClick,
}: GenericDataTableProps) {
  const [data, setData] = useState<Record<string, any>[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<Record<
    string,
    any
  > | null>(null);
  const [originalRecord, setOriginalRecord] = useState<Record<
    string,
    any
  > | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUnsavedChangesDialog, setShowUnsavedChangesDialog] =
    useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [tableMode, setTableMode] = useState<"view" | "edit" | "delete">(
    "view"
  );
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [currentPageSize, setCurrentPageSize] = useState(pageSize);

  // Generate local storage key for this specific dataset's pagination
  const paginationStorageKey = `${datasetId}_pagination_state`;

  // Create local storage key for this specific dataset's editing
  const editStorageKey = `${datasetId}_edit_data`;

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

    // Add actions column if edit or delete is enabled and selection is disabled
    // Only add when not using inline editing and not in delete mode
    if (
      (!disableDelete || !disableEdit) &&
      !enableSelection &&
      tableMode === "view"
    ) {
      columns.unshift({
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

    // Load pagination state from localStorage if enabled
    if (persistState) {
      try {
        const savedPaginationState = localStorage.getItem(paginationStorageKey);
        if (savedPaginationState) {
          const { pageIndex, pageSize } = JSON.parse(savedPaginationState);
          setCurrentPage(pageIndex);
          setCurrentPageSize(pageSize);
        }
      } catch (error) {
        console.error("Error loading pagination state:", error);
      }
    }
  }, [datasetId]);

  // Save pagination state when it changes
  useEffect(() => {
    if (persistState) {
      try {
        localStorage.setItem(
          paginationStorageKey,
          JSON.stringify({
            pageIndex: currentPage,
            pageSize: currentPageSize,
          })
        );
      } catch (error) {
        console.error("Error saving pagination state:", error);
      }
    }
  }, [currentPage, currentPageSize, persistState]);

  // Check for unsaved changes when component unmounts
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "";
        return "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);

  // Use a ref to track if we've already checked for saved data for the current record
  const hasCheckedLocalStorage = useRef(false);
  const currentRecordId = useRef<string | null>(null);

  // Load any saved edit data only when first opening the sidebar
  useEffect(() => {
    // Reset the check flag if the record changes
    if (selectedRecord && selectedRecord[dataKey] !== currentRecordId.current) {
      hasCheckedLocalStorage.current = false;
      currentRecordId.current = selectedRecord[dataKey] as string;
    }

    if (isSidebarOpen && selectedRecord && !hasCheckedLocalStorage.current) {
      hasCheckedLocalStorage.current = true;

      try {
        const savedEditData = localStorage.getItem(editStorageKey);
        if (savedEditData) {
          const parsedData = JSON.parse(savedEditData);

          // Only restore if the record ID matches
          if (parsedData.id === selectedRecord[dataKey]) {
            const processedData = { ...parsedData };

            // Convert date strings back to Date objects
            fields.forEach((field) => {
              if (field.type === "date" && processedData[field.key]) {
                processedData[field.key] = new Date(processedData[field.key]);
              }
            });

            setSelectedRecord(processedData);
            setHasUnsavedChanges(true);
            toast.info("Restored unsaved changes from previous edit session");
          }
        }
      } catch (error) {
        console.error("Error loading saved edit data:", error);
      }
    }

    // Clean up function to reset the ref when the sidebar closes
    return () => {
      if (!isSidebarOpen) {
        hasCheckedLocalStorage.current = false;
        currentRecordId.current = null;
      }
    };
  }, [isSidebarOpen, selectedRecord]);

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
      // Clear selection when data is reloaded
      setSelectedRows([]);
    } catch (error) {
      console.error(`Error loading ${datasetId} data:`, error);
      toast.error(`Failed to load ${title} data`);
    } finally {
      setIsLoading(false);
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

  const handleDeleteSelectedRecords = async () => {
    setIsSubmitting(true);

    try {
      let successCount = 0;
      let errorCount = 0;

      // Delete each selected record
      for (const id of selectedRows) {
        try {
          await ApiService.deleteRecord(id);
          successCount++;
        } catch (error) {
          console.error(`Error deleting record ${id}:`, error);
          errorCount++;
        }
      }

      // Show toast with results
      if (successCount > 0) {
        toast.success(
          `Successfully deleted ${successCount} record${successCount !== 1 ? "s" : ""}`
        );
      }

      if (errorCount > 0) {
        toast.error(
          `Failed to delete ${errorCount} record${errorCount !== 1 ? "s" : ""}`
        );
      }

      // Reload data
      await loadData();

      if (onDataChange) {
        onDataChange();
      }
    } catch (error) {
      console.error("Error in batch delete:", error);
      toast.error("An error occurred during batch delete");
    } finally {
      setIsSubmitting(false);
      setSelectedRows([]);
    }
  };

  const handleEditRecord = (record: Record<string, any>) => {
    // Create a deep copy of the record to avoid modifying the original
    const recordCopy = JSON.parse(JSON.stringify(record));

    // Convert date strings back to Date objects for the form
    fields.forEach((field) => {
      if (field.type === "date" && recordCopy[field.key]) {
        recordCopy[field.key] = new Date(recordCopy[field.key]);
      }
    });

    // Save the original record for comparison
    setOriginalRecord(recordCopy);
    setSelectedRecord(recordCopy);
    setIsSidebarOpen(true);
    setHasUnsavedChanges(false); // Reset unsaved changes flag when opening a new record
  };

  const handleEditSuccess = async () => {
    // Clear the local storage for this record
    localStorage.removeItem(editStorageKey);

    setIsSidebarOpen(false);
    setSelectedRecord(null);
    setOriginalRecord(null);
    setHasUnsavedChanges(false);
    await loadData();

    if (onDataChange) {
      onDataChange();
    }
  };

  // Handle selection changes
  const handleSelectedRowsChange = (newSelectedRows: string[]) => {
    setSelectedRows(newSelectedRows);
  };

  // New function to handle form changes and save to local storage
  const handleFormChange = (values: Record<string, any>) => {
    if (!selectedRecord || !originalRecord) return;

    // Check if values are different from original
    let changed = false;
    for (const key in values) {
      if (JSON.stringify(values[key]) !== JSON.stringify(originalRecord[key])) {
        changed = true;
        break;
      }
    }

    setHasUnsavedChanges(changed);

    if (changed) {
      // Save to local storage
      try {
        // Ensure the record ID is included
        const dataToSave = {
          ...values,
          [dataKey]: selectedRecord[dataKey], // Make sure ID is preserved
        };

        // Convert Date objects to ISO strings for safe storage
        const storageData = { ...dataToSave };
        Object.keys(storageData).forEach((key) => {
          if (storageData[key] instanceof Date) {
            storageData[key] = storageData[key].toISOString();
          }
        });

        localStorage.setItem(editStorageKey, JSON.stringify(storageData));
      } catch (error) {
        console.error("Error saving edit data to localStorage:", error);
      }
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

  // Function to reset the form to original values
  const handleResetForm = () => {
    if (originalRecord) {
      setSelectedRecord({ ...originalRecord });
      localStorage.removeItem(editStorageKey);
      setHasUnsavedChanges(false);
      toast.info("Changes reverted to original values");
    }
  };

  // Function to close edit sidebar with confirmation if needed
  const handleCloseSidebar = (callback?: () => void) => {
    if (hasUnsavedChanges) {
      setShowUnsavedChangesDialog(true);
      if (callback) {
        setPendingAction(() => callback);
      } else {
        setPendingAction(() => () => {
          setIsSidebarOpen(false);
          setSelectedRecord(null);
          setOriginalRecord(null);
          localStorage.removeItem(editStorageKey);
          setHasUnsavedChanges(false);
        });
      }
    } else {
      setIsSidebarOpen(false);
      setSelectedRecord(null);
      setOriginalRecord(null);
      if (callback) {
        callback();
      }
    }
  };

  // Handle confirmation dialog responses
  const handleConfirmDiscard = () => {
    setShowUnsavedChangesDialog(false);
    localStorage.removeItem(editStorageKey);
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
  };

  const handleCancelDiscard = () => {
    setShowUnsavedChangesDialog(false);
    setPendingAction(null);
  };

  // Get the searchable columns for the filter
  const getSearchableColumns = () => {
    return fields
      .filter((field) => field.isSearchable)
      .map((field) => field.key);
  };

  // Handle data change from inline editing
  const handleDataUpdated = () => {
    loadData();
    if (onDataChange) {
      onDataChange();
    }
  };

  // Row click handler based on table mode
  const handleRowClick = (row: Record<string, any>) => {
    // Handle row click based on the current mode
    if (tableMode === "view" && !disableEdit) {
      // In view mode, open edit sidebar
      handleEditRecord(row);
    } else if (tableMode === "delete") {
      // In delete mode, selection is handled by the DataTable component
      // No additional action needed here
    }

    // Call external handler if provided
    if (onRowClick) {
      onRowClick(row);
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-4">
      <ConfirmChangesDialog
        onCancel={handleCancelDiscard}
        onConfirm={handleConfirmDiscard}
        showTrigger={false}
        open={showUnsavedChangesDialog}
        onOpenChange={setShowUnsavedChangesDialog}
      />

      <EditPanel
        isSidebarOpen={isSidebarOpen}
        selectedRecord={selectedRecord}
        handleCloseSidebar={handleCloseSidebar}
        formRef={formRef}
        handleFormSubmit={handleFormSubmit}
        fields={fields}
        handleFormChange={handleFormChange}
        datasetId={datasetId}
        dataKey={dataKey}
        hasUnsavedChanges={hasUnsavedChanges}
        isSubmitting={isSubmitting}
        handleResetForm={handleResetForm}
      />

      {/* Main Table Card - Always takes available space but maintains fixed width */}
      <Card className="flex-1 min-w-0" ref={tableContainerRef}>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex-1">
            <CardTitle>{title}</CardTitle>
          </div>

          <div className="flex items-center gap-3">
            {/* Table mode selector */}
            <div className="flex items-center gap-2">
              <Label htmlFor="table-mode" className="text-sm">
                Mode
              </Label>
              <Select
                value={tableMode}
                onValueChange={(value: "view" | "edit" | "delete") => {
                  setTableMode(value);

                  // Clear selected rows when switching modes
                  if (selectedRows.length > 0) {
                    setSelectedRows([]);
                  }
                }}
              >
                <SelectTrigger className="w-[130px]" id="table-mode">
                  <SelectValue placeholder="Select mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="view">View Mode</SelectItem>
                  {!disableEdit && enableInlineEditing && (
                    <SelectItem value="edit">Edit Mode</SelectItem>
                  )}
                  {!disableDelete && (
                    <SelectItem value="delete">Delete Mode</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Only show delete button when items are selected and in delete mode */}
            {tableMode === "delete" &&
              selectedRows.length > 0 &&
              !disableDelete && (
                <ConfirmDeleteDialog
                  title="Delete Selected Items"
                  description={`Are you sure you want to delete ${selectedRows.length} selected ${selectedRows.length === 1 ? "item" : "items"}? This action cannot be undone.`}
                  onConfirm={handleDeleteSelectedRecords}
                  trigger={
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Trash className="h-4 w-4 mr-2" />
                      )}
                      Delete{" "}
                      {selectedRows.length === 1
                        ? "Selected Item"
                        : `${selectedRows.length} Items`}
                    </Button>
                  }
                />
              )}
          </div>
        </CardHeader>
        <CardContent className="overflow-auto">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : tableMode === "edit" && !disableEdit && enableInlineEditing ? (
            <EditableDataTable
              columns={createTableColumns()}
              data={data}
              fields={fields}
              datasetId={datasetId}
              filterableColumns={getSearchableColumns()}
              searchPlaceholder="Search..."
              pageSize={currentPageSize}
              onRowClick={handleRowClick}
              rowClassName={(row) =>
                highlightedRecordId && row[dataKey] === highlightedRecordId
                  ? "highlight-row"
                  : ""
              }
              enableSelection={false}
              dataKey={dataKey}
              selectedRows={[]}
              initialPage={currentPage}
              onPageChange={setCurrentPage}
              onPageSizeChange={setCurrentPageSize}
              onDataChange={handleDataUpdated}
              useInlineEditing={true}
            />
          ) : (
            <DataTable
              columns={createTableColumns()}
              data={data}
              filterableColumns={getSearchableColumns()}
              searchPlaceholder="Search..."
              pageSize={currentPageSize}
              onRowClick={handleRowClick}
              rowClassName={(row: any) =>
                highlightedRecordId && row[dataKey] === highlightedRecordId
                  ? "highlight-row"
                  : ""
              }
              enableSelection={tableMode === "delete"}
              dataKey={dataKey}
              selectedRows={selectedRows}
              onSelectedRowsChange={handleSelectedRowsChange}
              initialPage={currentPage}
              onPageChange={setCurrentPage}
              onPageSizeChange={setCurrentPageSize}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
