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
import { Loader2 } from "lucide-react";
import { generateOptionsForLoadRelationOptions } from "@/lib/edit-utils";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import EditableCellConfirmButtons from "./editable-cell-confirm-buttons";

interface EditableCellProps {
  value: any;
  row: any;
  column: any;
  field: FieldDefinition;
  width?: string;
  datasetId: string;
  onDataChange?: () => void;
}

const EditableCell: React.FC<EditableCellProps> = ({
  value: initialValue,
  row,
  column,
  field,
  width,
  onDataChange,
}) => {
  // State for editing mode and value
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(initialValue);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const originalValue = initialValue;
  const cellRef = useRef<HTMLDivElement>(null);

  // State for relation fields
  const [relationOptions, setRelationOptions] = useState<
    { id: string; label: string }[]
  >([]);
  const [isLoadingRelations, setIsLoadingRelations] = useState(false);

  // Handle outside click to exit edit mode
  useEffect(() => {
    if (!isEditing) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (cellRef.current && !cellRef.current.contains(event.target as Node)) {
        if (editValue !== initialValue) {
          // If value changed, save it
          handleSave();
        } else {
          // Otherwise just cancel
          setIsEditing(false);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isEditing, editValue, initialValue]);

  // Reset edit value when initialValue changes or when entering edit mode
  useEffect(() => {
    setEditValue(initialValue);
  }, [initialValue]);

  // Enter edit mode
  const handleEdit = () => {
    setIsEditing(true);

    // Load relation options if this is a relation field
    if (field.isRelation && field.relatedDataset) {
      loadRelationOptions();
    }
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
      await ApiService.updateRecord(recordId, updatedRecord);

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

  // Load options for relation fields
  const loadRelationOptions = async () => {
    if (!field.relatedDataset) return;

    setIsLoadingRelations(true);

    try {
      const records = await ApiService.getRecords(field.relatedDataset);

      // Transform records to options with id and label
      const options = generateOptionsForLoadRelationOptions(records, field);

      setRelationOptions(options);
    } catch (error) {
      console.error(
        `Error loading relation options for ${field.relatedDataset}:`,
        error
      );
    } finally {
      setIsLoadingRelations(false);
    }
  };

  // Format the original value based on field type for display
  const getFormattedDisplayValue = (value: any) => {
    // Handle relation fields
    if (field.isRelation && field.relatedDataset) {
      // Look for this relation's data in the row
      const relatedDataKey = `${column.id}_data`;
      const relatedData = row.original[relatedDataKey];

      if (relatedData) {
        // Create a formatted label based on the relation type
        if (field.displayField) {
          const primary = relatedData[field.displayField] || "";
          const secondary = field.secondaryDisplayField
            ? relatedData[field.secondaryDisplayField]
            : "";

          return secondary ? `${primary} - ${secondary}` : primary;
        }

        return relatedData.name || relatedData.title || `ID: ${value}`;
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
  const renderRelationEditMode = () => (
    <>
      <Select
        value={editValue?.toString() || ""}
        onValueChange={handleValueChange}
        disabled={isLoadingRelations || isSubmitting}
      >
        <SelectTrigger className="w-full h-8 text-left">
          <SelectValue
            placeholder={
              isLoadingRelations ? "Loading..." : `Select ${field.displayName}`
            }
          />
        </SelectTrigger>
        <SelectContent>
          {isLoadingRelations ? (
            <div className="flex items-center justify-center p-2">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              <span>Loading options...</span>
            </div>
          ) : relationOptions.length === 0 ? (
            <div className="p-2 text-sm text-muted-foreground">
              No options available
            </div>
          ) : (
            relationOptions.map((option) => (
              <SelectItem key={option.id} value={option.id}>
                {option.label}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </>
  );

  // Render edit mode based on field type
  const renderEditMode = () => {
    // Handle relation fields with dropdown
    if (field.isRelation && field.relatedDataset) {
      return renderRelationEditMode();
    }

    switch (field.type) {
      case "text":
        return (
          <Input
            value={editValue || ""}
            onChange={(e) => handleValueChange(e.target.value)}
            className="h-8 w-full"
            autoFocus
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
          />
        );

      case "boolean":
        return (
          <div className="flex justify-center items-center w-full">
            <Checkbox
              checked={!!editValue}
              onCheckedChange={(checked) => handleValueChange(!!checked)}
            />
          </div>
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
