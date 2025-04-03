import { Table } from "@tanstack/react-table";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

export default function FilterControls({
  filterableColumns,
  filterColumn,
  setFilterColumn,
  table,
  searchPlaceholder,
}: {
  filterableColumns: string[];
  filterColumn: string;
  setFilterColumn: React.Dispatch<React.SetStateAction<string>>;
  table: Table<any>;
  searchPlaceholder: string;
}) {
  return (
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
              (table.getColumn(filterColumn)?.getFilterValue() as string) ?? ""
            }
            onChange={(event) =>
              table.getColumn(filterColumn)?.setFilterValue(event.target.value)
            }
            className="max-w-sm"
          />
        </>
      )}
    </div>
  );
}
