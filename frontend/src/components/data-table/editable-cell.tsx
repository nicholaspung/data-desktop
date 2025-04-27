import { FieldDefinition } from "@/types/types";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { useEffect, useState, useRef } from "react";
import { Input } from "../ui/input";
import { Checkbox } from "../ui/checkbox";
import { Button } from "../ui/button";
import { ApiService } from "@/services/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { generateOptionsForLoadRelationOptions } from "@/lib/edit-utils";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import EditableCellConfirmButtons from "./editable-cell-confirm-buttons";
import dataStore, { DataStoreName, updateEntry } from "@/store/data-store";
import { useStore } from "@tanstack/react-store";
import { getDisplayValue } from "@/lib/table-utils";
import ReusableSelect from "../reusable/reusable-select";
import ReusableMultiSelect from "../reusable/reusable-multiselect";

const EditableCell = ({
  value: initialValue,
  row,
  column,
  field,
  width,
  onDataChange,
  datasetId,
}: {
  value: any;
  row: any;
  column: any;
  field: FieldDefinition;
  width?: string;
  datasetId: DataStoreName;
  onDataChange?: () => void;
}) => {
  const allData = useStore(dataStore, (state) => state);
  // State for editing mode and value
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(initialValue);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isInteractingWithPopover, setIsInteractingWithPopover] =
    useState(false);
  const originalValue = initialValue;
  const cellRef = useRef<HTMLDivElement>(null);

  // Handle outside click to exit edit mode
  useEffect(() => {
    if (!isEditing) return;

    const handleClickOutside = (event: MouseEvent) => {
      // Skip if we're interacting with a popover or dropdown
      if (isInteractingWithPopover) {
        return;
      }

      if (cellRef.current && !cellRef.current.contains(event.target as Node)) {
        const isPopoverContent = !!document
          .querySelector(".popover-content")
          ?.contains(event.target as Node);
        const isSelectContent =
          !!document
            .querySelector('[role="listbox"]')
            ?.contains(event.target as Node) ||
          !!document
            .querySelector(".select-content")
            ?.contains(event.target as Node);

        // Don't close if clicking on popover content or select dropdown
        if (isPopoverContent || isSelectContent) {
          return;
        }

        // Just cancel when clicking outside - let the confirm buttons handle saving
        handleCancel();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isEditing, isInteractingWithPopover]);

  // Reset edit value when initialValue changes or when entering edit mode
  useEffect(() => {
    setEditValue(initialValue);
  }, [initialValue]);

  // Enter edit mode
  const handleEdit = () => {
    setIsEditing(true);
  };

  // Save changes
  const handleSave = async () => {
    if (editValue === initialValue) {
      setIsEditing(false);
      return;
    }

    setIsSubmitting(true);

    try {
      // Get the record ID
      const recordId = row.original.id;
      if (!recordId) {
        throw new Error("Record ID not found");
      }

      // Get the current record data
      const record = await ApiService.getRecord(recordId);
      if (!record) {
        throw new Error("Record not found");
      }

      // Update only the changed field
      const updatedRecord = {
        ...record,
        [field.key]: editValue,
      };

      // Submit the update
      const response = await ApiService.updateRecord(recordId, updatedRecord);
      if (response) {
        updateEntry(recordId, response, datasetId);
      }

      // Notify success
      toast.success("Cell updated successfully");

      // Trigger data refresh
      if (onDataChange) {
        onDataChange();
      }
    } catch (error) {
      console.error("Error updating cell:", error);
      toast.error("Failed to update cell");

      // Revert to initial value
      setEditValue(initialValue);
    } finally {
      setIsSubmitting(false);
      setIsEditing(false);
    }
  };

  // Cancel edit
  const handleCancel = () => {
    setEditValue(initialValue);
    setIsEditing(false);
  };

  // Handle value change
  const handleValueChange = (newValue: any) => {
    setEditValue(newValue);
  };

  // Format the original value based on field type for display
  const getFormattedDisplayValue = (value: any) => {
    // Handle relation fields
    if (field.isRelation && field.relatedDataset) {
      // Look for this relation's data in the row
      const relatedDataKey = `${column.id}_data`;
      const relatedData = row.original[relatedDataKey];

      if (relatedData) {
        return getDisplayValue(field, relatedData);
      }

      return value ? `ID: ${value}` : "N/A";
    }

    // Regular field formatting
    switch (field.type) {
      case "date":
        return value instanceof Date
          ? format(new Date(value), "PP")
          : value
            ? format(new Date(value), "PP")
            : "N/A";
      case "boolean":
        return value ? "Yes" : "No";
      case "number":
        return typeof value === "number"
          ? `${value.toFixed(2)}${field.unit ? ` ${field.unit}` : ""}`
          : "0";
      case "percentage":
        return typeof value === "number"
          ? `${(value < 1 ? value * 100 : value).toFixed(2)}%`
          : "0%";
      case "select-multiple":
        if (!value || !Array.isArray(value) || value.length === 0) {
          return "—";
        }
        return value.join(", ");
      case "text":
      default:
        return value || "-";
    }
  };

  // Default width styles for all cell types
  const cellStyle = {
    width: width || "auto",
    minWidth: "80px",
    maxWidth: "100%",
  };
  const cellClassName = "flex flex-row gap-1 align-center justify-center";

  // Render edit mode for relation field
  const renderRelationEditMode = (
    options: {
      id: any;
      label: string;
    }[],
    noDefault: boolean
  ) => (
    <>
      <Select
        value={editValue?.toString() || ""}
        onValueChange={(value) => {
          handleValueChange(value);
          // Add a slight delay before allowing outside clicks to close
          setIsInteractingWithPopover(true);
          setTimeout(() => setIsInteractingWithPopover(false), 100);
        }}
        disabled={isSubmitting}
        onOpenChange={(open) => {
          setIsInteractingWithPopover(open);
        }}
      >
        <SelectTrigger
          className="w-full h-8 text-left"
          onClick={(e) => e.stopPropagation()}
        >
          <SelectValue placeholder={`Select ${field.displayName}`} />
        </SelectTrigger>
        <SelectContent onClick={(e) => e.stopPropagation()}>
          {options.length === 0 ? (
            <div className="p-2 text-sm text-muted-foreground">
              No options available
            </div>
          ) : (
            <>
              {noDefault ? null : (
                <SelectItem value="_none_">Select...</SelectItem>
              )}
              {options.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  {option.label}
                </SelectItem>
              ))}
            </>
          )}
        </SelectContent>
      </Select>
    </>
  );

  // Render edit mode based on field type
  const renderEditMode = () => {
    // Handle relation fields with dropdown
    if (field.isRelation && field.relatedDataset) {
      const options = generateOptionsForLoadRelationOptions(
        allData[field.relatedDataset as DataStoreName],
        field
      );
      return renderRelationEditMode(options, field.isOptional ? false : true);
    }

    switch (field.type) {
      case "text":
        return (
          <Input
            value={editValue || ""}
            onChange={(e) => handleValueChange(e.target.value)}
            className="h-8 w-full"
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        );

      case "number":
      case "percentage":
        return (
          <Input
            type="number"
            value={editValue ?? 0}
            onChange={(e) => {
              const val =
                e.target.value === "" ? 0 : parseFloat(e.target.value);
              handleValueChange(isNaN(val) ? 0 : val);
            }}
            className="h-8 w-full"
            step="any"
            min={0}
            max={field.type === "percentage" ? 100 : undefined}
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        );

      case "boolean":
        return (
          <div className="flex justify-center items-center w-full">
            <Checkbox
              checked={!!editValue}
              onCheckedChange={(checked) => handleValueChange(!!checked)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        );

      case "date":
        return (
          <Popover
            open={isEditing && isInteractingWithPopover}
            onOpenChange={(open) => {
              setIsInteractingWithPopover(open);
              // If popover is closing and we didn't explicitly save/cancel, it's an outside click
              if (!open) {
                // Keep the edit mode open even if popover closed
                setIsInteractingWithPopover(false);
              }
            }}
          >
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="h-8 w-full justify-start text-left font-normal"
                onClick={(e) => {
                  e.stopPropagation();
                  // Store a temp copy of the current edit value
                  setIsInteractingWithPopover(true);
                }}
              >
                {editValue ? format(new Date(editValue), "PP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-auto p-0"
              onClick={(e) => e.stopPropagation()}
              sideOffset={5}
              align="start"
            >
              <div className="flex flex-col">
                <Calendar
                  mode="single"
                  selected={editValue ? new Date(editValue) : undefined}
                  onSelect={(date) => {
                    if (date) {
                      // Update the date in the UI without closing
                      handleValueChange(date);
                    }
                  }}
                  initialFocus
                  disabled={(date) =>
                    field.isOptional
                      ? false
                      : date > new Date() || date < new Date("1900-01-01")
                  }
                />
                <div className="flex justify-end gap-2 p-2 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Reset to initial value or temp value if available
                      handleValueChange(initialValue);
                      // Close the popover
                      setIsInteractingWithPopover(false);
                      // Use a ref to access the PopoverClose component programmatically
                      const closeButton = document.querySelector(
                        "[data-radix-popover-close]"
                      );
                      if (closeButton instanceof HTMLElement) {
                        closeButton.click();
                      } else {
                        // Fallback method
                        const event = new KeyboardEvent("keydown", {
                          key: "Escape",
                        });
                        document.dispatchEvent(event);
                      }
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Ensure we're no longer blocking outside clicks
                      setIsInteractingWithPopover(false);
                      // Use a ref to access the PopoverClose component programmatically
                      const closeButton = document.querySelector(
                        "[data-radix-popover-close]"
                      );
                      if (closeButton instanceof HTMLElement) {
                        closeButton.click();
                      } else {
                        // Fallback method
                        const event = new KeyboardEvent("keydown", {
                          key: "Escape",
                        });
                        document.dispatchEvent(event);
                      }
                    }}
                  >
                    Apply
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        );

      case "select-single":
        return (
          <ReusableSelect
            noDefault={field.isOptional ? false : true}
            options={field.options || []}
            value={editValue as string}
            onChange={(value) => setEditValue(value)}
            title={column.id as string}
            triggerClassName="w-full"
          />
        );

      case "select-multiple":
        return (
          <ReusableMultiSelect
            options={field.options || []}
            selected={Array.isArray(editValue) ? editValue : []}
            onChange={(values) => setEditValue(values)}
            title={column.id as string}
          />
        );

      default:
        return <span>{initialValue}</span>;
    }
  };

  // Render the display mode (clickable to edit)
  const renderDisplayMode = () => {
    const formattedValue = getFormattedDisplayValue(initialValue);

    return (
      <div
        className={cn(
          "truncate cursor-pointer hover:bg-muted/50 p-1 rounded transition-colors",
          "flex items-center justify-between",
          "min-h-[30px]" // Ensure minimum height for empty values
        )}
        style={cellStyle}
        onClick={handleEdit}
        title={
          typeof formattedValue === "string" && formattedValue
            ? formattedValue
            : "Click to edit"
        }
      >
        <span className="truncate w-full min-h-[24px]">
          {formattedValue || (
            <span className="text-muted-foreground italic text-xs">
              Empty - click to edit
            </span>
          )}
        </span>
      </div>
    );
  };

  // Small label for original value
  const OriginalValueLabel = () => (
    <div
      className="text-xs text-muted-foreground mb-1 truncate"
      title={getFormattedDisplayValue(originalValue)}
    >
      Original: {getFormattedDisplayValue(originalValue)}
    </div>
  );

  return (
    <div ref={cellRef}>
      {isEditing ? (
        <div style={cellStyle} className="flex flex-col gap-1">
          <OriginalValueLabel />
          <div className={cellClassName}>
            {renderEditMode()}
            <EditableCellConfirmButtons
              handleSave={handleSave}
              handleCancel={handleCancel}
              isSubmitting={isSubmitting}
            />
          </div>
        </div>
      ) : (
        renderDisplayMode()
      )}
    </div>
  );
};

export default EditableCell;
