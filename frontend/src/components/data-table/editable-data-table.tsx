// src/components/data-table/editable-data-table.tsx
import React, { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ApiService } from "@/services/api";
import { toast } from "sonner";
import { formatCellValue } from "@/lib/table-utils";
import Pagination from "./pagination";

interface EditableCellProps {
  value: any;
  row: any;
  column: any;
  field: FieldDefinition;
  onValueChange: (value: any) => void;
}

// This component renders different form controls based on the field type
const EditableCell: React.FC<EditableCellProps> = ({
  value,
  //   row,
  //   column,
  field,
  onValueChange,
}) => {
  const [editValue, setEditValue] = useState(value);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  const handleValueChange = (newValue: any) => {
    setEditValue(newValue);
    onValueChange(newValue);
  };

  switch (field.type) {
    case "text":
      return (
        <Input
          value={editValue || ""}
          onChange={(e) => handleValueChange(e.target.value)}
          className="h-8 w-full"
        />
      );
    case "number":
    case "percentage":
      return (
        <Input
          type="number"
          value={editValue || 0}
          onChange={(e) => handleValueChange(parseFloat(e.target.value))}
          className="h-8 w-full"
          step="any"
          min={0}
          max={field.type === "percentage" ? 100 : undefined}
        />
      );
    case "boolean":
      return (
        <Checkbox
          checked={editValue || false}
          onCheckedChange={(checked) => handleValueChange(!!checked)}
        />
      );
    case "date":
      return (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="h-8 w-full justify-start text-left font-normal"
            >
              {editValue ? format(new Date(editValue), "PP") : "Pick a date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={editValue ? new Date(editValue) : undefined}
              onSelect={(date) => handleValueChange(date)}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      );
    default:
      return <span>{value}</span>;
  }
};

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
  useInlineEditing,
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

  // Create a field map for quick lookup
  const fieldMap = new Map<string, FieldDefinition>();
  fields.forEach((field) => fieldMap.set(field.key, field));

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
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleEditRow(row.original)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          )}
        </div>
      );
    },
  };

  // Add selection column if enabled and add action column
  let tableColumns = [...columns];
  if (enableSelection && !useInlineEditing) {
    tableColumns = [selectionColumn, ...tableColumns];
  }
  tableColumns = [actionColumn, ...tableColumns];

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

        // If this row is being edited, render the editable cell
        if (isEditing) {
          const field = fieldMap.get(columnId);
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
                onValueChange={(newValue) =>
                  handleCellValueChange(columnId, newValue)
                }
              />
            );
          }
        }

        // Otherwise, use the original cell renderer if available
        if (column.cell) {
          return flexRender(column.cell, info);
        }

        // Fallback to displaying the value with formatting
        const field = fieldMap.get(columnId);
        return formatCellValue(
          value,
          field
            ? {
                type: field.type,
                unit: field.unit,
                description: field.description,
              }
            : undefined
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
      {/* Filter controls */}
      <div className="flex items-center space-x-2">
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
                (table.getColumn(filterColumn)?.getFilterValue() as string) ??
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

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      className={
                        header.column.getCanSort()
                          ? "cursor-pointer select-none"
                          : ""
                      }
                      onClick={header.column.getToggleSortingHandler()}
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
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className={cn(
                    (onRowClick || enableSelection) &&
                      editingRow !== row.original[dataKey]
                      ? "cursor-pointer hover:bg-muted"
                      : "",
                    row.getIsSelected() ? "bg-muted/50" : "",
                    editingRow === row.original[dataKey] ? "bg-muted/30" : "",
                    rowClassName ? rowClassName(row.original as TData) : ""
                  )}
                  onClick={() => {
                    if (editingRow !== row.original[dataKey]) {
                      handleRowClick(row.original as TData);
                    }
                  }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={tableColumns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Pagination
        table={table}
        enableSelection={enableSelection}
        selectedRows={selectedRows}
      />
    </div>
  );
}
