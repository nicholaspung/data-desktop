import ReusableCard from "@/components/reusable/reusable-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatTimeString } from "@/lib/time-utils";
import { TimeCategory, TimeEntry } from "@/store/time-tracking-definitions";
import { Calendar, Edit, Trash } from "lucide-react";

export default function TimeEntriesListItem({
  dateStr,
  groupedEntries,
  getCategoryById,
  handleDelete,
  setEditingEntry,
}: {
  dateStr: string;
  groupedEntries: Record<string, TimeEntry[]>;
  getCategoryById: (id?: string) => TimeCategory | null;
  handleDelete: (entry: TimeEntry) => Promise<void>;
  setEditingEntry: React.Dispatch<React.SetStateAction<TimeEntry | null>>;
}) {
  return (
    <ReusableCard
      title={
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          {new Date(dateStr).toLocaleDateString(undefined, {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </div>
      }
      content={
        <div className="space-y-3">
          {groupedEntries[dateStr].map((entry) => {
            const category = getCategoryById(entry.category_id);
            const startTime = new Date(entry.start_time);
            const endTime = new Date(entry.end_time);

            return (
              <div
                key={entry.id}
                className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-2 border-b last:border-b-0"
              >
                <div className="space-y-1 mb-2 sm:mb-0">
                  <div className="font-medium">{entry.description}</div>
                  <div className="text-sm text-muted-foreground">
                    {formatTimeString(startTime)} - {formatTimeString(endTime)}(
                    {entry.duration_minutes} min)
                  </div>
                  <div className="flex flex-wrap gap-2 mt-1">
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
                        <Badge key={tag.trim()} variant="outline">
                          {tag.trim()}
                        </Badge>
                      ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingEntry(entry)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(entry)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      }
    />
  );
}
