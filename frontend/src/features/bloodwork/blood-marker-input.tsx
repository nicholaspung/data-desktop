// src/features/bloodwork/blood-marker-input.tsx
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { BloodMarker } from "./bloodwork";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export default function BloodMarkerInput({
  marker,
  value,
  valueType = "number",
  onChange,
  disabled = false,
  isExisting = false,
}: {
  marker: BloodMarker;
  value: string | number;
  valueType: "number" | "text";
  onChange: (value: string | number, valueType: "number" | "text") => void;
  disabled?: boolean;
  isExisting?: boolean;
}) {
  // Keep track of the selected input type
  const [activeType, setActiveType] = useState<"number" | "text">(valueType);

  // Helper to format range display
  const formatRange = (low?: number, high?: number, general?: string) => {
    if (general) return general;
    if (low !== undefined && high !== undefined) return `${low} - ${high}`;
    if (low !== undefined) return `> ${low}`;
    if (high !== undefined) return `< ${high}`;
    return "No range set";
  };

  // Display reference and optimal ranges
  const referenceRange = formatRange(
    marker.lower_reference,
    marker.upper_reference,
    marker.general_reference
  );

  const optimalRange = formatRange(
    marker.optimal_low,
    marker.optimal_high,
    marker.optimal_general
  );

  // Handle type change
  const handleTypeChange = (newType: string) => {
    if (disabled) return;
    setActiveType(newType as "number" | "text");
    onChange("", newType as "number" | "text");
  };

  return (
    <div
      className={cn(
        "p-3 border-b flex flex-col sm:flex-row gap-2",
        disabled ? "bg-gray-50 dark:bg-gray-900" : "hover:bg-muted/30"
      )}
    >
      <div className="flex-1">
        <div className="font-medium text-sm flex items-center gap-2">
          {marker.name}
          {isExisting && (
            <Badge variant="outline" className="text-xs">
              Existing
            </Badge>
          )}
        </div>
        <div className="text-xs text-muted-foreground flex flex-wrap gap-x-4">
          {marker.unit && <span>Unit: {marker.unit}</span>}
          {referenceRange !== "No range set" && (
            <span>Reference: {referenceRange}</span>
          )}
          {optimalRange !== "No range set" && (
            <span>Optimal: {optimalRange}</span>
          )}
        </div>
      </div>

      <div className="w-full sm:w-[280px] flex flex-col">
        <div className="flex items-center gap-2 mb-1">
          <RadioGroup
            value={activeType}
            onValueChange={handleTypeChange}
            className="flex flex-row gap-4"
            disabled={disabled}
          >
            <div className="flex items-center space-x-1">
              <RadioGroupItem value="number" id={`number-${marker.id}`} />
              <Label htmlFor={`number-${marker.id}`} className="text-xs">
                Number
              </Label>
            </div>
            <div className="flex items-center space-x-1">
              <RadioGroupItem value="text" id={`text-${marker.id}`} />
              <Label htmlFor={`text-${marker.id}`} className="text-xs">
                Text
              </Label>
            </div>
          </RadioGroup>
        </div>

        <div className="flex gap-2">
          {activeType === "number" ? (
            <Input
              type="number"
              inputMode="decimal"
              value={value}
              onChange={(e) => onChange(e.target.value, "number")}
              placeholder="0.0"
              className="h-8"
              disabled={disabled}
            />
          ) : (
            <Input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value, "text")}
              placeholder="Text result"
              className="h-8"
              disabled={disabled}
            />
          )}
        </div>
      </div>
    </div>
  );
}
