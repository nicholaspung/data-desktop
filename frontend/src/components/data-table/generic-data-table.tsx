// src/components/data-table/generic-data-table.tsx
import { useState, useEffect, useRef } from "react";
import { EditableDataTable } from "@/components/data-table/editable-data-table";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ApiService } from "@/services/api";
import { ColumnDef } from "@tanstack/react-table";
import { createColumn } from "@/lib/table-utils";
import { FieldDefinition } from "@/types/types";
import { ConfirmDeleteDialog } from "../reusable/confirm-delete-dialog";
import { useStore } from "@tanstack/react-store";
import dataStore, { DataStoreName, deleteEntry } from "@/store/data-store";
import loadingStore from "@/store/loading-store";
import RefreshDatasetButton from "../reusable/refresh-dataset-button";
import ReusableSelect from "../reusable/reusable-select";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { BulkEditDialog } from "./bulk-edit-dialog";

export default function GenericDataTable({
  datasetId,
  fields,
  title,
  dataKey = "id",
  disableDelete = false,
  disableEdit = false,
  onDataChange,
  pageSize = 10,
  highlightedRecordId = null,
  initialPage = 0,
  persistState = true,
  onRowClick,
}: {
  datasetId: DataStoreName;
  fields: FieldDefinition[];
  title: string;
  dataKey?: string; // Optional key for identifying records in the data array
  disableImport?: boolean;
  disableDelete?: boolean;
  disableEdit?: boolean;
  onDataChange?: () => void;
  pageSize?: number;
  highlightedRecordId?: string | null;
  initialPage?: number; // Initial page index
  persistState?: boolean; // Whether to persist pagination state
  onRowClick?: (row: Record<string, any>) => void;
}) {
  const data =
    useStore(dataStore, (state) => state[datasetId as DataStoreName]) || []; // Get data from the store
  const isLoading =
    useStore(loadingStore, (state) => state[datasetId as DataStoreName]) ||
    false; // Get data from the store

  const navigate = useNavigate();
  // Fix for useSearch - provide empty options object
  const search = useSearch({ from: "/dataset" });

  // Parse URL parameters for table state
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [tableMode, setTableMode] = useState<
    "view" | "edit" | "delete" | "bulk-edit"
  >(
    search.mode
      ? (search.mode as "view" | "edit" | "delete" | "bulk-edit")
      : "view"
  );
  const [updatedRowIds, setUpdatedRowIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(
    search.page ? parseInt(search.page as string, 10) : initialPage
  );
  const [currentPageSize, setCurrentPageSize] = useState(
    search.pageSize ? parseInt(search.pageSize as string, 10) : pageSize
  );
  const [currentSorting, setCurrentSorting] = useState<{
    column: string;
    direction: "asc" | "desc";
  } | null>(
    search.sortColumn && search.sortDirection
      ? {
          column: search.sortColumn as string,
          direction: search.sortDirection as "asc" | "desc",
        }
      : null
  );
  const [currentFilter, setCurrentFilter] = useState<{
    column: string;
    value: string;
  } | null>(
    search.filterColumn && search.filterValue
      ? {
          column: search.filterColumn as string,
          value: search.filterValue as string,
        }
      : null
  );
  const [bulkEditDialogOpen, setBulkEditDialogOpen] = useState(false);

  const tableContainerRef = useRef<HTMLDivElement>(null);

  // Update URL when table state changes
  useEffect(() => {
    if (!persistState) return;

    const params: Record<string, string> = {};

    // Add table mode
    params.mode = tableMode;

    // Add pagination
    params.page = currentPage.toString();
    params.pageSize = currentPageSize.toString();

    // Add sorting if present
    if (currentSorting) {
      params.sortColumn = currentSorting.column;
      params.sortDirection = currentSorting.direction;
    }

    // Add filtering if present
    if (currentFilter) {
      params.filterColumn = currentFilter.column;
      params.filterValue = currentFilter.value;
    }

    // Keep the datasetId param if it exists (for dataset route)
    if (search.datasetId) {
      params.datasetId = search.datasetId as string;
    }

    // Update URL
    navigate({
      search: params as any,
    });
  }, [
    tableMode,
    currentPage,
    currentPageSize,
    currentSorting,
    currentFilter,
    persistState,
    navigate,
    search.datasetId,
  ]);

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
        },
        field // Pass the full field definition for filtering and relation handling
      )
    );

    return columns;
  };

  // Scroll to highlighted row when data is loaded or highlightedRecordId changes
  useEffect(() => {
    if (highlightedRecordId && data.length > 0) {
      // Find the highlighted record in the data
      const highlightedRecordIndex = data.findIndex(
        (item) => item[dataKey as keyof typeof item] === highlightedRecordId
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

  // Effect to animate updated rows
  useEffect(() => {
    if (updatedRowIds.length > 0 && tableContainerRef.current) {
      // Add animation class to recently updated rows
      const table = tableContainerRef.current.querySelector("table");
      if (table) {
        updatedRowIds.forEach((rowId) => {
          // Find row by data attribute
          const row = table.querySelector(`tr[data-row-id="${rowId}"]`);
          if (row) {
            row.classList.add("row-highlight");
            // Remove the class after animation finishes
            setTimeout(() => {
              row.classList.remove("row-highlight");
            }, 2000);
          }
        });
      }

      // Clear the updated rows array
      setUpdatedRowIds([]);
    }
  }, [updatedRowIds]);

  // Handle data change from inline editing
  const handleDataUpdated = (updatedRowId?: string) => {
    // Add the updated row ID to our list for animation
    if (updatedRowId) {
      setUpdatedRowIds((prev) => [...prev, updatedRowId]);
    }

    if (onDataChange) {
      onDataChange();
    }
  };

  // Handle batch delete of selected records
  const handleDeleteSelectedRecords = async () => {
    if (selectedRows.length === 0) return;

    try {
      let successCount = 0;
      let errorCount = 0;

      // Delete each selected record
      for (const id of selectedRows) {
        try {
          await ApiService.deleteRecord(id);
          deleteEntry(id, datasetId);
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

      if (onDataChange) {
        onDataChange();
      }

      // Clear selection
      setSelectedRows([]);
    } catch (error) {
      console.error("Error in batch delete:", error);
      toast.error("An error occurred during batch delete");
    }
  };

  // Get the searchable columns for the filter
  const getSearchableColumns = () => {
    return fields
      .filter((field) => field.isSearchable)
      .map((field) => field.key);
  };

  // Handle sorting state changes
  const handleSortingChange = (
    columnId: string,
    direction: "asc" | "desc" | false
  ) => {
    if (direction === false) {
      // Sorting cleared
      setCurrentSorting(null);
    } else {
      setCurrentSorting({
        column: columnId,
        direction: direction as "asc" | "desc",
      });
    }
  };

  // Handle filter state changes
  const handleFilterChange = (columnId: string, value: string) => {
    if (!value) {
      setCurrentFilter(null);
    } else {
      setCurrentFilter({
        column: columnId,
        value,
      });
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Table Mode Selector */}
      <div className="flex justify-between items-center">
        <CardTitle>{title}</CardTitle>

        <div className="flex items-center gap-3">
          <RefreshDatasetButton
            fields={fields}
            datasetId={datasetId}
            title={title}
          />
          <ReusableSelect
            options={[
              { id: "view", label: "View Mode" },
              !disableEdit && { id: "edit", label: "Edit Mode" },
              !disableDelete && { id: "delete", label: "Delete Mode" },
              !disableEdit && { id: "bulk-edit", label: "Bulk Edit Mode" },
            ].filter((i) => i)}
            value={tableMode}
            onChange={(value: any) => {
              setTableMode(value);

              // Clear selected rows when switching modes
              if (selectedRows.length > 0) {
                setSelectedRows([]);
              }
            }}
            title={"mode"}
            triggerClassName={"w-[150px]"}
          />

          {tableMode === "bulk-edit" && selectedRows.length > 0 && (
            <BulkEditDialog
              open={bulkEditDialogOpen}
              onOpenChange={setBulkEditDialogOpen}
              selectedRecords={
                selectedRows
                  .map((id) => data.find((item) => item.id === id))
                  .filter(Boolean) as Record<string, any>[]
              }
              fields={fields}
              datasetId={datasetId}
              onDataChange={handleDataUpdated}
            />
          )}

          {/* Delete Button - Only visible in delete mode with selections */}
          {tableMode === "delete" && selectedRows.length > 0 && (
            <ConfirmDeleteDialog
              title="Delete entry"
              description={`Are you sure you want to delete ${selectedRows.length} selected ${
                selectedRows.length === 1 ? "record" : "records"
              }?`}
              triggerText={`Delete ${selectedRows.length} ${selectedRows.length === 1 ? "Record" : "Records"}`}
              onConfirm={handleDeleteSelectedRecords}
            />
          )}
        </div>
      </div>

      {/* Main Table Card */}
      <Card className="flex-1 min-w-0" ref={tableContainerRef}>
        <CardContent className="overflow-auto p-4">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <EditableDataTable
              columns={createTableColumns()}
              data={data}
              fields={fields}
              datasetId={datasetId}
              filterableColumns={getSearchableColumns()}
              searchPlaceholder="Search..."
              pageSize={currentPageSize}
              onRowClick={onRowClick}
              rowClassName={(row) =>
                highlightedRecordId && row[dataKey] === highlightedRecordId
                  ? "highlight-row"
                  : ""
              }
              enableSelection={
                tableMode === "delete" || tableMode === "bulk-edit"
              }
              dataKey={dataKey}
              selectedRows={selectedRows}
              onSelectedRowsChange={setSelectedRows}
              initialPage={currentPage}
              onPageChange={setCurrentPage}
              onPageSizeChange={setCurrentPageSize}
              onDataChange={(updatedRowId) => handleDataUpdated(updatedRowId)}
              useInlineEditing={tableMode === "edit" && !disableEdit}
              initialSorting={
                currentSorting
                  ? [
                      {
                        id: currentSorting.column,
                        desc: currentSorting.direction === "desc",
                      },
                    ]
                  : []
              }
              onSortingChange={handleSortingChange}
              initialFilter={
                currentFilter
                  ? { id: currentFilter.column, value: currentFilter.value }
                  : undefined
              }
              onFilterChange={handleFilterChange}
              initialFilterColumn={
                currentFilter?.column || getSearchableColumns()[0]
              }
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
