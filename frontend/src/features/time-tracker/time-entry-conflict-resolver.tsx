import { useState, useMemo } from "react";
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
  convertToLocalDates,
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
    return convertToLocalDates([...entries]).sort((a, b) => {
      return (
        new Date(b.start_time).getTime() - new Date(a.start_time).getTime()
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

      handleNextOrFinish();
      toast.success("Entry deleted successfully");
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

      const hasSegment1 = overlapStart > start1;
      const hasSegment3 = overlapEnd < end2;

      const segment1Duration = hasSegment1
        ? Math.round((overlapStart - start1) / (1000 * 60))
        : 0;
      const overlapDuration = Math.round(
        (overlapEnd - overlapStart) / (1000 * 60)
      );
      const segment3Duration = hasSegment3
        ? Math.round((end2 - overlapEnd) / (1000 * 60))
        : 0;

      let operationsCompleted = 0;

      const totalOperations = (hasSegment1 ? 1 : 0) + 1 + (hasSegment3 ? 1 : 0);

      if (hasSegment1) {
        const updatedEntry1 = {
          ...entry1,
          end_time: new Date(overlapStart).toISOString(),
          duration_minutes: segment1Duration,
          tags: addOverlapFixTag(entry1.tags),
        };

        const response1 = await ApiService.updateRecord(
          entry1.id,
          updatedEntry1
        );
        if (response1) {
          updateEntry(entry1.id, response1, "time_entries");
          operationsCompleted++;
        }
      } else {
        await ApiService.deleteRecord(entry1.id);
        deleteEntry(entry1.id, "time_entries");
        operationsCompleted++;
      }

      const overlapEntry = {
        description: mergedDescription,
        start_time: new Date(overlapStart).toISOString(),
        end_time: new Date(overlapEnd).toISOString(),
        duration_minutes: overlapDuration,
        tags: addOverlapFixTag(
          [entry1.tags, entry2.tags].filter(Boolean).join(", ")
        ),
        category_id: entry1.category_id,
        private: false,
      };

      const responseOverlap = await ApiService.addRecord(
        "time_entries",
        overlapEntry
      );
      if (responseOverlap) {
        addEntry(responseOverlap, "time_entries");
        operationsCompleted++;
      }

      if (hasSegment3) {
        const updatedEntry2 = {
          ...entry2,
          start_time: new Date(overlapEnd).toISOString(),
          duration_minutes: segment3Duration,
          tags: addOverlapFixTag(entry2.tags),
        };

        const response2 = await ApiService.updateRecord(
          entry2.id,
          updatedEntry2
        );
        if (response2) {
          updateEntry(entry2.id, response2, "time_entries");
          operationsCompleted++;
        }
      } else {
        await ApiService.deleteRecord(entry2.id);
        deleteEntry(entry2.id, "time_entries");
        operationsCompleted++;
      }

      if (operationsCompleted === totalOperations) {
        toast.success("Entries split successfully with overlap segment");
        handleNextOrFinish();
      } else {
        toast.warning(
          `Completed ${operationsCompleted} of ${totalOperations} operations`
        );
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

      const updatedEntry = {
        ...entry1,
        end_time: new Date(entry2.start_time).toISOString(),
        tags: addOverlapFixTag(entry1.tags),
      };

      const start = new Date(updatedEntry.start_time);
      const end = new Date(updatedEntry.end_time);
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

      const updatedEntry = {
        ...entry2,
        start_time: new Date(entry1.end_time).toISOString(),
        tags: addOverlapFixTag(entry2.tags),
      };

      const start = new Date(updatedEntry.start_time);
      const end = new Date(updatedEntry.end_time);
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

  const handleNextOrFinish = () => {
    if (currentPage < overlappingPairs.length - 1) {
      setCurrentPage(currentPage + 1);
    } else {
      onDataChange();
      onOpenChange(false);
      setCurrentPage(0);
    }
  };

  const isLastOrNoConflicts =
    currentPage >= overlappingPairs.length - 1 || overlappingPairs.length === 0;

  const dialogContent = currentConflict ? (
    <ScrollArea className="overflow-y-auto pr-4">
      <div className="space-y-4">
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
          {/* Entry 1 - The chronologically first created entry */}
          <EntryCard
            entry={currentConflict.entry1}
            category={getCategoryById(currentConflict.entry1.category_id)}
            isFirstEntry={true}
          />

          {/* Entry 2 - The chronologically second created entry */}
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
                  disabled={isProcessing}
                  className="justify-start border-blue-500"
                >
                  <Scissors className="h-4 w-4 mr-2" />
                  End first entry when second begins
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    handleTruncateSecond(
                      currentConflict.entry1,
                      currentConflict.entry2
                    )
                  }
                  disabled={isProcessing}
                  className="justify-start border-green-500"
                >
                  <Scissors className="h-4 w-4 mr-2" />
                  Start second entry when first ends
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleDelete(currentConflict.entry1)}
                  disabled={isProcessing}
                  className="justify-start text-destructive hover:text-destructive border-blue-500"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete first entry
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleDelete(currentConflict.entry2)}
                  disabled={isProcessing}
                  className="justify-start text-destructive hover:text-destructive border-green-500"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete second entry
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
  const start1 = new Date(entry1.start_time).getTime();
  const end1 = new Date(entry1.end_time).getTime();
  const start2 = new Date(entry2.start_time).getTime();
  const end2 = new Date(entry2.end_time).getTime();

  const earliestStart = Math.min(start1, start2);
  const latestEnd = Math.max(end1, end2);
  const totalDuration = latestEnd - earliestStart;

  const entry1Start = ((start1 - earliestStart) / totalDuration) * 100;
  const entry1Width = ((end1 - start1) / totalDuration) * 100;
  const entry2Start = ((start2 - earliestStart) / totalDuration) * 100;
  const entry2Width = ((end2 - start2) / totalDuration) * 100;

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
      <div
        className="absolute h-full bg-amber-200 opacity-50"
        style={{
          left: `${Math.max(entry1Start, entry2Start)}%`,
          width: `${Math.min(entry1Start + entry1Width, entry2Start + entry2Width) - Math.max(entry1Start, entry2Start)}%`,
        }}
      />

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
          entry.tags.split(",").map((tag) => (
            <Badge key={tag.trim()} variant="outline" className="text-xs">
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
            {isFirstEntry ? "First Created" : "Created Later"}
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
