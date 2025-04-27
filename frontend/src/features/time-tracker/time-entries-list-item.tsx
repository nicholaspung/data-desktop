// src/features/time-tracker/time-entries-list-item.tsx
import { TimeEntry, TimeCategory } from "@/store/time-tracking-definitions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, AlertTriangle, Clock as ClockIcon } from "lucide-react";
import { formatTimeString } from "@/lib/time-utils";
import { ConfirmDeleteDialog } from "@/components/reusable/confirm-delete-dialog";
import { cn } from "@/lib/utils";
import { Metric } from "@/store/experiment-definitions";

interface TimeEntryListItemProps {
  entry: TimeEntry;
  category: TimeCategory | null;
  metrics: Metric[];
  onEdit: () => void;
  onDelete: () => void;
  isOverlapping?: boolean;
}

export default function TimeEntryListItem({
  entry,
  category,
  metrics,
  onEdit,
  onDelete,
  isOverlapping = false,
}: TimeEntryListItemProps) {
  const startTime = new Date(entry.start_time);
  const endTime = new Date(entry.end_time);

  // Check if this entry is linked to a time metric
  const isTimeMetric = metrics.some(
    (metric) =>
      metric.type === "time" &&
      metric.active &&
      metric.name.toLowerCase() === entry.description.toLowerCase()
  );

  return (
    <div
      className={cn(
        "flex justify-between items-center py-2 px-3 border-l-4 border-grey-400",
        isOverlapping &&
          "bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400",
        isTimeMetric &&
          "bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-400"
      )}
    >
      <div className="flex-1 mr-4">
        <div className="flex items-center flex-wrap gap-2">
          <span className="font-medium">{entry.description}</span>
          {isTimeMetric && (
            <Badge
              variant="outline"
              className="bg-blue-100 dark:bg-blue-900 border-blue-400"
            >
              <ClockIcon className="h-3 w-3 mr-1 text-blue-600 dark:text-blue-400" />
              Time Metric
            </Badge>
          )}
          {isOverlapping && (
            <Badge
              variant="outline"
              className="bg-yellow-100 dark:bg-yellow-900 border-yellow-400"
            >
              <AlertTriangle className="h-3 w-3 mr-1 text-yellow-600 dark:text-yellow-400" />
              Overlap
            </Badge>
          )}
          {category && (
            <Badge
              style={{
                backgroundColor: category.color || "#3b82f6",
              }}
              className="text-white"
            >
              {category.name}
            </Badge>
          )}
          {entry.tags &&
            entry.tags.split(",").map((tag) => (
              <Badge key={tag.trim()} variant="outline" className="text-xs">
                {tag.trim()}
              </Badge>
            ))}
        </div>
      </div>

      <div className="text-right flex items-center gap-3">
        <div>
          <div className="font-medium">{entry.duration_minutes} min</div>
          <div className="text-sm text-muted-foreground">
            {formatTimeString(startTime)} - {formatTimeString(endTime)}
          </div>
        </div>

        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={onEdit}>
            <Edit className="h-4 w-4" />
          </Button>

          <ConfirmDeleteDialog
            title="Delete Time Entry"
            description="Are you sure you want to delete this time entry? This action cannot be undone."
            onConfirm={onDelete}
            size="icon"
            variant="ghost"
          />
        </div>
      </div>
    </div>
  );
}
