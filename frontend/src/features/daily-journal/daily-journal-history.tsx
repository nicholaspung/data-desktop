import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Edit, Trash2, ChevronDown, ChevronUp, Info } from "lucide-react";
import { DailyJournalEntry } from "@/store/journaling-definitions";
import ReactMarkdown from "react-markdown";
import { format, isToday, isYesterday } from "date-fns";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { ConfirmDeleteDialog } from "@/components/reusable/confirm-delete-dialog";
import { ApiService } from "@/services/api";
import { deleteEntry } from "@/store/data-store";
import { toast } from "sonner";

interface DailyJournalHistoryProps {
  entries: DailyJournalEntry[];
  showDate?: boolean;
  onDateSelect?: (date: Date) => void;
  selectedDate?: Date;
  onEditEntry?: (entry: DailyJournalEntry) => void;
}

export default function DailyJournalHistory({
  entries,
  showDate = true,
  onDateSelect,
  selectedDate,
  onEditEntry,
}: DailyJournalHistoryProps) {
  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(new Set());

  const sortedEntries = [...entries].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const getDateLabel = (date: Date) => {
    if (isToday(date)) return "Today";
    if (isYesterday(date)) return "Yesterday";
    return format(date, "MMMM d, yyyy");
  };

  const getTimeLabel = (date: Date) => {
    return format(date, "h:mm a");
  };

  const toggleExpanded = (entryId: string) => {
    setExpandedEntries((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(entryId)) {
        newSet.delete(entryId);
      } else {
        newSet.add(entryId);
      }
      return newSet;
    });
  };


  const handleDateClick = (date: Date) => {
    if (onDateSelect) {
      onDateSelect(date);
    }
  };

  const handleEditEntry = (entry: DailyJournalEntry) => {
    if (onEditEntry) {
      onEditEntry(entry);
    }
  };

  const handleDeleteEntry = async (entry: DailyJournalEntry) => {
    try {
      const success = await ApiService.deleteRecord(entry.id);
      if (success) {
        const result = deleteEntry(entry.id, "daily_journal");
        if (result.success) {
          toast.success("Journal entry deleted successfully");
        } else {
          toast.error(result.error || "Failed to delete journal entry");
        }
      }
    } catch (error) {
      console.error("Error deleting journal entry:", error);
      toast.error("Failed to delete journal entry");
    }
  };

  if (entries.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Journal Entries</h3>
          <p className="text-muted-foreground">
            Start writing your daily journal to see your entries here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {/* Info Banner */}
      <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-md p-3">
        <div className="flex items-start gap-2">
          <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800 dark:text-blue-200">
            <span className="font-medium">Tip:</span> Click the <Edit className="h-3 w-3 inline mx-1" /> edit button to switch to the "Write Today" tab and automatically navigate to that entry's date for editing.
          </div>
        </div>
      </div>

      {sortedEntries.map((entry) => {
        const entryDate = new Date(entry.date);
        const isExpanded = expandedEntries.has(entry.id);
        const isSelectedDate =
          selectedDate &&
          entryDate.toISOString().split("T")[0] ===
            selectedDate.toISOString().split("T")[0];

        return (
          <Card key={entry.id} className={`overflow-hidden ${isSelectedDate ? "ring-2 ring-blue-500 bg-blue-50/50 dark:bg-blue-950/20" : ""}`}>
            <CardHeader
              className={cn(
                "bg-primary/5 py-2 cursor-pointer",
                isExpanded ? "border-b" : ""
              )}
              onClick={() => toggleExpanded(entry.id)}
            >
              <CardTitle className="text-md flex justify-between items-center">
                <div className="flex items-center">
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 mr-2" />
                  ) : (
                    <ChevronDown className="h-4 w-4 mr-2" />
                  )}
                  {showDate && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDateClick(entryDate);
                      }}
                      className="h-auto p-0 font-normal mr-2"
                    >
                      <Calendar className="h-4 w-4 mr-1" />
                      {getDateLabel(entryDate)}
                    </Button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {getTimeLabel(entryDate)}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditEntry(entry);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <ConfirmDeleteDialog
                      title="Delete Journal Entry"
                      description={`Are you sure you want to delete this journal entry from ${getDateLabel(entryDate)}? This action cannot be undone.`}
                      onConfirm={() => handleDeleteEntry(entry)}
                      trigger={
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      }
                    />
                  </div>
                </div>
              </CardTitle>
            </CardHeader>
            {isExpanded && (
              <CardContent className="pt-4">
                <div className="prose dark:prose-invert max-w-none prose-headings:font-semibold prose-headings:text-foreground prose-p:text-foreground prose-a:text-primary prose-a:underline prose-a:underline-offset-4 hover:prose-a:text-primary/80 prose-strong:text-foreground prose-strong:font-semibold prose-blockquote:border-l-border prose-blockquote:text-muted-foreground prose-code:bg-muted prose-code:text-foreground prose-code:font-mono prose-code:rounded prose-code:px-1 prose-code:py-0.5 prose-pre:bg-muted prose-pre:text-foreground prose-pre:font-mono prose-pre:rounded-md prose-pre:p-4 prose-pre:overflow-x-auto prose-li:marker:text-muted-foreground prose-hr:border-border max-w-none">
                  <ReactMarkdown>{entry.entry}</ReactMarkdown>
                </div>
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}
