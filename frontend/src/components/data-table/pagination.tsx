import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "../ui/button";
import { Table } from "@tanstack/react-table";
import ReusableSelect from "../reusable/reusable-select";

export default function Pagination({
  table,
  enableSelection,
  selectedRows = [],
}: {
  table: Table<any>;
  enableSelection?: boolean;
  selectedRows?: string[];
}) {
  // Calculate values outside of JSX for clarity
  const { pageIndex, pageSize } = table.getState().pagination;
  const totalRows = table.getFilteredRowModel().rows.length;
  const startRow = pageIndex * pageSize + 1;
  const endRow = Math.min((pageIndex + 1) * pageSize, totalRows);
  const pageCount = table.getPageCount();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2 mt-2">
      {/* Info text */}
      <div className="text-sm text-muted-foreground">
        {totalRows > 0 ? (
          <>
            Showing {startRow} to {endRow} of {totalRows} entries
            {enableSelection && selectedRows.length > 0 && (
              <span className="ml-2 font-medium">
                ({selectedRows.length} selected)
              </span>
            )}
          </>
        ) : (
          <span>No entries</span>
        )}
      </div>

      {/* Controls - right aligned on desktop */}
      <div className="flex justify-start md:justify-end items-center gap-2">
        {/* Page size selector */}
        <ReusableSelect
          options={[5, 10, 20, 50, 100].map((size) => ({
            id: size,
            label: size,
          }))}
          value={pageSize}
          onChange={(value) => {
            table.setPageSize(Number(value));
          }}
          placeholder={`${pageSize}`}
          triggerClassName={"h-8 w-[70px]"}
        />

        {/* Navigation buttons */}
        <div className="inline-flex items-center">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 p-0"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="sr-only">First page</span>
            <ChevronLeft className="h-4 w-4" />
            <ChevronLeft className="h-4 w-4 -ml-2" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 p-0 ml-1"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="sr-only">Previous page</span>
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <span className="mx-2 text-sm whitespace-nowrap">
            Page {pageIndex + 1} of {pageCount}
          </span>

          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 p-0"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <span className="sr-only">Next page</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 p-0 ml-1"
            onClick={() => table.setPageIndex(pageCount - 1)}
            disabled={!table.getCanNextPage()}
          >
            <span className="sr-only">Last page</span>
            <ChevronRight className="h-4 w-4" />
            <ChevronRight className="h-4 w-4 -ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}
