import { useState, useEffect, useRef } from "react";
import { EditableDataTable } from "@/components/data-table/editable-data-table";
import ReusableCard from "@/components/reusable/reusable-card";
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
  dataKey?: string;
  disableImport?: boolean;
  disableDelete?: boolean;
  disableEdit?: boolean;
  onDataChange?: () => void;
  pageSize?: number;
  highlightedRecordId?: string | null;
  initialPage?: number;
  persistState?: boolean;
  onRowClick?: (row: Record<string, any>) => void;
}) {
  const data =
    useStore(dataStore, (state) => state[datasetId as DataStoreName]) || [];
  const isLoading =
    useStore(loadingStore, (state) => state[datasetId as DataStoreName]) ||
    false;

  const navigate = useNavigate();

  const search = useSearch({ from: "/dataset" });

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

  useEffect(() => {
    if (!persistState) return;

    const params: Record<string, string> = {};

    params.mode = tableMode;

    params.page = currentPage.toString();
    params.pageSize = currentPageSize.toString();

    if (currentSorting) {
      params.sortColumn = currentSorting.column;
      params.sortDirection = currentSorting.direction;
    }

    if (currentFilter) {
      params.filterColumn = currentFilter.column;
      params.filterValue = currentFilter.value;
    }

    if (search.datasetId) {
      params.datasetId = search.datasetId as string;
    }

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

  const createTableColumns = (): ColumnDef<Record<string, any>, any>[] => {
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
        field
      )
    );

    return columns;
  };

  useEffect(() => {
    if (highlightedRecordId && data.length > 0) {
      const highlightedRecordIndex = data.findIndex(
        (item: any) =>
          item[dataKey as keyof typeof item] === highlightedRecordId
      );

      if (highlightedRecordIndex !== -1) {
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

              highlightedRow.classList.add("bg-primary/10");

              setTimeout(() => {
                highlightedRow.classList.remove("bg-primary/10");
              }, 2000);
            }
          }
        }, 100);
      }
    }
  }, [data, highlightedRecordId]);

  useEffect(() => {
    if (updatedRowIds.length > 0 && tableContainerRef.current) {
      const table = tableContainerRef.current.querySelector("table");
      if (table) {
        updatedRowIds.forEach((rowId) => {
          const row = table.querySelector(`tr[data-row-id="${rowId}"]`);
          if (row) {
            row.classList.add("row-highlight");

            setTimeout(() => {
              row.classList.remove("row-highlight");
            }, 2000);
          }
        });
      }

      setUpdatedRowIds([]);
    }
  }, [updatedRowIds]);

  const handleDataUpdated = (updatedRowId?: string) => {
    if (updatedRowId) {
      setUpdatedRowIds((prev) => [...prev, updatedRowId]);
    }

    if (onDataChange) {
      onDataChange();
    }
  };

  const handleDeleteSelectedRecords = async () => {
    if (selectedRows.length === 0) return;

    try {
      let successCount = 0;
      let errorCount = 0;

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

      setSelectedRows([]);
    } catch (error) {
      console.error("Error in batch delete:", error);
      toast.error("An error occurred during batch delete");
    }
  };

  const getSearchableColumns = () => {
    return fields
      .filter((field) => field.isSearchable)
      .map((field) => field.key);
  };

  const handleSortingChange = (
    columnId: string,
    direction: "asc" | "desc" | false
  ) => {
    if (direction === false) {
      setCurrentSorting(null);
    } else {
      setCurrentSorting({
        column: columnId,
        direction: direction as "asc" | "desc",
      });
    }
  };

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
        <h3 className="text-lg font-semibold tracking-tight">{title}</h3>

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
                  .map((id) => data.find((item: any) => item.id === id))
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
      <div ref={tableContainerRef}>
        <ReusableCard
          cardClassName="flex-1 min-w-0"
          contentClassName="pt-6 overflow-auto"
          showHeader={false}
          content={
            isLoading ? (
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
            )
          }
        />
      </div>
    </div>
  );
}
