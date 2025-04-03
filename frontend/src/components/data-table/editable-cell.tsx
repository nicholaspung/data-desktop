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

interface EditableCellProps {
  value: any;
  row: any;
  column: any;
  field: FieldDefinition;
  width?: string;
  onValueChange: (value: any) => void;
}

// Enhanced EditableCell component with better width handling and original value display
const EditableCell: React.FC<EditableCellProps> = ({
  value,
  // row,
  // column,
  field,
  width,
  onValueChange,
}) => {
  const [editValue, setEditValue] = useState(value);
  const originalValue = value; // Store the original value for reference

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  const handleValueChange = (newValue: any) => {
    setEditValue(newValue);
    onValueChange(newValue);
  };

  // Format the original value based on field type for display
  const getFormattedOriginalValue = () => {
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
