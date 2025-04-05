// src/components/data-table/editable-data-table.tsx
import { useState, useEffect } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  SortingState,
  getSortedRowModel,
  ColumnFiltersState,
  getFilteredRowModel,
  getPaginationRowModel,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import {
  ChevronUp,
  ChevronDown,
  Pencil,
  Check,
  X,
  Loader2,
} from "lucide-react";
import { FieldDefinition } from "@/types";
import { ApiService } from "@/services/api";
import { toast } from "sonner";
import { formatCellValue } from "@/lib/table-utils";
import { formatDate } from "@/lib/date-utils";
import Pagination from "./pagination";
import { calculateColumnWidth } from "./table-width-utils";
import EditableCell from "./editable-cell";
import FilterControls from "./filter-controls";

interface EditableDataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  fields: FieldDefinition[]; // Added field definitions
  datasetId: string; // Added dataset ID
  filterableColumns?: string[];
  searchPlaceholder?: string;
  className?: string;
  pageSize?: number;
  onRowClick?: (row: TData) => void;
  rowClassName?: (row: TData) => string;
  enableSelection?: boolean;
  dataKey?: string;
  selectedRows?: string[];
  onSelectedRowsChange?: (selectedRowIds: string[]) => void;
  initialPage?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  onDataChange?: () => void; // Callback when data changes
  useInlineEditing?: boolean; // Flag to enable inline editing
  showActionColumn?: boolean; // Flag to show/hide action column
}

