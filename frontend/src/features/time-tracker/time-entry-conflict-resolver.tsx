import { useState, useMemo, useCallback } from "react";
import { TimeEntry, TimeCategory } from "@/store/time-tracking-definitions";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  ChevronRight,
  Clock,
  Scissors,
  Trash2,
  GitBranch,
} from "lucide-react";
import { formatTimeString } from "@/lib/time-utils";
import { Badge } from "@/components/ui/badge";
import { ApiService } from "@/services/api";
import dataStore, {
  addEntry,
  deleteEntry,
  updateEntry,
} from "@/store/data-store";
import { toast } from "sonner";
import ReusableDialog from "@/components/reusable/reusable-dialog";
import ReusableCard from "@/components/reusable/reusable-card";
import {
  findOverlappingPairs,
  getOverlapDuration,
} from "@/lib/time-entry-utils";
import { cn } from "@/lib/utils";
import { useStore } from "@tanstack/react-store";

interface TimeEntryConflictResolverProps {
  onDataChange: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Operation {
  type: 'update' | 'delete' | 'create';
  id?: string;
  data?: Record<string, any>;
}

export default function TimeEntryConflictResolver({
  onDataChange,
  open,
  onOpenChange,
}: TimeEntryConflictResolverProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const entries = useStore(dataStore, (state) => state.time_entries);
  const categories = useStore(dataStore, (state) => state.time_categories);

  const sortedEntries = useMemo(() => {
    return [...entries].sort((a, b) => {
      return (
        new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
      );
    });
  }, [entries]);

  const overlappingPairs = useMemo(() => {
    return findOverlappingPairs(sortedEntries);
  }, [sortedEntries]);

  const currentConflict = overlappingPairs[currentPage] || null;

  const getCategoryById = (id?: string) => {
    if (!id) return null;
    return categories.find((cat) => cat.id === id) || null;
  };

  const addOverlapFixTag = (tags?: string): string => {
    if (!tags) return "overlap-fix";

    const tagList = tags.split(",").map((t) => t.trim());
    if (!tagList.includes("overlap-fix")) {
      tagList.push("overlap-fix");
    }
    return tagList.join(", ");
  };

  const handleDelete = async (entry: TimeEntry) => {
    try {
      setIsProcessing(true);
      await ApiService.deleteRecord(entry.id);
      deleteEntry(entry.id, "time_entries");

      toast.success("Entry deleted successfully");
      handleNextOrFinish();
    } catch (error) {
      console.error("Error deleting entry:", error);
      toast.error("Failed to delete entry");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSplit = async (entry1: TimeEntry, entry2: TimeEntry) => {
    try {
      setIsProcessing(true);

      const start1 = new Date(entry1.start_time).getTime();
      const end1 = new Date(entry1.end_time).getTime();
      const start2 = new Date(entry2.start_time).getTime();
      const end2 = new Date(entry2.end_time).getTime();

      const overlapStart = Math.max(start1, start2);
      const overlapEnd = Math.min(end1, end2);

      if (overlapEnd <= overlapStart) {
        toast.error("No overlap detected between entries");
        setIsProcessing(false);
        return;
      }

      const mergedDescription = `${entry1.description} + ${entry2.description}`;

      // Identify all possible segments:
      // 1. Pre-overlap segment of entry1 (if entry1 starts before overlap)
      // 2. Pre-overlap segment of entry2 (if entry2 starts before overlap) 
      // 3. Overlap segment (always exists if we got here)
      // 4. Post-overlap segment of entry1 (if entry1 ends after overlap)
      // 5. Post-overlap segment of entry2 (if entry2 ends after overlap)
      
      const hasEntry1PreOverlap = start1 < overlapStart;
      const hasEntry2PreOverlap = start2 < overlapStart;
      const hasEntry1PostOverlap = end1 > overlapEnd;
      const hasEntry2PostOverlap = end2 > overlapEnd;

      // Calculate durations for all segments
      const entry1PreOverlapDuration = hasEntry1PreOverlap
        ? Math.round((overlapStart - start1) / (1000 * 60))
        : 0;
      const entry2PreOverlapDuration = hasEntry2PreOverlap
        ? Math.round((overlapStart - start2) / (1000 * 60))
        : 0;
      const overlapDuration = Math.round(
        (overlapEnd - overlapStart) / (1000 * 60)
      );
      const entry1PostOverlapDuration = hasEntry1PostOverlap
        ? Math.round((end1 - overlapEnd) / (1000 * 60))
        : 0;
      const entry2PostOverlapDuration = hasEntry2PostOverlap
        ? Math.round((end2 - overlapEnd) / (1000 * 60))
        : 0;

      // Validate that all segments would have positive durations
      if (hasEntry1PreOverlap && entry1PreOverlapDuration <= 0) {
        toast.error("Cannot split: Entry 1 pre-overlap segment would have no valid duration");
        setIsProcessing(false);
        return;
      }
      if (hasEntry2PreOverlap && entry2PreOverlapDuration <= 0) {
        toast.error("Cannot split: Entry 2 pre-overlap segment would have no valid duration");
        setIsProcessing(false);
        return;
      }
      if (overlapDuration <= 0) {
        toast.error("Cannot split: Overlap segment would have no valid duration");
        setIsProcessing(false);
        return;
      }
      if (hasEntry1PostOverlap && entry1PostOverlapDuration <= 0) {
        toast.error("Cannot split: Entry 1 post-overlap segment would have no valid duration");
        setIsProcessing(false);
        return;
      }
      if (hasEntry2PostOverlap && entry2PostOverlapDuration <= 0) {
        toast.error("Cannot split: Entry 2 post-overlap segment would have no valid duration");
        setIsProcessing(false);
        return;
      }

      let operationsCompleted = 0;
      const operations: Operation[] = [];

      // Strategy: 
      // 1. Handle entry1: update to pre-overlap OR delete if no pre-overlap
      // 2. Handle entry2: update to pre-overlap OR delete if no pre-overlap  
      // 3. Create overlap segment
      // 4. Create post-overlap segments as new entries (if any)

      // Handle entry1
      if (hasEntry1PreOverlap) {
        // Update entry1 to be the pre-overlap segment
        operations.push({
          type: 'update',
          id: entry1.id,
          data: {
            ...entry1,
            end_time: new Date(overlapStart).toISOString(),
            duration_minutes: entry1PreOverlapDuration,
            tags: addOverlapFixTag(entry1.tags),
          }
        });
      } else {
        // No pre-overlap segment, delete entry1 entirely
        operations.push({
          type: 'delete',
          id: entry1.id
        });
      }

      // Handle entry2  
      if (hasEntry2PreOverlap) {
        // Update entry2 to be the pre-overlap segment
        operations.push({
          type: 'update',
          id: entry2.id,
          data: {
            ...entry2,
            end_time: new Date(overlapStart).toISOString(),
            duration_minutes: entry2PreOverlapDuration,
            tags: addOverlapFixTag(entry2.tags),
          }
        });
      } else {
        // No pre-overlap segment, delete entry2 entirely
        operations.push({
          type: 'delete',
          id: entry2.id
        });
      }

      // Create overlap segment (always needed)
      operations.push({
        type: 'create',
        data: {
          description: mergedDescription,
          start_time: new Date(overlapStart).toISOString(),
          end_time: new Date(overlapEnd).toISOString(),
          duration_minutes: overlapDuration,
          tags: addOverlapFixTag(
            [entry1.tags, entry2.tags].filter(Boolean).join(", ")
          ),
          category_id: entry1.category_id,
          private: false,
        }
      });

      // Create post-overlap segments as new entries
      if (hasEntry1PostOverlap) {
        operations.push({
          type: 'create',
          data: {
            description: entry1.description,
            start_time: new Date(overlapEnd).toISOString(),
            end_time: entry1.end_time,
            duration_minutes: entry1PostOverlapDuration,
            category_id: entry1.category_id,
            tags: addOverlapFixTag(entry1.tags),
            private: entry1.private || false,
          }
        });
      }

      if (hasEntry2PostOverlap) {
        operations.push({
          type: 'create',
          data: {
            description: entry2.description,
            start_time: new Date(overlapEnd).toISOString(),
            end_time: entry2.end_time,
            duration_minutes: entry2PostOverlapDuration,
            category_id: entry2.category_id,
            tags: addOverlapFixTag(entry2.tags),
            private: entry2.private || false,
          }
        });
      }

      // Execute operations
      const totalOperations = operations.length;
      for (const operation of operations) {
        try {
          if (operation.type === 'update' && operation.id && operation.data) {
            const response = await ApiService.updateRecord(operation.id, operation.data);
            if (response) {
              updateEntry(operation.id, response, "time_entries");
              operationsCompleted++;
            }
          } else if (operation.type === 'delete' && operation.id) {
            await ApiService.deleteRecord(operation.id);
            deleteEntry(operation.id, "time_entries");
            operationsCompleted++;
          } else if (operation.type === 'create' && operation.data) {
            const response = await ApiService.addRecord("time_entries", operation.data);
            if (response) {
              addEntry(response, "time_entries");
              operationsCompleted++;
            }
          }
        } catch (opError) {
          console.error(`Error executing ${operation.type} operation:`, opError);
          // Continue with other operations but track the failure
        }
      }

      if (operationsCompleted === totalOperations) {
        toast.success("Entries split successfully with overlap segment");
        handleNextOrFinish();
      } else if (operationsCompleted > 0) {
        toast.warning(
          `Partially completed: ${operationsCompleted} of ${totalOperations} operations succeeded. Some data may be in an inconsistent state.`
        );
      } else {
        toast.error("All split operations failed. No changes were made.");
      }
    } catch (error) {
      console.error("Error splitting entries:", error);
      toast.error("Failed to split entries");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTruncateFirst = async (entry1: TimeEntry, entry2: TimeEntry) => {
    try {
      setIsProcessing(true);

      const start = new Date(entry1.start_time);
      const end = new Date(entry2.start_time);
      
      // Validate that the truncated entry would have a valid time range
      if (start >= end) {
        toast.error("Cannot truncate: Earlier entry would have no valid duration");
        setIsProcessing(false);
        return;
      }

      const updatedEntry = {
        ...entry1,
        end_time: end.toISOString(),
        tags: addOverlapFixTag(entry1.tags),
      };

      const durationMinutes = Math.max(
        1,
        Math.round((end.getTime() - start.getTime()) / (1000 * 60))
      );

      updatedEntry.duration_minutes = durationMinutes;

      const response = await ApiService.updateRecord(entry1.id, updatedEntry);

      if (response) {
        updateEntry(entry1.id, response, "time_entries");
        toast.success("Entry adjusted successfully");
        handleNextOrFinish();
      }
    } catch (error) {
      console.error("Error adjusting entry:", error);
      toast.error("Failed to adjust entry");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTruncateSecond = async (entry1: TimeEntry, entry2: TimeEntry) => {
    try {
      setIsProcessing(true);

      const start = new Date(entry1.end_time);
      const end = new Date(entry2.end_time);
      
      // Validate that the truncated entry would have a valid time range
      if (start >= end) {
        toast.error("Cannot truncate: Later entry would have no valid duration");
        setIsProcessing(false);
        return;
      }

      const updatedEntry = {
        ...entry2,
        start_time: start.toISOString(),
        tags: addOverlapFixTag(entry2.tags),
      };

      const durationMinutes = Math.max(
        1,
        Math.round((end.getTime() - start.getTime()) / (1000 * 60))
      );

      updatedEntry.duration_minutes = durationMinutes;

      const response = await ApiService.updateRecord(entry2.id, updatedEntry);

      if (response) {
        updateEntry(entry2.id, response, "time_entries");
        toast.success("Entry adjusted successfully");
        handleNextOrFinish();
      }
    } catch (error) {
      console.error("Error adjusting entry:", error);
      toast.error("Failed to adjust entry");
    } finally {
      setIsProcessing(false);
    }
  };

  const canTruncateFirst = (entry1: TimeEntry, entry2: TimeEntry): boolean => {
    const start1 = new Date(entry1.start_time);
    const end2Start = new Date(entry2.start_time);
    return start1 < end2Start;
  };

  const canTruncateSecond = (entry1: TimeEntry, entry2: TimeEntry): boolean => {
    const end1 = new Date(entry1.end_time);
    const end2 = new Date(entry2.end_time);
    return end1 < end2;
  };

  const refreshConflicts = useCallback(() => {
    // Force re-calculation of overlapping pairs by triggering a re-render
    // This ensures that after resolving conflicts, we see the updated state
    setTimeout(() => {
      const updatedEntries = dataStore.state.time_entries;
      const newOverlappingPairs = findOverlappingPairs([...updatedEntries].sort((a, b) => {
        return new Date(a.start_time).getTime() - new Date(b.start_time).getTime();
      }));
      
      if (newOverlappingPairs.length === 0) {
        // No more conflicts, close the dialog
        onDataChange();
        onOpenChange(false);
        setCurrentPage(0);
      } else if (currentPage >= newOverlappingPairs.length) {
        // Current page is beyond available conflicts, reset to last available
        setCurrentPage(Math.max(0, newOverlappingPairs.length - 1));
      }
      // Otherwise stay on current page to handle next conflict
    }, 100);
  }, [currentPage, onDataChange, onOpenChange]);

  const handleNextOrFinish = () => {
    refreshConflicts();
  };

  const isLastOrNoConflicts =
    currentPage >= overlappingPairs.length - 1 || overlappingPairs.length === 0;

  const dialogContent = currentConflict ? (
    <ScrollArea className="overflow-y-auto pr-4">
      <div className="space-y-4">
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
          {/* Entry 1 - The earlier entry (starts first) */}
          <EntryCard
            entry={currentConflict.entry1}
            category={getCategoryById(currentConflict.entry1.category_id)}
            isFirstEntry={true}
          />

          {/* Entry 2 - The later entry (starts after) */}
          <EntryCard
            entry={currentConflict.entry2}
            category={getCategoryById(currentConflict.entry2.category_id)}
            isFirstEntry={false}
          />
        </div>

        <ReusableCard
          title={
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 mr-2 text-amber-500" />
              <span>Overlap Details</span>
            </div>
          }
          content={
            <div className="text-sm space-y-2">
              <p>
                <strong>Conflict Duration:</strong>{" "}
                {getOverlapDuration(
                  currentConflict.entry1,
                  currentConflict.entry2
                )}{" "}
                minutes
              </p>
              <div className="relative h-8 bg-muted rounded-md overflow-hidden mt-4">
                {/* Timeline visualization */}
                <EntryTimeline
                  entry1={currentConflict.entry1}
                  entry2={currentConflict.entry2}
                />
              </div>
              <div className="pt-4">
                <strong>Resolution Options:</strong>
              </div>
              <Button
                variant="outline"
                onClick={() =>
                  handleSplit(currentConflict.entry1, currentConflict.entry2)
                }
                disabled={isProcessing}
                className="justify-start w-full border-amber-300"
              >
                <GitBranch className="h-4 w-4 mr-2" />
                Create overlap segment
              </Button>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() =>
                    handleTruncateFirst(
                      currentConflict.entry1,
                      currentConflict.entry2
                    )
                  }
                  disabled={isProcessing || !canTruncateFirst(currentConflict.entry1, currentConflict.entry2)}
                  className="justify-start border-blue-500"
                >
                  <Scissors className="h-4 w-4 mr-2" />
                  End earlier entry when later begins
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    handleTruncateSecond(
                      currentConflict.entry1,
                      currentConflict.entry2
                    )
                  }
                  disabled={isProcessing || !canTruncateSecond(currentConflict.entry1, currentConflict.entry2)}
                  className="justify-start border-green-500"
                >
                  <Scissors className="h-4 w-4 mr-2" />
                  Start later entry when earlier ends
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleDelete(currentConflict.entry1)}
                  disabled={isProcessing}
                  className="justify-start text-destructive hover:text-destructive border-blue-500"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete earlier entry
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleDelete(currentConflict.entry2)}
                  disabled={isProcessing}
                  className="justify-start text-destructive hover:text-destructive border-green-500"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete later entry
                </Button>
              </div>
            </div>
          }
        />
      </div>
    </ScrollArea>
  ) : (
    <div className="py-8 text-center text-muted-foreground">
      No overlapping time entries to resolve.
    </div>
  );

  const dialogFooter = (
    <div className="flex justify-between items-center gap-2 w-full">
      <div className="text-sm text-muted-foreground">
        {overlappingPairs.length > 0 &&
          `${currentPage + 1} of ${overlappingPairs.length} conflicts`}
      </div>
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          {isLastOrNoConflicts ? "Close" : "Skip All"}
        </Button>
        {currentConflict && (
          <Button
            onClick={handleNextOrFinish}
            disabled={isProcessing}
            className="gap-2"
          >
            {currentPage < overlappingPairs.length - 1
              ? "Next Conflict"
              : "Finish"}
            {currentPage < overlappingPairs.length - 1 && (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <>
      <ReusableDialog
        description={
          overlappingPairs.length > 0
            ? `Showing conflict ${currentPage + 1} of ${overlappingPairs.length}. These time entries overlap with each other. Please resolve the conflict.`
            : "No overlapping time entries found."
        }
        customContent={dialogContent}
        customFooter={dialogFooter}
        open={open}
        onOpenChange={onOpenChange}
        contentClassName="max-w-3xl"
        showTrigger={false}
        title={
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            <span>Resolve Overlapping Time Entries</span>
          </div>
        }
      />
    </>
  );
}

function EntryTimeline({
  entry1,
  entry2,
}: {
  entry1: TimeEntry;
  entry2: TimeEntry;
}) {
  // Ensure we're working with timestamps, handle both string and Date inputs
  const start1 = typeof entry1.start_time === 'string' 
    ? new Date(entry1.start_time).getTime() 
    : entry1.start_time.getTime();
  const end1 = typeof entry1.end_time === 'string'
    ? new Date(entry1.end_time).getTime()
    : entry1.end_time.getTime();
  const start2 = typeof entry2.start_time === 'string'
    ? new Date(entry2.start_time).getTime()
    : entry2.start_time.getTime();
  const end2 = typeof entry2.end_time === 'string'
    ? new Date(entry2.end_time).getTime()
    : entry2.end_time.getTime();

  const earliestStart = Math.min(start1, start2);
  const latestEnd = Math.max(end1, end2);
  const totalDuration = latestEnd - earliestStart;

  // Prevent division by zero and ensure valid percentages
  if (totalDuration <= 0) {
    return <div className="text-xs text-muted-foreground">Invalid timeline data</div>;
  }

  const entry1Start = Math.max(0, ((start1 - earliestStart) / totalDuration) * 100);
  const entry1Width = Math.max(0, ((end1 - start1) / totalDuration) * 100);
  const entry2Start = Math.max(0, ((start2 - earliestStart) / totalDuration) * 100);
  const entry2Width = Math.max(0, ((end2 - start2) / totalDuration) * 100);

  // Calculate overlap for highlighting
  const overlapStart = Math.max(entry1Start, entry2Start);
  const overlapEnd = Math.min(entry1Start + entry1Width, entry2Start + entry2Width);
  const overlapWidth = Math.max(0, overlapEnd - overlapStart);

  return (
    <>
      {/* Entry 1 bar */}
      <div
        className="absolute h-3 bg-blue-500 rounded-sm"
        style={{
          left: `${entry1Start}%`,
          width: `${entry1Width}%`,
          top: "4px",
        }}
      />

      {/* Entry 2 bar */}
      <div
        className="absolute h-3 bg-green-500 rounded-sm"
        style={{
          left: `${entry2Start}%`,
          width: `${entry2Width}%`,
          bottom: "4px",
        }}
      />

      {/* Overlap highlighting */}
      {overlapWidth > 0 && (
        <div
          className="absolute h-full bg-amber-200 opacity-50"
          style={{
            left: `${overlapStart}%`,
            width: `${overlapWidth}%`,
          }}
        />
      )}

      {/* Timeline labels */}
      <div className="absolute text-xs text-muted-foreground bottom-[-18px] left-0">
        {new Date(earliestStart).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </div>
      <div className="absolute text-xs text-muted-foreground bottom-[-18px] right-0">
        {new Date(latestEnd).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </div>
    </>
  );
}

function EntryCard({
  entry,
  category,
  isFirstEntry,
}: {
  entry: TimeEntry;
  category: TimeCategory | null;
  isFirstEntry: boolean;
}) {
  const cardContent = (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <div className="text-sm">
          <div className="font-medium">{entry.duration_minutes} minutes</div>
          <div className="text-muted-foreground">
            {formatTimeString(new Date(entry.start_time))} -{" "}
            {formatTimeString(new Date(entry.end_time))}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-1 pt-1">
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
          entry.tags.split(",").map((tag, index) => (
            <Badge key={`${entry.id}-tag-${index}`} variant="outline" className="text-xs">
              {tag.trim()}
            </Badge>
          ))}
      </div>
    </div>
  );

  return (
    <ReusableCard
      title={
        <div className="flex items-center gap-2">
          <span className="font-medium">{entry.description}</span>
          <Badge variant="outline" className="text-xs">
            {isFirstEntry ? "Earlier Entry" : "Later Entry"}
          </Badge>
        </div>
      }
      content={cardContent}
      cardClassName={cn(
        "border-2",
        isFirstEntry ? "border-blue-500" : "border-green-500"
      )}
    />
  );
}
