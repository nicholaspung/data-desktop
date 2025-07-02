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

import { ApiService } from "@/services/api";
import { toast } from "sonner";
import { format } from "date-fns";
import settingsStore from "@/store/settings-store";
import useLoadData from "@/hooks/useLoadData";
import { useFieldDefinitions } from "@/features/field-definitions/field-definitions-store";

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

const JOURNAL_DRAFT_KEY_PREFIX = "daily-journal-draft-";

const getJournalDraftKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${JOURNAL_DRAFT_KEY_PREFIX}${year}-${month}-${day}`;
};

const cleanupOldDrafts = () => {
  const today = new Date();
  const todayKey = getJournalDraftKey(today);

  // Get all localStorage keys
  const keys = Object.keys(localStorage);

  // Remove any draft entries that aren't for today
  keys.forEach((key) => {
    if (key.startsWith(JOURNAL_DRAFT_KEY_PREFIX) && key !== todayKey) {
      localStorage.removeItem(key);
    }
  });
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
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const { getDatasetFields } = useFieldDefinitions();
  const dailyLogsFields = getDatasetFields("daily_logs");
  const todosFields = getDatasetFields("todos");

  const { loadData: loadDailyLogs } = useLoadData({
    fields: dailyLogsFields,
    datasetId: "daily_logs",
    title: "Daily Logs",
  });

  const { loadData: loadTodos } = useLoadData({
    fields: todosFields,
    datasetId: "todos",
    title: "Todos",
  });

  const entries = useStore(
    dataStore,
    (state) => state.daily_journal as DailyJournalEntry[]
  );

  const settings = useStore(settingsStore);
  const isMetricsEnabled = settings.visibleRoutes["/metric"] === true;
  const isTodosEnabled = settings.visibleRoutes["/todos"] === true;

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

  // Cleanup old drafts on component mount
  useEffect(() => {
    cleanupOldDrafts();
  }, []);

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

    // Always check for draft first
    const draftKey = getJournalDraftKey(selectedDate);
    const savedDraft = localStorage.getItem(draftKey);

    if (existingEntryForDate) {
      setExistingEntry(existingEntryForDate);

      // For today's entry, prefer draft over saved version if they're different
      if (
        savedDraft &&
        isToday(selectedDate) &&
        savedDraft !== existingEntryForDate.entry
      ) {
        setEntry(savedDraft);
        setHasUnsavedChanges(true);
      } else {
        setEntry(existingEntryForDate.entry);
        setHasUnsavedChanges(false);
      }
    } else {
      setExistingEntry(null);

      if (savedDraft && isToday(selectedDate)) {
        // Only load draft if it's for today
        setEntry(savedDraft);
        setHasUnsavedChanges(true);
      } else {
        setEntry("");
        setHasUnsavedChanges(false);
      }
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
          true,
          isMetricsEnabled,
          isTodosEnabled
        );
        if (result) {
          updateEntry(existingEntry.id, result, "daily_journal");
          toast.success("Daily journal entry updated!");

          // Reload related data using the data store pattern
          if (isMetricsEnabled) {
            await loadDailyLogs();
          }
          if (isTodosEnabled) {
            await loadTodos();
          }
        }
      } else {
        result = await ApiService.saveDailyJournalWithMetrics(
          null,
          entryData,
          false,
          isMetricsEnabled,
          isTodosEnabled
        );
        if (result) {
          addEntry(result, "daily_journal");
          toast.success("Daily journal entry added!");

          // Reload related data using the data store pattern
          if (isMetricsEnabled) {
            await loadDailyLogs();
          }
          if (isTodosEnabled) {
            await loadTodos();
          }
        }
      }

      // Clear the draft from localStorage after successful save
      const draftKey = getJournalDraftKey(selectedDate);
      localStorage.removeItem(draftKey);
      setHasUnsavedChanges(false);

      return true;
    } catch (error) {
      console.error("Error saving daily journal entry:", error);
      toast.error("Failed to save daily journal entry");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [entry, selectedDate, existingEntry, isMetricsEnabled, isTodosEnabled, loadDailyLogs, loadTodos]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveEntry();
  };

  const handleEntryChange = useCallback(
    (newEntry: string) => {
      setEntry(newEntry);

      // Save draft to localStorage for today's date
      if (isToday(selectedDate)) {
        const draftKey = getJournalDraftKey(selectedDate);

        // If there's an existing entry, only save draft if content is different
        if (existingEntry) {
          if (newEntry !== existingEntry.entry) {
            localStorage.setItem(draftKey, newEntry);
            setHasUnsavedChanges(true);
          } else {
            // Remove draft if it matches the saved version
            localStorage.removeItem(draftKey);
            setHasUnsavedChanges(false);
          }
        } else {
          // No existing entry, save draft if not empty
          if (newEntry.trim()) {
            localStorage.setItem(draftKey, newEntry);
            setHasUnsavedChanges(true);
          } else {
            localStorage.removeItem(draftKey);
            setHasUnsavedChanges(false);
          }
        }
      }
    },
    [selectedDate, existingEntry]
  );

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
            {(isMetricsEnabled || isTodosEnabled) && (
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
                    <div className="font-semibold text-sm">Smart Text Features</div>

                    <div className="space-y-3 text-sm">
                      {isMetricsEnabled && (
                        <div>
                          <div className="font-medium mb-2 flex items-center gap-2">
                            📊 Metrics
                          </div>
                          <ul className="text-muted-foreground space-y-1 text-xs pl-4">
                            <li>
                              • Type{" "}
                              <code className="bg-muted px-1 rounded">
                                @metric:
                              </code>{" "}
                              to see existing metrics
                            </li>
                            <li>
                              • Use{" "}
                              <code className="bg-muted px-1 rounded">
                                @metric:Weight:150
                              </code>{" "}
                              to log values
                            </li>
                            <li>• Only existing metrics can be referenced</li>
                            <li>• Smart quotes for complex names</li>
                          </ul>
                        </div>
                      )}

                      {isTodosEnabled && (
                        <div>
                          <div className="font-medium mb-2 flex items-center gap-2">
                            ✅ Todos
                          </div>
                          <ul className="text-muted-foreground space-y-1 text-xs pl-4">
                            <li>
                              • Type{" "}
                              <code className="bg-muted px-1 rounded">
                                @todo:
                              </code>{" "}
                              to see incomplete todos
                            </li>
                            <li>
                              • Use{" "}
                              <code className="bg-muted px-1 rounded">
                                @todo:TaskName:true
                              </code>{" "}
                              to complete
                            </li>
                            <li>• Only existing todos can be referenced</li>
                            <li>• Smart quotes for complex names</li>
                          </ul>
                        </div>
                      )}

                      <div className="text-xs text-muted-foreground pt-2 border-t">
                        One metric or todo per line • Use ↑↓ arrows to navigate, Enter to select
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            )}
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
                placeholder={`Write about your day...${
                  isMetricsEnabled && isTodosEnabled
                    ? " Type @metric:Name:Value to log metrics or @todo:Name:true/false to manage todos!"
                    : isMetricsEnabled
                      ? " Type @metric:Name:Value to log metrics!"
                      : isTodosEnabled
                        ? " Type @todo:Name:true/false to manage todos!"
                        : ""
                }`}
                selectedDate={selectedDate}
                isMetricsEnabled={isMetricsEnabled}
                isTodosEnabled={isTodosEnabled}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {existingEntry ? (
                  <span className="flex items-center gap-2">
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
                    {isToday(selectedDate) && hasUnsavedChanges && (
                      <span className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                        <span className="inline-block w-2 h-2 bg-amber-600 dark:bg-amber-400 rounded-full animate-pulse"></span>
                        Unsaved changes
                      </span>
                    )}
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <span>
                      Creating entry for {format(selectedDate, "MMM d, yyyy")}
                    </span>
                    {isToday(selectedDate) && entry.trim() && (
                      <span className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                        <span className="inline-block w-2 h-2 bg-amber-600 dark:bg-amber-400 rounded-full animate-pulse"></span>
                        Draft saved
                      </span>
                    )}
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
