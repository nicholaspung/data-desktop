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
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { ChevronUp, ChevronDown } from "lucide-react";
import { FieldDefinition } from "@/types/types";
import { formatCellValue, getDisplayValue } from "@/lib/table-utils";
import Pagination from "./pagination";
import { calculateColumnWidth } from "../../lib/table-width-utils";
import EditableCell from "./editable-cell";
import FilterControls from "./filter-controls";
import { toast } from "sonner";
import { DataStoreName } from "@/store/data-store";

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
  initialSorting = [],
  onSortingChange,
  initialFilter,
  onFilterChange,
  initialFilterColumn,
}: {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  fields: FieldDefinition[];
  datasetId: DataStoreName;
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
  onDataChange?: (updatedRowId?: string) => void;
  useInlineEditing?: boolean;
  initialSorting?: { id: string; desc: boolean }[];
  onSortingChange?: (
    columnId: string,
    direction: "asc" | "desc" | false
  ) => void;
  initialFilter?: { id: string; value: string };
  onFilterChange?: (columnId: string, value: string) => void;
  initialFilterColumn?: string;
}) {
  const [sorting, setSorting] = useState<SortingState>(initialSorting);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(
    initialFilter ? [initialFilter] : []
  );
  const [filterColumn, setFilterColumn] = useState<string>(
    initialFilterColumn ||
      (filterableColumns.length > 0 ? filterableColumns[0] : "")
  );
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const [pagination, setPagination] = useState({
    pageIndex: initialPage,
    pageSize: pageSize,
  });
  const [columnWidths, setColumnWidths] = useState<Record<string, string>>({});

  const fieldMap = new Map<string, FieldDefinition>();
  fields.forEach((field) => fieldMap.set(field.key, field));

  useEffect(() => {
    const widths: Record<string, string> = {};

    columns.forEach((column) => {
      if (column.id) {
        widths[column.id] = calculateColumnWidth(
          column,
          !(data instanceof Promise) ? data : []
        );
      }
    });

    setColumnWidths(widths);
  }, [columns, data]);

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

  let tableColumns = [...columns];
  if (enableSelection) {
    tableColumns = [selectionColumn, ...tableColumns];
  }

  useEffect(() => {
    if (!data || data.length === 0) return;

    const selectionMap: Record<string, boolean> = {};
    if (!(data instanceof Promise)) {
      data.forEach((row, index) => {
        const rowId = String(row[dataKey]);
        selectionMap[index] = selectedRows.includes(rowId);
      });
    }

    setRowSelection(selectionMap);
  }, [selectedRows, data, dataKey]);

  const editableColumns = tableColumns.map((column) => {
    if (column.id === "select") {
      return column;
    }

    return {
      ...column,
      cell: (info: any) => {
        const { row, column: columnInfo, getValue } = info;
        const columnId = String(columnInfo.id);
        const value = getValue();
        const field = fieldMap.get(columnId);

        if (useInlineEditing && field && field.key !== "id") {
          return (
            <EditableCell
              value={value}
              row={row}
              column={columnInfo}
              field={field}
              datasetId={datasetId}
              onDataChange={() => {
                if (onDataChange) {
                  onDataChange(row.original[dataKey]);
                }
              }}
            />
          );
        }

        if (field?.isRelation && field?.relatedDataset) {
          const relatedKey = `${columnId}_data`;
          const relatedData = row.original[relatedKey];
          if (relatedData) {
            const displayValue = getDisplayValue(field, relatedData);

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
            return (
              <div className="truncate">{value ? `ID: ${value}` : "—"}</div>
            );
          }
        }

        if (column.cell) {
          return flexRender(column.cell, info);
        }

        return (
          <div
            className="truncate"
            style={{ maxWidth: "100%", whiteSpace: "pre-wrap" }}
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
    onSortingChange: (updater) => {
      const newSorting =
        typeof updater === "function" ? updater(sorting) : updater;
      setSorting(newSorting);

      if (onSortingChange && newSorting.length > 0) {
        const sort = newSorting[0];
        onSortingChange(sort.id, sort.desc ? "desc" : "asc");
      } else if (onSortingChange && newSorting.length === 0) {
        onSortingChange("", false);
      }
    },
    onColumnFiltersChange: (updater) => {
      const newFilters =
        typeof updater === "function" ? updater(columnFilters) : updater;
      setColumnFilters(newFilters);

      if (onFilterChange) {
        const filter = newFilters.find((f) => f.id === filterColumn);
        if (filter) {
          onFilterChange(filter.id, filter.value as string);
        } else if (columnFilters.some((f) => f.id === filterColumn)) {
          onFilterChange(filterColumn, "");
        }
      }
    },
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    enableRowSelection: enableSelection,
    state: {
      sorting,
      columnFilters,
      pagination,
      rowSelection,
    },
    globalFilterFn: (row, columnId, filterValue) => {
      const column = table.getColumn(columnId);
      if (column?.columnDef?.meta?.isRelation) {
        const relatedDataKey = `${columnId}_data`;
        const relatedData = row.original[relatedDataKey];
        if (relatedData) {
          const displayFields = [
            "name",
            "title",
            "displayName",
            "date",
            "label",
          ];
          for (const field of displayFields) {
            if (relatedData[field]) {
              const value = String(relatedData[field]).toLowerCase();
              if (value.includes(String(filterValue).toLowerCase())) {
                return true;
              }
            }
          }
        }
      }

      const value = row.getValue(columnId);
      return String(value)
        .toLowerCase()
        .includes(String(filterValue).toLowerCase());
    },
    enableFilters: true,
    manualFiltering: false,
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

  const handleRowClick = (row: TData) => {
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
    } else if (onRowClick) {
      onRowClick(row);
    }
  };

  return (
    <div className={cn("space-y-4", className)} key={datasetId}>
      <FilterControls
        filterableColumns={filterableColumns}
        filterColumn={filterColumn}
        setFilterColumn={(newColumn) => {
          setFilterColumn(newColumn);
          table.resetColumnFilters();

          if (
            onFilterChange &&
            columnFilters.some((f) => f.id === filterColumn)
          ) {
            onFilterChange(filterColumn, "");
          }
        }}
        table={table}
        searchPlaceholder={searchPlaceholder}
        data={data}
        fields={fields}
        datasetId={datasetId}
        onExport={() => {
          toast.success("Data exported to CSV");
        }}
      />
      <Pagination
        table={table}
        enableSelection={enableSelection}
        selectedRows={selectedRows}
      />
      <div className="rounded-md border relative">
        <div
          className="overflow-auto max-h-[600px]"
          style={{ position: "relative" }}
        >
          <div className="relative">
            <table className="w-full border-collapse">
              <colgroup>
                {table.getAllColumns().map((column) => {
                  const columnId = column.id;
                  const width =
                    columnWidths[column.id] ||
                    (columnId === "select" ? "40px" : "auto");

                  return (
                    <col
                      key={columnId}
                      style={{
                        minWidth: width,
                      }}
                    />
                  );
                })}
              </colgroup>
              <thead className="sticky top-0 z-20 bg-background border-b">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header, headerIndex) => {
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
              <tbody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <tr
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                      data-row-id={row.original[dataKey]}
                      className={cn(
                        "border-b",
                        !useInlineEditing && "hover:bg-muted",
                        onRowClick || enableSelection
                          ? "cursor-pointer hover:bg-muted"
                          : "",
                        row.getIsSelected() ? "bg-muted/50" : "",
                        rowClassName ? rowClassName(row.original as TData) : ""
                      )}
                      onClick={() => {
                        handleRowClick(row.original as TData);
                      }}
                    >
                      {row.getVisibleCells().map((cell, cellIndex) => {
                        const columnId = cell.column.id;
                        const isFirstColumn = cellIndex === 0;

                        return (
                          <td
                            key={cell.id}
                            className={cn(
                              "p-2 align-middle whitespace-pre-wrap",
                              isFirstColumn &&
                                "sticky left-0 z-10 bg-background border-r",

                              useInlineEditing &&
                                columnId !== "select" &&
                                columnId !== "id" &&
                                "editable-cell"
                            )}
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
