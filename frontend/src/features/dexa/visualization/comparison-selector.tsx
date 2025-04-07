// src/features/dexa/visualization/comparison-selector.tsx
import { useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { DexaScan } from "../dexa-visualization";
import { format } from "date-fns";

export type ViewMode = "single" | "comparison";

interface ComparisonSelectorProps {
  data: DexaScan[];
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  selectedDate: string;
  comparisonDate: string;
  onSelectedDateChange: (date: string) => void;
  onComparisonDateChange: (date: string) => void;
}

export const ComparisonSelector = ({
  data,
  viewMode,
  onViewModeChange,
  selectedDate,
  comparisonDate,
  onSelectedDateChange,
  onComparisonDateChange,
}: ComparisonSelectorProps) => {
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
      onSelectedDateChange(dateOptions[0].value);

      // Set default comparison date to second most recent if available
      if (dateOptions.length > 1 && !comparisonDate) {
        onComparisonDateChange(dateOptions[1].value);
      }
    }
  }, [data, selectedDate, comparisonDate]);

  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">View:</span>
            <Select
              value={viewMode}
              onValueChange={(value: ViewMode) => onViewModeChange(value)}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Select view" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="single">Single Date</SelectItem>
                <SelectItem value="comparison">Compare Dates</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">
              {viewMode === "comparison" ? "Primary" : "Date"}:
            </span>
            <Select
              value={selectedDate}
              onValueChange={onSelectedDateChange}
              disabled={dateOptions.length === 0}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select date" />
              </SelectTrigger>
              <SelectContent>
                {dateOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {viewMode === "comparison" && (
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">Compare to:</span>
              <Select
                value={comparisonDate}
                onValueChange={onComparisonDateChange}
                disabled={dateOptions.length <= 1}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select comparison date" />
                </SelectTrigger>
                <SelectContent>
                  {dateOptions
                    .filter((option) => option.value !== selectedDate)
                    .map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
