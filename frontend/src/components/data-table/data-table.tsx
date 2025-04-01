// src/components/data-table/data-table.tsx
import { useEffect, useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  filterableColumns?: string[]; // Columns that can be filtered
  searchPlaceholder?: string;
  className?: string;
  pageSize?: number;
  onRowClick?: (row: TData) => void;
  rowClassName?: (row: TData) => string; // New prop for custom row classes
  enableSelection?: boolean; // Enable selection functionality
  dataKey?: string; // The key to use for identifying rows
  selectedRows?: string[]; // Currently selected row IDs
  onSelectedRowsChange?: (selectedRowIds: string[]) => void; // Callback when selection changes
}

export function DataTable<TData extends Record<string, any>, TValue>({
  columns,
  data,
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
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [filterColumn, setFilterColumn] = useState<string>(
    filterableColumns.length > 0 ? filterableColumns[0] : ""
  );
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});

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
          // First update the table's internal selection state
          table.toggleAllRowsSelected(!!value);

          // Then explicitly collect all the row IDs that should be selected
          const newSelectedRows = value
            ? table
                .getFilteredRowModel()
                .rows.map((row) => String(row.original[dataKey]))
            : [];

          // Update parent component with the new selection state
          if (onSelectedRowsChange) {
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

          // Get the original ID from the row data
          const rowId = String(row.original[dataKey]);

          // Find all currently selected rows (including this one if checked)
          let newSelectedRowIds: string[];

          if (value === true) {
            // If checking, add to selection if not already present
            newSelectedRowIds = selectedRows.includes(rowId)
              ? selectedRows
              : [...selectedRows, rowId];
          } else {
            // If unchecking, remove from selection
            newSelectedRowIds = selectedRows.filter((id) => id !== rowId);
          }

          // Notify parent component of selection change
          if (onSelectedRowsChange) {
            onSelectedRowsChange(newSelectedRowIds);
          }
        }}
        aria-label="Select row"
        onClick={(e) => e.stopPropagation()} // Prevent row click when clicking checkbox
      />
    ),
    enableSorting: false,
  };

  // Add selection column if enabled
  const tableColumns = enableSelection
    ? [selectionColumn, ...columns]
    : columns;

  // Update internal selection state when selectedRows prop changes
  useEffect(() => {
    // If there's no data, don't try to set selection state
    if (!data || data.length === 0) return;

    // Convert selectedRows array to a map for the table's internal state
    const selectionMap: Record<string, boolean> = {};

    // For each row in the data
    data.forEach((row, index) => {
      const rowId = String(row[dataKey]);
      // Mark as selected if this ID is in the selectedRows array
      selectionMap[index] = selectedRows.includes(rowId);
    });

    setRowSelection(selectionMap);
  }, [selectedRows, data, dataKey]);

  const table = useReactTable({
    data,
    columns: tableColumns,
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
      pagination: {
        pageIndex: 0,
        pageSize,
      },
      rowSelection,
    },
    onRowSelectionChange: setRowSelection,
    // Enable sorting for all columns
    enableSorting: true,
    enableMultiSort: true,
  });

  // Handle row click with selection integration
  const handleRowClick = (row: TData) => {
    if (enableSelection) {
      // Toggle this row's selection status when clicked
      const rowId = String(row[dataKey]);
      const isSelected = selectedRows.includes(rowId);
      let newSelectedRows: string[];

      if (isSelected) {
        // If already selected, remove it
        newSelectedRows = selectedRows.filter((id) => id !== rowId);
      } else {
        // If not selected, add it
        newSelectedRows = [...selectedRows, rowId];
      }

      // Notify parent of selection change
      if (onSelectedRowsChange) {
        onSelectedRowsChange(newSelectedRows);
      }

      // Update table's internal selection state for the row
      // Find the row index to properly update internal selection state
      const rowModel = table.getRowModel().rows;
      const rowIndex = rowModel.findIndex(
        (r) => String(r.original[dataKey as keyof TData]) === rowId
      );

      if (rowIndex !== -1) {
        // Toggle the row selection
        const newRowSelection = { ...rowSelection };
        newRowSelection[rowIndex] = !isSelected;
        setRowSelection(newRowSelection);
      }
    }

    // If onRowClick is provided and we're not in selection mode, call it
    if (onRowClick && !enableSelection) {
      onRowClick(row);
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
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
                    onRowClick || enableSelection
                      ? "cursor-pointer hover:bg-muted"
                      : "",
                    row.getIsSelected() ? "bg-muted/50" : "",
                    rowClassName ? rowClassName(row.original as TData) : ""
                  )}
                  onClick={() => handleRowClick(row.original as TData)}
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

      {/* Pagination controls */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {table.getState().pagination.pageIndex * pageSize + 1} to{" "}
          {Math.min(
            (table.getState().pagination.pageIndex + 1) * pageSize,
            table.getFilteredRowModel().rows.length
          )}{" "}
          of {table.getFilteredRowModel().rows.length} entries
          {enableSelection && selectedRows.length > 0 && (
            <span className="ml-2 font-medium">
              ({selectedRows.length} selected)
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
