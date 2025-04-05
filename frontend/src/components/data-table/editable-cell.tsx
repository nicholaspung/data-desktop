import { FieldDefinition } from "@/types";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { useEffect, useState } from "react";
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

interface EditableCellProps {
  value: any;
  row: any;
  column: any;
  field: FieldDefinition;
  width?: string;
  onValueChange: (value: any) => void;
}

// Enhanced EditableCell component with relation field support
const EditableCell: React.FC<EditableCellProps> = ({
  value,
  row,
  column,
  field,
  width,
  onValueChange,
}) => {
  const [editValue, setEditValue] = useState(value);
  const [relationOptions, setRelationOptions] = useState<
    { id: string; label: string }[]
  >([]);
  const [isLoadingRelations, setIsLoadingRelations] = useState(false);
  const originalValue = value; // Store the original value for reference

  useEffect(() => {
    setEditValue(value);

    // Load relation options if this is a relation field
    if (field.isRelation && field.relatedDataset) {
      loadRelationOptions();
    }
  }, [value, field]);

  // Load options for relation fields
  const loadRelationOptions = async () => {
    if (!field.relatedDataset) return;

    setIsLoadingRelations(true);

    try {
      const records = await ApiService.getRecords(field.relatedDataset);

      // Transform records to options with id and label
      const options = records.map((record: any) => {
        let label = "";

        // Special handling for bloodwork
        if (field.relatedDataset === "bloodwork" && record.date) {
          const testDate = new Date(record.date).toLocaleDateString();
          label = testDate;
          if (record.lab_name && record.lab_name.trim() !== "") {
            label += ` - ${record.lab_name}`;
          }
        }
        // Special handling for blood markers
        else if (field.relatedDataset === "blood_markers") {
          label = record.name || "Unnamed";
          if (record.unit && record.unit.trim() !== "") {
            label += ` (${record.unit})`;
          }
        }
        // Use displayField from field definition if provided
        else if (
          field.displayField &&
          record[field.displayField] !== undefined
        ) {
          label = record[field.displayField] || "";

          // Add secondary field if available
          if (
            field.secondaryDisplayField &&
            record[field.secondaryDisplayField] !== undefined &&
            record[field.secondaryDisplayField] !== ""
          ) {
            label += ` - ${record[field.secondaryDisplayField]}`;
          }
        }
        // Generic fallback
        else {
          label = record.name || record.title || `ID: ${record.id}`;
        }

        return {
          id: record.id,
          label,
        };
      });

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

  const handleValueChange = (newValue: any) => {
    setEditValue(newValue);
    onValueChange(newValue);
  };

  // Format the original value based on field type for display
  const getFormattedOriginalValue = () => {
    // If it's a relation field, we need special handling
    if (field.isRelation && field.relatedDataset) {
      // Look for this relation's data in the row
      const relatedDataKey = `${column.id}_data`;
      const relatedData = row.original[relatedDataKey];

      if (relatedData) {
        // Create a formatted label based on the relation type
        if (field.relatedDataset === "bloodwork" && relatedData.date) {
          const dateStr = new Date(relatedData.date).toLocaleDateString();
          return relatedData.lab_name
            ? `${dateStr} - ${relatedData.lab_name}`
            : dateStr;
        } else if (field.relatedDataset === "blood_markers") {
          return relatedData.unit
            ? `${relatedData.name || "Unnamed"} (${relatedData.unit})`
            : relatedData.name || "Unnamed";
        } else if (field.displayField) {
          const primary = relatedData[field.displayField] || "";
          const secondary = field.secondaryDisplayField
            ? relatedData[field.secondaryDisplayField]
            : "";

          return secondary ? `${primary} - ${secondary}` : primary;
        }

        return relatedData.name || relatedData.title || `ID: ${originalValue}`;
      }

      return originalValue ? `ID: ${originalValue}` : "N/A";
    }

    // Regular field formatting
    switch (field.type) {
      case "date":
        return originalValue instanceof Date
          ? format(new Date(originalValue), "PP")
          : originalValue
            ? format(new Date(originalValue), "PP")
            : "N/A";
      case "boolean":
        return originalValue ? "Yes" : "No";
      case "number":
        return typeof originalValue === "number"
          ? `${originalValue.toFixed(2)}${field.unit ? ` ${field.unit}` : ""}`
          : "0";
      case "percentage":
        return typeof originalValue === "number"
          ? `${(originalValue < 1 ? originalValue * 100 : originalValue).toFixed(2)}%`
          : "0%";
      case "text":
      default:
        return originalValue || "";
    }
  };

  // Default width styles for all cell types
  const cellStyle = {
    width: width || "auto",
    minWidth: "80px",
    maxWidth: "100%",
  };

  // Small label for original value
  const OriginalValueLabel = () => (
    <div
      className="text-xs text-muted-foreground mb-1 truncate"
      title={getFormattedOriginalValue()}
    >
      Original: {getFormattedOriginalValue()}
    </div>
  );

  // Render relation field dropdown
  if (field.isRelation && field.relatedDataset) {
    return (
      <div style={cellStyle}>
        <OriginalValueLabel />
        <Select
          value={editValue?.toString() || ""}
          onValueChange={handleValueChange}
          disabled={isLoadingRelations}
        >
          <SelectTrigger className="w-full h-8">
            <SelectValue
              placeholder={
                isLoadingRelations
                  ? "Loading..."
                  : `Select ${field.displayName}`
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
      </div>
    );
  }

  // Render appropriate editor based on field type
  switch (field.type) {
    case "text":
      return (
        <div style={cellStyle}>
          <OriginalValueLabel />
          <Input
            value={editValue || ""}
            onChange={(e) => handleValueChange(e.target.value)}
            className="h-8 w-full"
          />
        </div>
      );
    case "number":
    case "percentage":
      return (
        <div style={cellStyle}>
          <OriginalValueLabel />
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
          />
        </div>
      );
    case "boolean":
      return (
        <div style={cellStyle}>
          <div className="text-xs text-muted-foreground mb-1 text-center">
            Original: {originalValue ? "Yes" : "No"}
          </div>
          <div className="flex justify-center">
            <Checkbox
              checked={!!editValue}
              onCheckedChange={(checked) => handleValueChange(!!checked)}
            />
          </div>
        </div>
      );
    case "date":
      return (
        <div style={cellStyle}>
          <OriginalValueLabel />
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
        </div>
      );
    default:
      return <span style={cellStyle}>{value}</span>;
  }
};

export default EditableCell;
