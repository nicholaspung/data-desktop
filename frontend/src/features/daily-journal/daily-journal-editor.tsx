import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  Calendar,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import JournalEditorWithMetrics from "./journal-editor-with-metrics";
import { addDays, isToday, isTomorrow, isYesterday } from "date-fns";
import dataStore, { addEntry, updateEntry } from "@/store/data-store";
import { useStore } from "@tanstack/react-store";
import { DailyJournalEntry } from "@/store/journaling-definitions";
import { DailyLog } from "@/store/experiment-definitions";
import { ApiService } from "@/services/api";
import { toast } from "sonner";
import { format } from "date-fns";

interface DailyJournalEditorProps {
  selectedDate?: Date;
  onDateChange?: (date: Date) => void;
}

const getDateLabel = (date: Date): string => {
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  if (isTomorrow(date)) return "Tomorrow";
  return format(date, "EEEE, MMM d, yyyy");
};

export default function DailyJournalEditor({
  selectedDate: propSelectedDate,
  onDateChange,
}: DailyJournalEditorProps = {}) {
  const [entry, setEntry] = useState("");
  const [selectedDate, setSelectedDate] = useState(
    propSelectedDate || new Date()
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingEntry, setExistingEntry] = useState<DailyJournalEntry | null>(
    null
  );

  const entries = useStore(
    dataStore,
    (state) => state.daily_journal as DailyJournalEntry[]
  );

  useEffect(() => {
    if (propSelectedDate) {
      setSelectedDate(propSelectedDate);
    }
  }, [propSelectedDate]);

  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
    if (onDateChange) {
      onDateChange(date);
    }
  };

  useEffect(() => {
    const selectedYear = selectedDate.getFullYear();
    const selectedMonth = selectedDate.getMonth();
    const selectedDay = selectedDate.getDate();

    const existingEntryForDate = entries.find((entry) => {
      const entryDate = new Date(entry.date);
      return (
        entryDate.getFullYear() === selectedYear &&
        entryDate.getMonth() === selectedMonth &&
        entryDate.getDate() === selectedDay
      );
    });

    if (existingEntryForDate) {
      setExistingEntry(existingEntryForDate);
      setEntry(existingEntryForDate.entry);
    } else {
      setExistingEntry(null);
      setEntry("");
    }
  }, [selectedDate, entries]);

  const saveEntry = useCallback(async () => {
    if (!entry.trim()) {
      toast.error("Please write something in your journal");
      return false;
    }

    setIsSubmitting(true);

    try {
      const entryData = {
        date: selectedDate.toISOString(),
        entry: entry.trim(),
      };

      let result;
      if (existingEntry) {
        result = await ApiService.saveDailyJournalWithMetrics(
          existingEntry.id,
          entryData,
          true
        );
        if (result) {
          updateEntry(existingEntry.id, result, "daily_journal");
          toast.success("Daily journal entry updated!");

          const logs = await ApiService.getRecords<DailyLog>("daily_logs");
          if (logs) {
            dataStore.setState((state) => ({
              ...state,
              daily_logs: logs,
            }));
          }
        }
      } else {
        result = await ApiService.saveDailyJournalWithMetrics(
          null,
          entryData,
          false
        );
        if (result) {
          addEntry(result, "daily_journal");
          toast.success("Daily journal entry added!");

          const logs = await ApiService.getRecords<DailyLog>("daily_logs");
          if (logs) {
            dataStore.setState((state) => ({
              ...state,
              daily_logs: logs,
            }));
          }
        }
      }

      return true;
    } catch (error) {
      console.error("Error saving daily journal entry:", error);
      toast.error("Failed to save daily journal entry");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [entry, selectedDate, existingEntry]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveEntry();
  };

  const handleEntryChange = useCallback((newEntry: string) => {
    setEntry(newEntry);
  }, []);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              {existingEntry
                ? "Edit Journal Entry"
                : "Write Your Daily Journal"}
            </CardTitle>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-1 h-8 px-2"
                >
                  <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Tips</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-4" align="end">
                <div className="space-y-3">
                  <div className="font-semibold text-sm">Tips</div>

                  <div className="space-y-2 text-sm">
                    <div>
                      <div className="font-medium mb-1">Adding Metrics:</div>
                      <div className="text-muted-foreground">
                        Type{" "}
                        <code className="bg-muted px-1 rounded">@metric:</code>{" "}
                        to open the metrics menu
                      </div>
                    </div>

                    <div>
                      <div className="font-medium mb-1">How to Use:</div>
                      <ul className="text-muted-foreground space-y-1 text-xs">
                        <li>
                          • Type{" "}
                          <code className="bg-muted px-1 rounded">
                            @metric:
                          </code>{" "}
                          to see all available metrics
                        </li>
                        <li>
                          • Continue typing to filter (e.g.,{" "}
                          <code className="bg-muted px-1 rounded">
                            @metric:weight
                          </code>
                          )
                        </li>
                        <li>• Use ↑↓ arrows to navigate, Enter to select</li>
                        <li>• Each block can have only one metric</li>
                        <li>• Use multiple blocks for multiple metrics</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
          <div className="flex items-center gap-2 pt-2">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDateChange(addDays(selectedDate, -1))}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <div className="flex items-center gap-2 min-w-[200px] justify-center">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">
                  {getDateLabel(selectedDate)}
                </span>
                {!isToday(selectedDate) && (
                  <span className="text-xs text-muted-foreground">
                    ({format(selectedDate, "MMM d")})
                  </span>
                )}
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDateChange(addDays(selectedDate, 1))}
                className="h-8 w-8 p-0"
                disabled={selectedDate >= new Date()}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDateChange(new Date())}
              className="ml-auto text-xs"
              disabled={isToday(selectedDate)}
            >
              Go to Today
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                What happened today? How are you feeling?
              </label>
              <JournalEditorWithMetrics
                key={`${selectedDate.toISOString()}-${existingEntry?.id || "new"}`}
                value={entry}
                onChange={handleEntryChange}
                placeholder="Write about your day... Type @metric: to add metrics!"
                selectedDate={selectedDate}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {existingEntry ? (
                  <span>
                    Last updated:{" "}
                    {format(
                      new Date(
                        existingEntry.lastModified ||
                          existingEntry.createdAt ||
                          new Date()
                      ),
                      "MMM d, yyyy 'at' h:mm a"
                    )}
                  </span>
                ) : (
                  <span>
                    Creating entry for {format(selectedDate, "MMM d, yyyy")}
                  </span>
                )}
              </div>

              <Button type="submit" disabled={isSubmitting || !entry.trim()}>
                {isSubmitting
                  ? "Saving..."
                  : existingEntry
                    ? "Update Entry"
                    : "Save Entry"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