export function EditableDataTable<TData extends Record<string, any>, TValue>({
  columns,
  data,
  fields,
  datasetId,
  filterableColumns = [],
  searchPlaceholder = "Search...",
  className,
  pageSize = 10,
  onRowClick,
  rowClassName,
  enableSelection = false,
  dataKey = "id",
  selectedRows = [],
  onSelectedRowsChange,
  initialPage = 0,
  onPageChange,
  onPageSizeChange,
  onDataChange,
  useInlineEditing = false,
  showActionColumn = true,
}: EditableDataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [filterColumn, setFilterColumn] = useState<string>(
    filterableColumns.length > 0 ? filterableColumns[0] : ""
  );
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const [pagination, setPagination] = useState({
    pageIndex: initialPage,
    pageSize: pageSize,
  });
  const [editingRow, setEditingRow] = useState<string | null>(null);
  const [editedValues, setEditedValues] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [columnWidths, setColumnWidths] = useState<Record<string, string>>({});

  // Create a field map for quick lookup
  const fieldMap = new Map<string, FieldDefinition>();
  fields.forEach((field) => fieldMap.set(field.key, field));

  // Calculate column widths on initial render and when data changes
  useEffect(() => {
    const widths: Record<string, string> = {};

    columns.forEach((column) => {
      if (column.id) {
        widths[column.id] = calculateColumnWidth(column, data);
      }
    });

    setColumnWidths(widths);
  }, [columns, data]);

  // Create selection column if selection is enabled
  const selectionColumn: ColumnDef<TData, any> = {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getFilteredRowModel().rows.length > 0 &&
          table.getIsAllRowsSelected()
        }
        onCheckedChange={(value) => {
          table.toggleAllRowsSelected(!!value);
          if (onSelectedRowsChange) {
            const newSelectedRows = value
              ? table
                  .getFilteredRowModel()
                  .rows.map((row) => String(row.original[dataKey]))
              : [];
            onSelectedRowsChange(newSelectedRows);
          }
        }}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => {
          row.toggleSelected(!!value);
          if (onSelectedRowsChange) {
            const rowId = String(row.original[dataKey]);
            let newSelectedRowIds: string[];
            if (value === true) {
              newSelectedRowIds = selectedRows.includes(rowId)
                ? selectedRows
                : [...selectedRows, rowId];
            } else {
              newSelectedRowIds = selectedRows.filter((id) => id !== rowId);
            }
            onSelectedRowsChange(newSelectedRowIds);
          }
        }}
        aria-label="Select row"
        onClick={(e) => e.stopPropagation()}
      />
    ),
    enableSorting: false,
  };

  // Create action column for edit/save/cancel
  const actionColumn: ColumnDef<TData, any> = {
    id: "actions",
    header: "Actions",
    cell: ({ row }: { row: { original: Record<string, any> } }) => {
      const isEditing = editingRow === row.original[dataKey];

      return (
        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
          {isEditing ? (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleSaveRow(row.original)}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleCancelEdit()}
                disabled={isSubmitting}
              >
                <X className="h-4 w-4" />
              </Button>
            </>
          ) : (
            useInlineEditing && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleEditRow(row.original)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            )
          )}
        </div>
      );
    },
  };

  // Add selection column if enabled and add action column
  let tableColumns = [...columns];
  if (enableSelection) {
    tableColumns = [selectionColumn, ...tableColumns];
  }
  if (showActionColumn && (useInlineEditing || editingRow !== null)) {
    tableColumns = [actionColumn, ...tableColumns];
  }

  // Update internal selection state when selectedRows prop changes
  useEffect(() => {
    if (!data || data.length === 0) return;

    const selectionMap: Record<string, boolean> = {};
    data.forEach((row, index) => {
      const rowId = String(row[dataKey]);
      selectionMap[index] = selectedRows.includes(rowId);
    });

    setRowSelection(selectionMap);
  }, [selectedRows, data, dataKey]);

  // Create enhanced column defs that support editing
  const editableColumns = tableColumns.map((column) => {
    // Skip action and selection columns
    if (column.id === "actions" || column.id === "select") {
      return column;
    }

    return {
      ...column,
      cell: (info: any) => {
        const { row, column: columnInfo, getValue } = info;
        const columnId = String(columnInfo.id);
        const isEditing = editingRow === row.original[dataKey];
        const value = getValue();
        const width = columnWidths[columnId] || "auto";
        const field = fieldMap.get(columnId);

        // If this row is being edited
        if (isEditing) {
          // For any field type, use the EditableCell component which now handles relations
          if (field) {
            return (
              <EditableCell
                value={
                  editedValues[columnId] !== undefined
                    ? editedValues[columnId]
                    : value
                }
                row={row}
                column={columnInfo}
                field={field}
                width={width}
                onValueChange={(newValue) =>
                  handleCellValueChange(columnId, newValue)
                }
              />
            );
          }
        }

        // NON-EDITING MODE BELOW

        // Handle relation fields for view mode
        if (field?.isRelation && field?.relatedDataset) {
          // Look for the related data in xxx_id_data format
          const relatedKey = `${columnId}_data`;
          const relatedData = row.original[relatedKey];

          if (relatedData) {
            // Create a meaningful display value based on the relation type
            let displayValue = "";

            // Special handling for bloodwork date field
            if (field.relatedDataset === "bloodwork" && relatedData.date) {
              displayValue = formatDate(new Date(relatedData.date));
              if (relatedData.lab_name && relatedData.lab_name.trim() !== "") {
                displayValue += ` - ${relatedData.lab_name}`;
              }
            }
            // Special handling for blood markers
            else if (field.relatedDataset === "blood_markers") {
              displayValue = relatedData.name || "Unnamed";
              if (relatedData.unit && relatedData.unit.trim() !== "") {
                displayValue += ` (${relatedData.unit})`;
              }
            }
            // Use displayField from field definition if provided
            else if (
              field.displayField &&
              relatedData[field.displayField] !== undefined
            ) {
              displayValue = relatedData[field.displayField] || "";

              // Add secondary information if specified in field definition
              if (
                field.secondaryDisplayField &&
                relatedData[field.secondaryDisplayField] !== undefined &&
                relatedData[field.secondaryDisplayField] !== ""
              ) {
                displayValue += ` - ${relatedData[field.secondaryDisplayField]}`;
              }
            }
            // Fallback options
            else {
              displayValue =
                relatedData.name ||
                relatedData.title ||
                relatedData.displayName ||
                relatedData.label ||
                // Date-based fallback for records with dates
                (relatedData.date
                  ? formatDate(new Date(relatedData.date))
                  : `ID: ${value}`);
            }

            return (
              <div
                className="truncate"
                style={{ maxWidth: "100%" }}
                title={displayValue}
              >
                {displayValue}
              </div>
            );
          } else {
            // No related data available, show the ID
            return (
              <div className="truncate">{value ? `ID: ${value}` : "—"}</div>
            );
          }
        }

        // If not a relation or not editing, use the original cell renderer if available
        if (column.cell) {
          return flexRender(column.cell, info);
        }

        // Fallback to displaying the value with formatting
        return (
          <div
            className="truncate"
            style={{ maxWidth: "100%" }}
            title={
              typeof value === "string" || typeof value === "number"
                ? String(value)
                : undefined
            }
          >
            {formatCellValue(
              value,
              field
                ? {
                    type: field.type,
                    unit: field.unit,
                    description: field.description,
                  }
                : undefined
            )}
          </div>
        );
      },
    };
  });

  const table = useReactTable({
    data,
    columns: editableColumns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    enableRowSelection: enableSelection,
    state: {
      sorting,
      columnFilters,
      pagination,
      rowSelection,
    },
    onPaginationChange: (updater) => {
      const newPagination =
        typeof updater === "function" ? updater(pagination) : updater;

      setPagination(newPagination);

      if (onPageChange && newPagination.pageIndex !== pagination.pageIndex) {
        onPageChange(newPagination.pageIndex);
      }

      if (onPageSizeChange && newPagination.pageSize !== pagination.pageSize) {
        onPageSizeChange(newPagination.pageSize);
      }
    },
    onRowSelectionChange: setRowSelection,
    enableSorting: true,
    enableMultiSort: true,
    manualPagination: false,
    debugTable: process.env.NODE_ENV === "development",
  });

  // Handle entering edit mode for a row
  const handleEditRow = (row: Record<string, any>) => {
    // Don't allow editing if already editing a row
    if (editingRow !== null) return;

    setEditingRow(row[dataKey]);
    setEditedValues({});
  };

  // Handle saving a row
  const handleSaveRow = async (row: Record<string, any>) => {
    if (!editingRow) return;

    setIsSubmitting(true);
    try {
      // Prepare the updated record
      const updatedRecord = { ...row };

      // Apply changes from editedValues
      Object.keys(editedValues).forEach((key) => {
        updatedRecord[key] = editedValues[key];
      });

      // Send update to API
      await ApiService.updateRecord(editingRow, updatedRecord);

      toast.success("Record updated successfully");

      // Refresh data if needed
      if (onDataChange) {
        onDataChange();
      }

      // Exit editing mode
      setEditingRow(null);
      setEditedValues({});
    } catch (error) {
      console.error("Error updating record:", error);
      toast.error("Failed to update record");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle cancelling edit mode
  const handleCancelEdit = () => {
    setEditingRow(null);
    setEditedValues({});
  };

  // Handle cell value changes
  const handleCellValueChange = (columnId: string, value: any) => {
    setEditedValues((prev) => ({
      ...prev,
      [columnId]: value,
    }));
  };

  // Handle row click with logic to avoid editing if selection is enabled
  const handleRowClick = (row: TData) => {
    // Don't trigger row click when already editing
    if (editingRow !== null) return;

    // For selection mode, toggle selection
    if (enableSelection) {
      const rowId = String(row[dataKey]);
      const isSelected = selectedRows.includes(rowId);
      let newSelectedRows: string[];

      if (isSelected) {
        newSelectedRows = selectedRows.filter((id) => id !== rowId);
      } else {
        newSelectedRows = [...selectedRows, rowId];
      }

      if (onSelectedRowsChange) {
        onSelectedRowsChange(newSelectedRows);
      }

      const rowModel = table.getRowModel().rows;
      const rowIndex = rowModel.findIndex(
        (r) => String(r.original[dataKey]) === rowId
      );

      if (rowIndex !== -1) {
        const newRowSelection = { ...rowSelection };
        newRowSelection[rowIndex] = !isSelected;
        setRowSelection(newRowSelection);
      }
    }
    // If onRowClick is provided and we're not in selection mode, call it
    else if (onRowClick) {
      onRowClick(row);
    }
  };

  return (
    <div className={cn("space-y-4", className)} key={datasetId}>
      {/* Filter controls with export button */}
      <FilterControls
        filterableColumns={filterableColumns}
        filterColumn={filterColumn}
        setFilterColumn={setFilterColumn}
        table={table}
        searchPlaceholder={searchPlaceholder}
        data={data}
        fields={fields}
        datasetId={datasetId}
        onExport={() => {
          toast.success("Data exported to CSV");
        }}
      />

      {/* Pagination component */}
      <Pagination
        table={table}
        enableSelection={enableSelection}
        selectedRows={selectedRows}
      />

      {/* Table with frozen header and first column */}
      <div className="rounded-md border relative">
        <div
          className="overflow-auto max-h-[600px]"
          style={{ position: "relative" }}
        >
          {/* Custom table with sticky header and first column */}
          <div className="relative">
            <table className="w-full border-collapse">
              {/* Sticky Header */}
              <thead className="sticky top-0 z-20 bg-background border-b">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header, headerIndex) => {
                      const columnId = header.column.id;
                      const width = columnWidths[columnId] || "auto";
                      const isFirstColumn = headerIndex === 0;

                      return (
                        <th
                          key={header.id}
                          className={cn(
                            header.column.getCanSort()
                              ? "cursor-pointer select-none"
                              : "",
                            "whitespace-nowrap p-2 text-left align-middle font-medium text-muted-foreground",
                            isFirstColumn &&
                              "sticky left-0 z-10 bg-background border-r"
                          )}
                          onClick={header.column.getToggleSortingHandler()}
                          style={{
                            width,
                            minWidth:
                              columnId === "actions" || columnId === "select"
                                ? "80px"
                                : "100px",
                          }}
                        >
                          <div className="flex items-center gap-1">
                            {header.isPlaceholder
                              ? null
                              : flexRender(
                                  header.column.columnDef.header,
                                  header.getContext()
                                )}
                            {header.column.getIsSorted() === "asc" && (
                              <ChevronUp className="ml-1 h-4 w-4" />
                            )}
                            {header.column.getIsSorted() === "desc" && (
                              <ChevronDown className="ml-1 h-4 w-4" />
                            )}
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                ))}
              </thead>
              {/* Table Body with Sticky First Column */}
              <tbody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <tr
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                      className={cn(
                        "border-b",
                        (onRowClick || enableSelection) &&
                          editingRow !== row.original[dataKey]
                          ? "cursor-pointer hover:bg-muted"
                          : "",
                        row.getIsSelected() ? "bg-muted/50" : "",
                        editingRow === row.original[dataKey]
                          ? "bg-muted/30"
                          : "",
                        rowClassName ? rowClassName(row.original as TData) : ""
                      )}
                      onClick={() => {
                        if (editingRow !== row.original[dataKey]) {
                          handleRowClick(row.original as TData);
                        }
                      }}
                    >
                      {row.getVisibleCells().map((cell, cellIndex) => {
                        const columnId = cell.column.id;
                        const width = columnWidths[columnId] || "auto";
                        const isFirstColumn = cellIndex === 0;

                        return (
                          <td
                            key={cell.id}
                            className={cn(
                              "p-2 align-middle",
                              isFirstColumn &&
                                "sticky left-0 z-10 bg-background border-r"
                            )}
                            style={{
                              width,
                              minWidth:
                                columnId === "actions" || columnId === "select"
                                  ? "80px"
                                  : "100px",
                            }}
                          >
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={tableColumns.length}
                      className="h-24 text-center"
                    >
                      No results.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
