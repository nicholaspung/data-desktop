// src/features/dexa/visualization/comparison-selector.tsx
import { useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import ReusableSelect from "@/components/reusable/reusable-select";
import { ViewMode } from "../dexa";
import { DEXAScan } from "@/store/dexa-definitions";

export const ComparisonSelector = ({
  data,
  viewMode,
  onViewModeChange,
  selectedDate,
  comparisonDate,
  onSelectedDateChange,
  onComparisonDateChange,
}: {
  data: DEXAScan[];
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  selectedDate: string;
  comparisonDate: string;
  onSelectedDateChange: (date: string) => void;
  onComparisonDateChange: (date: string) => void;
}) => {
  // Create date options from the data
  const dateOptions = data
    .filter((item) => item.date)
    .map((scan) => ({
      value: scan.id,
      label: format(new Date(scan.date), "MMM d, yyyy"),
      date: new Date(scan.date),
    }))
    .sort((a, b) => b.date.getTime() - a.date.getTime()); // Sort newest first

  // Set defaults when component loads or data changes
  useEffect(() => {
    if (dateOptions.length > 0 && !selectedDate) {
      onSelectedDateChange(dateOptions[0].value ?? "");

      // Set default comparison date to second most recent if available
      if (dateOptions.length > 1 && !comparisonDate) {
        onComparisonDateChange(dateOptions[1].value ?? "");
      }
    }
  }, [data, selectedDate, comparisonDate]);

  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">View:</span>
            <ReusableSelect
              options={[
                { id: "single", label: "Single Date" },
                { id: "comparison", label: "Compare Dates" },
              ]}
              value={viewMode}
              onChange={(value: any) => onViewModeChange(value)}
              title={"view"}
              triggerClassName={"w-[160px]"}
            />
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">
              {viewMode === "comparison" ? "Primary" : "Date"}:
            </span>
            <ReusableSelect
              options={dateOptions.map((option) => ({
                id: option.value,
                label: option.label,
              }))}
              value={selectedDate}
              onChange={onSelectedDateChange}
              title={"date"}
              triggerClassName={"w-[180px]"}
            />
          </div>

          {viewMode === "comparison" && (
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">Compare to:</span>
              <ReusableSelect
                options={dateOptions
                  .filter((option) => option.value !== selectedDate)
                  .map((el) => ({ id: el.value, label: el.label }))}
                value={comparisonDate}
                onChange={onComparisonDateChange}
                title={"comparison date"}
                triggerClassName={"w-[180px]"}
                disabled={dateOptions.length <= 1}
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
