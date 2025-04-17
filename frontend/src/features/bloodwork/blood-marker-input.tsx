// src/features/bloodwork/blood-marker-input.tsx
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { BloodMarker } from "./bloodwork";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function BloodMarkerInput({
  marker,
  value,
  valueType = "number",
  onChange,
}: {
  marker: BloodMarker;
  value: string | number;
  valueType: "number" | "text";
  onChange: (value: string | number, valueType: "number" | "text") => void;
}) {
  // Choose initial tab based on marker characteristics
  const initialTab = marker.general_reference ? "text" : valueType || "number";

  const [activeTab, setActiveTab] = useState<"number" | "text">(
    initialTab as "number" | "text"
  );

  // Handle tab change
  const handleTabChange = (tab: string) => {
    setActiveTab(tab as "number" | "text");

    // Clear value when switching tabs
    onChange("", tab as "number" | "text");
  };

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

  return (
    <div className="p-3 border-b flex flex-col sm:flex-row gap-2 hover:bg-muted/30">
      <div className="flex-1">
        <div className="font-medium text-sm">{marker.name}</div>
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

      <div className="w-full sm:w-[180px]">
        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2 h-8">
            <TabsTrigger value="number" className="text-xs">
              Number
            </TabsTrigger>
            <TabsTrigger value="text" className="text-xs">
              Text
            </TabsTrigger>
          </TabsList>
          <TabsContent value="number" className="mt-1">
            <Input
              type="number"
              inputMode="decimal"
              value={activeTab === "number" ? value : ""}
              onChange={(e) => onChange(e.target.value, "number")}
              placeholder="0.0"
              className="h-8"
            />
          </TabsContent>
          <TabsContent value="text" className="mt-1">
            <Input
              type="text"
              value={activeTab === "text" ? value : ""}
              onChange={(e) => onChange(e.target.value, "text")}
              placeholder="Text result"
              className="h-8"
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
