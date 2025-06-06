import { useMemo, useState } from "react";
import { TimeEntry } from "@/store/time-tracking-definitions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Calendar,
  Tag,
  ChevronDown,
  ChevronUp,
  LayoutList,
  LayoutGrid,
  AlertTriangle,
  Scissors,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import EditTimeEntryDialog from "./edit-time-entry-dialog";
import { groupEntriesByDate } from "@/lib/time-utils";
import TimeEntryListItem from "./time-entries-list-item";
import ReusableSelect from "@/components/reusable/reusable-select";
import { useStore } from "@tanstack/react-store";
import dataStore, { deleteEntry } from "@/store/data-store";
import { syncTimeEntryWithMetrics } from "./time-metrics-sync";
import { Metric } from "@/store/experiment-definitions";
import { toast } from "sonner";
import { ApiService } from "@/services/api";
import TimeEntryConflictResolver from "./time-entry-conflict-resolver";
import {
  convertToLocalDates,
  findOverlappingEntries,
} from "@/lib/time-entry-utils";

interface TimeEntriesListProps {
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
  isLoading,
  onDataChange,
}: TimeEntriesListProps) {
  const entries = useStore(dataStore, (state) => state.time_entries);
  const categories = useStore(dataStore, (state) => state.time_categories);

  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  const [tagFilter, setTagFilter] = useState("");
  const [isGrouped, setIsGrouped] = useState(false);
  const [showOverlaps, setShowOverlaps] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    {}
  );
  const [showConflictResolver, setShowConflictResolver] = useState(false);

  const metricsData = useStore(
    dataStore,
    (state) => state.metrics || []
  ) as Metric[];
  const dailyLogsData = useStore(dataStore, (state) => state.daily_logs) || [];

  const sortedEntries = useMemo(() => {
    return convertToLocalDates([...entries]).sort((a, b) => {
      return (
        new Date(b.start_time).getTime() - new Date(a.start_time).getTime()
      );
    });
  }, [entries]);

  const overlappingEntries = useMemo(() => {
    return findOverlappingEntries(sortedEntries);
  }, [sortedEntries]);

  const filteredEntries = useMemo(() => {
    let result = sortedEntries;

    if (tagFilter.trim() && tagFilter !== "_none_") {
      result = result.filter((entry) => {
        if (!entry.tags) return false;
        const entryTags = entry.tags
          .split(",")
          .map((tag) => tag.trim().toLowerCase());
        return entryTags.includes(tagFilter.trim().toLowerCase());
      });
    }

    if (showOverlaps) {
      result = result.filter((entry) =>
        overlappingEntries.some((e) => e.id === entry.id)
      );
    }

    return result;
  }, [sortedEntries, tagFilter, showOverlaps, overlappingEntries]);

  const tagOptions = useMemo(() => {
    const uniqueTags = getAllUniqueTags(entries);
    return [...uniqueTags.map((tag) => ({ id: tag, label: tag }))];
  }, [entries]);

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

  const handleDelete = async (entry: TimeEntry) => {
    try {
      const matchingMetrics = metricsData.filter(
        (metric: Metric) =>
          metric.type === "time" &&
          metric.active &&
          metric.name.toLowerCase() === entry.description.toLowerCase()
      );

      if (matchingMetrics.length > 0) {
        const zeroEntry = {
          ...entry,
          duration_minutes: 0,
        };

        await syncTimeEntryWithMetrics(
          zeroEntry,
          metricsData,
          dailyLogsData,
          entry
        );
      }

      await ApiService.deleteRecord(entry.id);
      deleteEntry(entry.id, "time_entries");
      onDataChange();
    } catch (error) {
      console.error("Error deleting time entry:", error);
      toast.error("Failed to delete time entry");
    }
  };

  const groupedEntries = groupEntriesByDate(filteredEntries);

  const groupDates = Object.keys(groupedEntries).sort((a, b) =>
    b.localeCompare(a)
  );

  const groupEntriesByDescriptionAndCategory = (
    entries: TimeEntry[]
  ): GroupedEntry[] => {
    const groups: Record<string, GroupedEntry> = {};

    entries.forEach((entry) => {
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
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
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

        <div className="flex items-center space-x-2">
          <Button
            variant={showOverlaps ? "default" : "outline"}
            size="sm"
            onClick={() => setShowOverlaps(!showOverlaps)}
            className="gap-2"
          >
            <AlertTriangle className="h-4 w-4" />
            <span className="hidden sm:inline">Show Overlapping</span>
          </Button>
          {overlappingEntries.length > 0 && (
            <Button
              variant="default"
              size="sm"
              onClick={() => setShowConflictResolver(true)}
              className="gap-2"
            >
              <Scissors className="h-4 w-4" />
              <span className="hidden sm:inline">Resolve Conflicts</span>
            </Button>
          )}

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
                <span className="hidden sm:inline">Group Similar</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {showOverlaps && overlappingEntries.length === 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-3 rounded-md">
          <p className="text-yellow-700 dark:text-yellow-400 text-sm flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            No overlapping time entries found.
          </p>
        </div>
      )}

      {editingEntry && (
        <EditTimeEntryDialog
          entry={editingEntry}
          onSave={() => {
            setEditingEntry(null);
            onDataChange();
          }}
          onCancel={() => setEditingEntry(null)}
        />
      )}

      {filteredEntries.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-6">
              <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">
                No time entries match your current filters.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        groupDates.map((dateStr) => (
          <Card key={dateStr}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {new Date(dateStr + "T12:00:00").toLocaleDateString(undefined, {
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
                  ? groupEntriesByDescriptionAndCategory(
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
                                    backgroundColor:
                                      category.color || "#3b82f6",
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
                                  metrics={metricsData}
                                  onEdit={() => setEditingEntry(entry)}
                                  onDelete={() => handleDelete(entry)}
                                  isOverlapping={overlappingEntries.some(
                                    (e) => e.id === entry.id
                                  )}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })
                  : groupedEntries[dateStr].map((entry) => (
                      <TimeEntryListItem
                        key={entry.id}
                        entry={entry}
                        category={getCategoryById(entry.category_id)}
                        metrics={metricsData}
                        onEdit={() => setEditingEntry(entry)}
                        onDelete={() => handleDelete(entry)}
                        isOverlapping={overlappingEntries.some(
                          (e) => e.id === entry.id
                        )}
                      />
                    ))}
              </div>
            </CardContent>
          </Card>
        ))
      )}
      <TimeEntryConflictResolver
        onDataChange={onDataChange}
        open={showConflictResolver}
        onOpenChange={setShowConflictResolver}
      />
    </div>
  );
}
