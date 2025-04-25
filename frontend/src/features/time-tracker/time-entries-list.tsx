// src/features/time-tracker/time-entries-list.tsx
import { useMemo, useState } from "react";
import { TimeEntry, TimeCategory } from "@/store/time-tracking-definitions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Calendar,
  Tag,
  ChevronDown,
  ChevronUp,
  LayoutList,
  LayoutGrid,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import EditTimeEntryDialog from "./edit-time-entry-dialog";
import { groupEntriesByDate } from "@/lib/time-utils";
import TimeEntryListItem from "./time-entries-list-item";
import ReusableSelect from "@/components/reusable/reusable-select";

interface TimeEntriesListProps {
  entries: TimeEntry[];
  categories: TimeCategory[];
  isLoading: boolean;
  onDataChange: () => void;
}

interface GroupedEntry {
  key: string;
  entries: TimeEntry[];
  isExpanded: boolean;
  totalDuration: number;
}

export default function TimeEntriesList({
  entries,
  categories,
  isLoading,
  onDataChange,
}: TimeEntriesListProps) {
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  const [tagFilter, setTagFilter] = useState("");
  const [isGrouped, setIsGrouped] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    {}
  );

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

  // Group entries by description and category within each day
  const groupEntriesByDescriptionAndCategory = (
    entries: TimeEntry[]
  ): GroupedEntry[] => {
    const groups: Record<string, GroupedEntry> = {};

    entries.forEach((entry) => {
      // Create a key combining description and category
      const groupKey = `${entry.description}|${entry.category_id || "none"}`;

      if (!groups[groupKey]) {
        groups[groupKey] = {
          key: groupKey,
          entries: [],
          isExpanded: expandedGroups[groupKey] || false,
          totalDuration: 0,
        };
      }

      groups[groupKey].entries.push(entry);
      groups[groupKey].totalDuration += entry.duration_minutes;
    });

    // Sort groups by the start time of the first entry in each group (newest first)
    return Object.values(groups).sort((a, b) => {
      const aTime = new Date(a.entries[0].start_time).getTime();
      const bTime = new Date(b.entries[0].start_time).getTime();
      return bTime - aTime;
    });
  };

  const toggleGroupExpansion = (groupKey: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupKey]: !prev[groupKey],
    }));
  };

  const getCategoryById = (id?: string) => {
    if (!id) return null;
    return categories.find((cat) => cat.id === id) || null;
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
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
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

        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsGrouped(!isGrouped)}
          className="gap-2"
        >
          {isGrouped ? (
            <>
              <LayoutList className="h-4 w-4" />
              <span className="hidden sm:inline">Ungroup</span>
            </>
          ) : (
            <>
              <LayoutGrid className="h-4 w-4" />
              <span className="hidden sm:inline">Group similar</span>
            </>
          )}
        </Button>
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
              {isGrouped
                ? // Grouped view
                  groupEntriesByDescriptionAndCategory(
                    groupedEntries[dateStr]
                  ).map((group) => {
                    const firstEntry = group.entries[0];
                    const category = getCategoryById(firstEntry.category_id);

                    return (
                      <div
                        key={group.key}
                        className="border rounded-md overflow-hidden"
                      >
                        {/* Group header */}
                        <div
                          className="flex justify-between items-center p-3 bg-accent/30 cursor-pointer"
                          onClick={() => toggleGroupExpansion(group.key)}
                        >
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">
                              {firstEntry.description}
                            </span>
                            {category && (
                              <span
                                className="px-2 py-0.5 rounded-full text-xs font-medium text-white"
                                style={{
                                  backgroundColor: category.color || "#3b82f6",
                                }}
                              >
                                {category.name}
                              </span>
                            )}
                            <span className="text-sm text-muted-foreground">
                              ({group.entries.length} entries,{" "}
                              {group.totalDuration} min total)
                            </span>
                          </div>
                          <Button variant="ghost" size="sm">
                            {expandedGroups[group.key] ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        </div>

                        {/* Expanded entries */}
                        {expandedGroups[group.key] && (
                          <div className="divide-y">
                            {group.entries.map((entry) => (
                              <TimeEntryListItem
                                key={entry.id}
                                entry={entry}
                                category={category}
                                onEdit={() => setEditingEntry(entry)}
                                onDelete={onDataChange}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })
                : // Regular view
                  groupedEntries[dateStr].map((entry) => (
                    <TimeEntryListItem
                      key={entry.id}
                      entry={entry}
                      category={getCategoryById(entry.category_id)}
                      onEdit={() => setEditingEntry(entry)}
                      onDelete={onDataChange}
                    />
                  ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
