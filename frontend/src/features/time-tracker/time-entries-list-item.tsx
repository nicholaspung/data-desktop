// src/features/time-tracker/time-entries-list-item.tsx
import { TimeEntry, TimeCategory } from "@/store/time-tracking-definitions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";
import { formatTimeString } from "@/lib/time-utils";
import { ConfirmDeleteDialog } from "@/components/reusable/confirm-delete-dialog";
import { ApiService } from "@/services/api";
import { deleteEntry } from "@/store/data-store";

interface TimeEntryListItemProps {
  entry: TimeEntry;
  category: TimeCategory | null;
  onEdit: () => void;
  onDelete: () => void;
}

export default function TimeEntryListItem({
  entry,
  category,
  onEdit,
  onDelete,
}: TimeEntryListItemProps) {
  const startTime = new Date(entry.start_time);
  const endTime = new Date(entry.end_time);

  const handleDelete = async () => {
    try {
      await ApiService.deleteRecord(entry.id);
      deleteEntry(entry.id, "time_entries");
      onDelete();
    } catch (error) {
      console.error("Error deleting time entry:", error);
    }
  };

  return (
    <div className="flex justify-between items-center py-2 px-3">
      <div className="flex-1 mr-4">
        <div className="flex items-center flex-wrap gap-2">
          <span className="font-medium">{entry.description}</span>
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
            onConfirm={handleDelete}
            size="icon"
            variant="ghost"
          />
        </div>
      </div>
    </div>
  );
}
