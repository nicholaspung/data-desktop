import { useEffect, useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Trash2,
  Plus,
  Copy,
  ChevronLeft,
  ChevronRight,
  Keyboard,
} from "lucide-react";
import ReusableSelect from "@/components/reusable/reusable-select";
import AutocompleteInput from "@/components/reusable/autocomplete-input";
import TagInput from "@/components/reusable/tag-input";
import { FieldDefinition, SelectOption } from "@/types/types";
import { MultiEntryRow } from "./types";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface MultiEntryTableProps {
  fieldDefinitions: FieldDefinition[];
  rows: MultiEntryRow[];
  onRowsChange: (rows: MultiEntryRow[]) => void;
  showActions?: boolean;
  existingEntries?: any[];
}

export default function MultiEntryTable({
  fieldDefinitions,
  rows,
  onRowsChange,
  showActions = true,
  existingEntries = [],
}: MultiEntryTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [focusedCell, setFocusedCell] = useState<{
    rowId: string;
    fieldKey: string;
  } | null>(null);

  const editableFields = fieldDefinitions.filter(
    (field) => !field.isRelation && field.key !== "id"
  );

  const totalPages = Math.ceil(rows.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const displayedRows = rows.slice(startIndex, endIndex);

  const getAutocompleteOptions = useMemo(() => {
    const fieldOptionsMap: Record<string, SelectOption[]> = {};

    editableFields.forEach((field) => {
      if (!existingEntries.length) {
        fieldOptionsMap[field.key] = [];
        return;
      }

      const uniqueValues = new Map<string, any>();
      existingEntries.forEach((entry) => {
        const value = entry[field.key];
        if (value && typeof value === "string" && value.trim()) {
          const trimmedValue = value.trim();
          if (!uniqueValues.has(trimmedValue)) {
            uniqueValues.set(trimmedValue, entry);
          }
        }
      });

      fieldOptionsMap[field.key] = Array.from(uniqueValues.entries())
        .map(([value, entry]) => ({
          id: `${field.key}-${value}`,
          label: value,
          entry: entry,
        }))
        .sort((a, b) => a.label.localeCompare(b.label));
    });

    return fieldOptionsMap;
  }, [existingEntries, editableFields]);

  const handleKeyDown = (
    e: React.KeyboardEvent,
    rowId: string,
    fieldKey: string
  ) => {
    if (e.key === "Escape") {
      return;
    }

    if (!focusedCell) return;

    const currentRowIndex = displayedRows.findIndex((row) => row.id === rowId);
    const currentFieldIndex = editableFields.findIndex(
      (field) => field.key === fieldKey
    );

    if (e.key === "Tab") {
      e.preventDefault();
      if (e.shiftKey) {
        if (currentFieldIndex > 0) {
          const newField = editableFields[currentFieldIndex - 1];
          setFocusedCell({ rowId, fieldKey: newField.key });
          focusCell(rowId, newField.key);
        } else if (currentRowIndex > 0) {
          const prevRow = displayedRows[currentRowIndex - 1];
          const lastField = editableFields[editableFields.length - 1];
          setFocusedCell({ rowId: prevRow.id, fieldKey: lastField.key });
          focusCell(prevRow.id, lastField.key);
        }
      } else {
        if (currentFieldIndex < editableFields.length - 1) {
          const newField = editableFields[currentFieldIndex + 1];
          setFocusedCell({ rowId, fieldKey: newField.key });
          focusCell(rowId, newField.key);
        } else if (currentRowIndex < displayedRows.length - 1) {
          const nextRow = displayedRows[currentRowIndex + 1];
          const firstField = editableFields[0];
          setFocusedCell({ rowId: nextRow.id, fieldKey: firstField.key });
          focusCell(nextRow.id, firstField.key);
        }
      }
    } else if (e.key === "ArrowUp" && e.altKey) {
      e.preventDefault();
      if (currentRowIndex > 0) {
        const prevRow = displayedRows[currentRowIndex - 1];
        setFocusedCell({ rowId: prevRow.id, fieldKey });
        focusCell(prevRow.id, fieldKey);
      }
    } else if (e.key === "ArrowDown" && e.altKey) {
      e.preventDefault();
      if (currentRowIndex < displayedRows.length - 1) {
        const nextRow = displayedRows[currentRowIndex + 1];
        setFocusedCell({ rowId: nextRow.id, fieldKey });
        focusCell(nextRow.id, fieldKey);
      }
    } else if (e.key === "ArrowLeft" && e.altKey) {
      e.preventDefault();
      if (currentFieldIndex > 0) {
        const prevField = editableFields[currentFieldIndex - 1];
        setFocusedCell({ rowId, fieldKey: prevField.key });
        focusCell(rowId, prevField.key);
      }
    } else if (e.key === "ArrowRight" && e.altKey) {
      e.preventDefault();
      if (currentFieldIndex < editableFields.length - 1) {
        const nextField = editableFields[currentFieldIndex + 1];
        setFocusedCell({ rowId, fieldKey: nextField.key });
        focusCell(rowId, nextField.key);
      }
    } else if (e.key === "Enter" && e.altKey) {
      e.preventDefault();
      addNewRow();
    }
  };

  const focusCell = (rowId: string, fieldKey: string) => {
    setTimeout(() => {
      const element = document.querySelector(
        `[data-cell="${rowId}-${fieldKey}"] input, [data-cell="${rowId}-${fieldKey}"] textarea`
      );
      if (element instanceof HTMLElement) {
        element.focus();
      }
    }, 0);
  };

  const handleEnhancedAutocompleteSelect = (
    rowId: string,
    fieldKey: string,
    option: SelectOption & { [key: string]: any }
  ) => {
    const updatedData = { ...rows.find((row) => row.id === rowId)?.data };

    updatedData[fieldKey] = option.label;

    if (fieldKey === "description" && option.entry) {
      if (option.entry.category) {
        updatedData.category = option.entry.category;
      }
      if (option.entry.tags) {
        updatedData.tags = option.entry.tags;
      }
    } else if (fieldKey === "account_name" && option.entry) {
      if (option.entry.account_type) {
        updatedData.account_type = option.entry.account_type;
      }
      if (option.entry.account_owner) {
        updatedData.account_owner = option.entry.account_owner;
      }
    } else if (fieldKey === "deduction_type" && option.entry) {
      if (option.entry.category) {
        updatedData.category = option.entry.category;
      }
    }

    onRowsChange(
      rows.map((row) => {
        if (row.id === rowId) {
          const errors = validateRow(updatedData);
          return {
            ...row,
            data: updatedData,
            errors,
            isValid: Object.keys(errors).length === 0,
          };
        }
        return row;
      })
    );
  };

  const renderEnhancedAutocompleteItem = (
    fieldKey: string,
    option: SelectOption & { [key: string]: any }
  ) => {
    const relatedFields =
      fieldKey === "description"
        ? ["category", "tags"]
        : fieldKey === "account_name"
          ? ["account_type", "account_owner"]
          : fieldKey === "deduction_type"
            ? ["category"]
            : [];

    return (
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="font-medium">{option.label}</span>
        </div>
        {relatedFields.some((field) => option.entry?.[field]) && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {relatedFields.map((fieldName, index) => {
              const value = option.entry?.[fieldName];
              if (!value) return null;

              const colors = [
                "bg-blue-100 text-blue-800",
                "bg-green-100 text-green-800",
                "bg-purple-100 text-purple-800",
              ];
              const colorClass = colors[index % colors.length];

              return (
                <span
                  key={fieldName}
                  className={`px-2 py-0.5 rounded ${colorClass}`}
                >
                  {value}
                </span>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const addNewRow = () => {
    const newRow: MultiEntryRow = {
      id: `temp-${Date.now()}-${Math.random()}`,
      data: {},
      isValid: false,
      errors: {},
    };

    editableFields.forEach((field) => {
      if (field.type === "date") {
        newRow.data[field.key] = format(new Date(), "yyyy-MM-dd");
      } else if (field.type === "number") {
        newRow.data[field.key] = "";
      } else if (field.type === "boolean") {
        newRow.data[field.key] = false;
      } else {
        newRow.data[field.key] = "";
      }
    });

    const newRows = [...rows, newRow];
    onRowsChange(newRows);

    const newTotalPages = Math.ceil(newRows.length / itemsPerPage);
    setCurrentPage(newTotalPages);
  };

  const removeRow = (rowId: string) => {
    onRowsChange(rows.filter((row) => row.id !== rowId));
  };

  const duplicateRow = (rowId: string) => {
    const rowToDuplicate = rows.find((row) => row.id === rowId);
    if (!rowToDuplicate) return;

    const newRow: MultiEntryRow = {
      id: `temp-${Date.now()}-${Math.random()}`,
      data: { ...rowToDuplicate.data },
      isValid: rowToDuplicate.isValid,
      errors: {},
    };

    onRowsChange([...rows, newRow]);
  };

  const updateRowData = (rowId: string, fieldKey: string, value: any) => {
    onRowsChange(
      rows.map((row) => {
        if (row.id === rowId) {
          const updatedData = { ...row.data, [fieldKey]: value };
          const errors = validateRow(updatedData);
          return {
            ...row,
            data: updatedData,
            errors,
            isValid: Object.keys(errors).length === 0,
          };
        }
        return row;
      })
    );
  };

  const validateRow = (data: Record<string, any>): Record<string, string> => {
    const errors: Record<string, string> = {};

    editableFields.forEach((field) => {
      if (!field.isOptional && !data[field.key]) {
        errors[field.key] = "Required";
      }

      if (field.type === "number" && data[field.key]) {
        const num = Number(data[field.key]);
        if (isNaN(num)) {
          errors[field.key] = "Must be a number";
        }
      }
    });

    return errors;
  };

  useEffect(() => {
    if (rows.length === 0) {
      const newRow: MultiEntryRow = {
        id: `temp-${Date.now()}-${Math.random()}`,
        data: {},
        isValid: false,
        errors: {},
      };

      editableFields.forEach((field) => {
        if (field.type === "date") {
          newRow.data[field.key] = format(new Date(), "yyyy-MM-dd");
        } else if (field.type === "number") {
          newRow.data[field.key] = "";
        } else if (field.type === "boolean") {
          newRow.data[field.key] = false;
        } else {
          newRow.data[field.key] = "";
        }
      });

      onRowsChange([newRow]);
    }
  }, [rows.length, editableFields, onRowsChange]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Rows per page:</span>
          <ReusableSelect
            options={[
              { id: "5", label: "5" },
              { id: "10", label: "10" },
              { id: "20", label: "20" },
              { id: "50", label: "50" },
            ]}
            value={itemsPerPage.toString()}
            onChange={(value) => {
              setItemsPerPage(Number(value));
              setCurrentPage(1);
            }}
            triggerClassName="w-20"
          />
          <TooltipProvider>
            <Tooltip delayDuration={100}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-muted"
                >
                  <Keyboard className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent
                side="bottom"
                align="start"
                className="max-w-sm z-[99999] bg-popover text-popover-foreground border shadow-lg"
                sideOffset={12}
                avoidCollisions={true}
                sticky="always"
              >
                <div className="space-y-2 text-sm p-1">
                  <div className="font-medium">Keyboard shortcuts:</div>
                  <div>
                    •{" "}
                    <kbd className="px-1 py-0.5 bg-background border rounded text-xs">
                      Tab
                    </kbd>{" "}
                    /{" "}
                    <kbd className="px-1 py-0.5 bg-background border rounded text-xs">
                      Shift+Tab
                    </kbd>{" "}
                    - Navigate between fields
                  </div>
                  <div>
                    •{" "}
                    <kbd className="px-1 py-0.5 bg-background border rounded text-xs">
                      Alt+↑
                    </kbd>{" "}
                    /{" "}
                    <kbd className="px-1 py-0.5 bg-background border rounded text-xs">
                      Alt+↓
                    </kbd>{" "}
                    /{" "}
                    <kbd className="px-1 py-0.5 bg-background border rounded text-xs">
                      Alt+←
                    </kbd>{" "}
                    /{" "}
                    <kbd className="px-1 py-0.5 bg-background border rounded text-xs">
                      Alt+→
                    </kbd>{" "}
                    - Navigate table
                  </div>
                  <div>
                    •{" "}
                    <kbd className="px-1 py-0.5 bg-background border rounded text-xs">
                      Alt+Enter
                    </kbd>{" "}
                    - Add new row
                  </div>
                  <div>
                    •{" "}
                    <kbd className="px-1 py-0.5 bg-background border rounded text-xs">
                      Alt+Shift
                    </kbd>{" "}
                    - Hide autocomplete suggestions
                  </div>
                  <div>
                    •{" "}
                    <kbd className="px-1 py-0.5 bg-background border rounded text-xs">
                      Esc
                    </kbd>{" "}
                    - Close dialog
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages} ({rows.length} total rows)
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setCurrentPage((prev) => Math.min(totalPages, prev + 1))
              }
              disabled={currentPage === totalPages}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="rounded-md border max-h-[40vh] overflow-auto pr-2">
        <Table>
          <TableHeader className="sticky top-0 bg-background z-10">
            <TableRow>
              {editableFields.map((field) => (
                <TableHead key={field.key} className="min-w-[200px]">
                  <div className="flex items-center gap-1">
                    <span>{field.displayName}</span>
                    {!field.isOptional && (
                      <span className="text-xs text-red-500">*</span>
                    )}
                  </div>
                </TableHead>
              ))}
              {showActions && (
                <TableHead className="w-[100px]">Actions</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayedRows.map((row, displayIndex) => (
              <TableRow
                key={row.id}
                className={cn(
                  displayIndex % 2 === 0 ? "bg-background" : "bg-muted/30"
                )}
              >
                {editableFields.map((field) => (
                  <TableCell
                    key={field.key}
                    className="p-2"
                    data-cell={`${row.id}-${field.key}`}
                  >
                    {field.type === "date" ? (
                      <Input
                        type="date"
                        value={row.data[field.key] || ""}
                        onChange={(e) =>
                          updateRowData(row.id, field.key, e.target.value)
                        }
                        onKeyDown={(e) => handleKeyDown(e, row.id, field.key)}
                        onFocus={() =>
                          setFocusedCell({ rowId: row.id, fieldKey: field.key })
                        }
                        className={
                          row.errors[field.key] ? "border-red-500" : ""
                        }
                      />
                    ) : field.type === "number" ? (
                      <div className="space-y-1">
                        <div className="flex items-center gap-1">
                          {field.unit && (
                            <span className="text-sm">{field.unit}</span>
                          )}
                          <Input
                            type="number"
                            step="0.01"
                            value={row.data[field.key] || ""}
                            onChange={(e) =>
                              updateRowData(row.id, field.key, e.target.value)
                            }
                            onKeyDown={(e) =>
                              handleKeyDown(e, row.id, field.key)
                            }
                            onFocus={() =>
                              setFocusedCell({
                                rowId: row.id,
                                fieldKey: field.key,
                              })
                            }
                            placeholder={field.displayName}
                            className={
                              row.errors[field.key] ? "border-red-500" : ""
                            }
                          />
                        </div>
                      </div>
                    ) : field.type === "boolean" ? (
                      <input
                        type="checkbox"
                        checked={row.data[field.key] || false}
                        onChange={(e) =>
                          updateRowData(row.id, field.key, e.target.checked)
                        }
                        onKeyDown={(e) => handleKeyDown(e, row.id, field.key)}
                        onFocus={() =>
                          setFocusedCell({ rowId: row.id, fieldKey: field.key })
                        }
                        className="h-4 w-4"
                      />
                    ) : field.type === "tags" ? (
                      <TagInput
                        value={row.data[field.key] || ""}
                        onChange={(value) =>
                          updateRowData(row.id, field.key, value)
                        }
                        generalData={existingEntries}
                        generalDataTagField="tags"
                        showLabel={false}
                        usePortal={true}
                        dropdownPosition="top"
                        className={
                          row.errors[field.key] ? "border-red-500" : ""
                        }
                        onKeyDown={(e) => handleKeyDown(e, row.id, field.key)}
                        onFocus={() =>
                          setFocusedCell({ rowId: row.id, fieldKey: field.key })
                        }
                      />
                    ) : field.key === "description" ||
                      field.key === "account_name" ||
                      field.key === "deduction_type" ? (
                      <AutocompleteInput
                        value={row.data[field.key] || ""}
                        onChange={(value) =>
                          updateRowData(row.id, field.key, value)
                        }
                        onSelect={(option) =>
                          handleEnhancedAutocompleteSelect(
                            row.id,
                            field.key,
                            option
                          )
                        }
                        options={
                          (getAutocompleteOptions[field.key] ||
                            []) as (SelectOption & { [key: string]: unknown })[]
                        }
                        placeholder={field.displayName}
                        inputClassName={
                          row.errors[field.key] ? "border-red-500" : ""
                        }
                        showRecentOptions={true}
                        maxRecentOptions={5}
                        emptyMessage={`Type to add new ${field.displayName.toLowerCase()}`}
                        renderItem={(option) =>
                          renderEnhancedAutocompleteItem(field.key, option)
                        }
                        dropdownPosition="top"
                        usePortal={true}
                        onKeyDown={(e) => handleKeyDown(e, row.id, field.key)}
                        onFocus={() =>
                          setFocusedCell({ rowId: row.id, fieldKey: field.key })
                        }
                      />
                    ) : field.type === "autocomplete" ||
                      field.key === "category" ||
                      field.key === "account_type" ||
                      field.key === "account_owner" ? (
                      <AutocompleteInput
                        value={row.data[field.key] || ""}
                        onChange={(value) =>
                          updateRowData(row.id, field.key, value)
                        }
                        options={
                          (getAutocompleteOptions[field.key] ||
                            []) as (SelectOption & { [key: string]: unknown })[]
                        }
                        placeholder={field.displayName}
                        inputClassName={
                          row.errors[field.key] ? "border-red-500" : ""
                        }
                        showRecentOptions={true}
                        maxRecentOptions={5}
                        emptyMessage={`Type to add new ${field.displayName.toLowerCase()}`}
                        usePortal={true}
                        dropdownPosition="top"
                        onKeyDown={(e) => handleKeyDown(e, row.id, field.key)}
                        onFocus={() =>
                          setFocusedCell({ rowId: row.id, fieldKey: field.key })
                        }
                      />
                    ) : (
                      <Input
                        value={row.data[field.key] || ""}
                        onChange={(e) =>
                          updateRowData(row.id, field.key, e.target.value)
                        }
                        onKeyDown={(e) => handleKeyDown(e, row.id, field.key)}
                        onFocus={() =>
                          setFocusedCell({ rowId: row.id, fieldKey: field.key })
                        }
                        placeholder={field.displayName}
                        className={
                          row.errors[field.key] ? "border-red-500" : ""
                        }
                      />
                    )}
                    {row.errors[field.key] && (
                      <span className="text-xs text-red-500">
                        {row.errors[field.key]}
                      </span>
                    )}
                  </TableCell>
                ))}
                {showActions && (
                  <TableCell className="p-2">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => duplicateRow(row.id)}
                        className="h-8 w-8 p-0"
                        title="Duplicate row"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      {rows.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeRow(row.id)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                          title="Remove row"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {showActions && (
        <Button
          variant="outline"
          size="sm"
          onClick={addNewRow}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Row
        </Button>
      )}

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Showing {startIndex + 1}-{Math.min(endIndex, rows.length)} of{" "}
          {rows.length} row(s)
        </span>
        <span>
          {rows.filter((r) => r.isValid).length} valid /{" "}
          {rows.filter((r) => !r.isValid).length} invalid
        </span>
      </div>
    </div>
  );
}
