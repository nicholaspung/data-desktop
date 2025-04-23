// src/features/time-tracker/time-entries-list.tsx
import { useMemo, useState } from "react";
import { TimeEntry, TimeCategory } from "@/store/time-tracking-definitions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash, Calendar, Tag } from "lucide-react";
import { ApiService } from "@/services/api";
import { Skeleton } from "@/components/ui/skeleton";
import EditTimeEntryDialog from "./edit-time-entry-dialog";
import { formatTimeString, groupEntriesByDate } from "@/lib/time-utils";
import { deleteEntry } from "@/store/data-store";
import ReusableSelect from "@/components/reusable/reusable-select";

interface TimeEntriesListProps {
  entries: TimeEntry[];
  categories: TimeCategory[];
  isLoading: boolean;
  onDataChange: () => void;
}

export default function TimeEntriesList({
  entries,
  categories,
  isLoading,
  onDataChange,
}: TimeEntriesListProps) {
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  const [tagFilter, setTagFilter] = useState("");

  // Sort entries by start time, newest first
  const sortedEntries = [...entries].sort((a, b) => {
    return new Date(b.start_time).getTime() - new Date(a.start_time).getTime();
  });

  // Create a filtered entries list based on tag
  const filteredEntries = useMemo(() => {
    if (!tagFilter.trim()) return sortedEntries;

    return sortedEntries.filter((entry) => {
      if (!entry.tags) return false;
      const entryTags = entry.tags
        .split(",")
        .map((tag) => tag.trim().toLowerCase());
      return (
        tagFilter === "_none_" ||
        entryTags.includes(tagFilter.trim().toLowerCase())
      );
    });
  }, [sortedEntries, tagFilter]);

  // Get unique tags with the id/label format needed for ReusableSelect
  const tagOptions = useMemo(() => {
    const uniqueTags = getAllUniqueTags(entries);
    return [...uniqueTags.map((tag) => ({ id: tag, label: tag }))];
  }, [entries]);

  // Helper function to get all unique tags from entries
  function getAllUniqueTags(entries: TimeEntry[]): string[] {
    if (!entries || entries.length === 0) return [];
    const tagsSet = new Set<string>();

    entries.forEach((entry) => {
      if (!entry.tags) return;

      const entryTags = entry.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      entryTags.forEach((tag) => tagsSet.add(tag));
    });

    return Array.from(tagsSet).sort();
  }

  // Use filteredEntries for grouping instead of sortedEntries
  const groupedEntries = groupEntriesByDate(filteredEntries);

  // Group entries by date
  const groupDates = Object.keys(groupedEntries).sort((a, b) =>
    b.localeCompare(a)
  );

  const getCategoryById = (id?: string) => {
    if (!id) return null;
    return categories.find((cat) => cat.id === id) || null;
  };

  const handleDelete = async (entry: TimeEntry) => {
    if (!confirm("Are you sure you want to delete this time entry?")) return;

    try {
      await ApiService.deleteRecord(entry.id);
      deleteEntry(entry.id, "time_entries");
      onDataChange();
    } catch (error) {
      console.error("Error deleting time entry:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-40" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[1, 2].map((j) => (
                  <div key={j} className="flex justify-between">
                    <Skeleton className="h-4 w-60" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-6">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">
              No time entries yet. Start tracking your time!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 mb-4">
        <Tag className="h-4 w-4 text-muted-foreground" />
        <div className="text-sm font-medium">Filter by tag:</div>
        <ReusableSelect
          options={tagOptions}
          value={tagFilter}
          onChange={setTagFilter}
          placeholder="Filter by tag"
          triggerClassName="w-[180px]"
          noDefault={false}
        />
      </div>

      {editingEntry && (
        <EditTimeEntryDialog
          entry={editingEntry}
          categories={categories}
          onSave={() => {
            setEditingEntry(null);
            onDataChange();
          }}
          onCancel={() => setEditingEntry(null)}
        />
      )}

      {groupDates.map((dateStr) => (
        <Card key={dateStr}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {new Date(dateStr).toLocaleDateString(undefined, {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </CardTitle>
          </CardHeader>
          <CardContent>
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
                        {formatTimeString(startTime)} -{" "}
                        {formatTimeString(endTime)}({entry.duration_minutes}{" "}
                        min)
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
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
