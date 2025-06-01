import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

const BloodworkSummary = ({
  summary,
  statusFilter,
  onFilterChange,
  onClearFilter,
}: {
  summary: {
    optimal: number;
    outOfRange: number;
    textValues: number;
    noRange: number;
    noData: number;
    total: number;
  };
  statusFilter: "optimal" | "outOfRange" | "textValues" | "noRange" | null;
  onFilterChange: (
    status: "optimal" | "outOfRange" | "textValues" | "noRange"
  ) => void;
  onClearFilter: () => void;
}) => {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Summary:</span> You
            have {summary.total} blood markers with data available.
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            <div
              onClick={() => onFilterChange("optimal")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full cursor-pointer transition-colors ${
                statusFilter === "optimal"
                  ? "bg-green-100 dark:bg-green-900 border-2 border-green-500"
                  : "border border-green-300 dark:border-green-800 hover:bg-green-50 dark:hover:bg-green-900/50"
              }`}
            >
              <Badge variant="success" className="h-2 w-2 p-0 rounded-full" />
              <span className="text-sm font-medium">
                Optimal: {summary.optimal}
              </span>
            </div>

            <div
              onClick={() => onFilterChange("outOfRange")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full cursor-pointer transition-colors ${
                statusFilter === "outOfRange"
                  ? "bg-red-100 dark:bg-red-900 border-2 border-red-500"
                  : "border border-red-300 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/50"
              }`}
            >
              <Badge
                variant="destructive"
                className="h-2 w-2 p-0 rounded-full"
              />
              <span className="text-sm font-medium">
                Out of Range: {summary.outOfRange}
              </span>
            </div>

            <div
              onClick={() => onFilterChange("textValues")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full cursor-pointer transition-colors ${
                statusFilter === "textValues"
                  ? "bg-blue-100 dark:bg-blue-900 border-2 border-blue-500"
                  : "border border-blue-300 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/50"
              }`}
            >
              <Badge
                variant="outline"
                className="h-2 w-2 p-0 rounded-full bg-blue-500"
              />
              <span className="text-sm font-medium">
                Text Values: {summary.textValues}
              </span>
            </div>

            {/* New filter for markers with no range defined */}
            <div
              onClick={() => onFilterChange("noRange")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full cursor-pointer transition-colors ${
                statusFilter === "noRange"
                  ? "bg-gray-200 dark:bg-gray-700 border-2 border-gray-500"
                  : "border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800/50"
              }`}
            >
              <Badge
                variant="outline"
                className="h-2 w-2 p-0 rounded-full bg-gray-500"
              />
              <span className="text-sm font-medium">
                No Range: {summary.noRange}
              </span>
            </div>

            {statusFilter && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearFilter}
                className="h-8 px-2"
              >
                <X className="h-4 w-4 mr-1" />
                Clear Filter
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BloodworkSummary;
