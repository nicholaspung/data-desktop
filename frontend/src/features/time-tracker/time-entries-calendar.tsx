// src/features/time-tracker/time-entries-calendar.tsx
import { useState, useMemo } from "react";
import { TimeEntry, TimeCategory } from "@/store/time-tracking-definitions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateString } from "@/lib/time-utils";
import { cn } from "@/lib/utils";

interface TimeEntriesCalendarProps {
  entries: TimeEntry[];
  categories: TimeCategory[];
  isLoading: boolean;
  onEditEntry: (entry: TimeEntry) => void;
}

type ViewMode = "day" | "week";

interface ProcessedTimeEntry extends TimeEntry {
  columnIndex: number;
  totalColumns: number;
}

export default function TimeEntriesCalendar({
  entries,
  categories,
  isLoading,
  onEditEntry,
}: TimeEntriesCalendarProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("day");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Calculate start and end of the current view (day or week)
  const { startDate, endDate } = useMemo(() => {
    const start = new Date(selectedDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(selectedDate);

    if (viewMode === "week") {
      // Get start of week (Sunday)
      const day = start.getDay();
      start.setDate(start.getDate() - day);

      // End of week (Saturday)
      end.setDate(start.getDate() + 6);
    }

    end.setHours(23, 59, 59, 999);

    return { startDate: start, endDate: end };
  }, [selectedDate, viewMode]);

  // Filter entries for the selected date range
  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      const entryDate = new Date(entry.start_time);
      return entryDate >= startDate && entryDate <= endDate;
    });
  }, [entries, startDate, endDate]);

  // Generate days for the current view
  const days = useMemo(() => {
    const daysArray = [];
    const currentDay = new Date(startDate);

    while (currentDay <= endDate) {
      daysArray.push(new Date(currentDay));
      currentDay.setDate(currentDay.getDate() + 1);
    }

    return daysArray;
  }, [startDate, endDate]);

  // Navigate to previous/next day or week
  const navigatePrevious = () => {
    const newDate = new Date(selectedDate);
    if (viewMode === "day") {
      newDate.setDate(newDate.getDate() - 1);
    } else {
      newDate.setDate(newDate.getDate() - 7);
    }
    setSelectedDate(newDate);
  };

  const navigateNext = () => {
    const newDate = new Date(selectedDate);
    if (viewMode === "day") {
      newDate.setDate(newDate.getDate() + 1);
    } else {
      newDate.setDate(newDate.getDate() + 7);
    }
    setSelectedDate(newDate);
  };

  const navigateToday = () => {
    setSelectedDate(new Date());
  };

  // Get the formatted date range for display
  const getDateRangeDisplay = () => {
    if (viewMode === "day") {
      return selectedDate.toLocaleDateString(undefined, {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } else {
      return `${startDate.toLocaleDateString(undefined, { month: "short", day: "numeric" })} - ${endDate.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  // Time labels for the calendar (5am - 11pm)
  const timeLabels = Array.from({ length: 19 }, (_, i) => {
    const hour = i + 5; // Start at 5am
    return hour > 12 ? `${hour - 12}pm` : hour === 12 ? "12pm" : `${hour}am`;
  });

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {getDateRangeDisplay()}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={navigateToday}>
              Today
            </Button>
            <div className="flex">
              <Button variant="outline" size="icon" onClick={navigatePrevious}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={navigateNext}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex border rounded-md">
              <Button
                variant={viewMode === "day" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("day")}
              >
                Day
              </Button>
              <Button
                variant={viewMode === "week" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("week")}
              >
                Week
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative mt-2">
          {/* Day headers for week view */}
          {viewMode === "week" && (
            <div className="flex border-b">
              {days.map((day, index) => (
                <div
                  key={index}
                  className={cn(
                    "flex-1 text-center py-2 font-medium",
                    formatDateString(day) === formatDateString(new Date()) &&
                      "bg-accent/20"
                  )}
                >
                  <div>
                    {day.toLocaleDateString(undefined, { weekday: "short" })}
                  </div>
                  <div>
                    {day.toLocaleDateString(undefined, { day: "numeric" })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Calendar grid */}
          <div className="flex h-[600px] border-t border-l">
            {/* Time labels */}
            <div className="w-16 border-r flex flex-col">
              {timeLabels.map((label, index) => (
                <div
                  key={index}
                  className="flex-1 border-b pr-2 text-right text-xs text-muted-foreground flex items-start justify-end pt-1"
                >
                  {label}
                </div>
              ))}
            </div>

            {/* Calendar columns */}
            <div
              className={cn(
                "flex-1 flex",
                viewMode === "day" ? "" : "divide-x"
              )}
            >
              {viewMode === "day" ? (
                <DayColumn
                  day={selectedDate}
                  entries={filteredEntries}
                  categories={categories}
                  onEditEntry={onEditEntry}
                />
              ) : (
                days.map((day, index) => {
                  const dayEntries = filteredEntries.filter((entry) => {
                    const entryDate = new Date(entry.start_time);
                    return (
                      formatDateString(entryDate) === formatDateString(day)
                    );
                  });

                  return (
                    <DayColumn
                      key={index}
                      day={day}
                      entries={dayEntries}
                      categories={categories}
                      onEditEntry={onEditEntry}
                    />
                  );
                })
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface DayColumnProps {
  day: Date;
  entries: TimeEntry[];
  categories: TimeCategory[];
  onEditEntry: (entry: TimeEntry) => void;
}

function DayColumn({ day, entries, categories, onEditEntry }: DayColumnProps) {
  const isToday = formatDateString(day) === formatDateString(new Date());

  // Process entries to place them in columns side by side if they overlap
  const processedEntries = useMemo(() => {
    if (entries.length === 0) return [];

    // Sort entries by start time
    const sortedEntries = [...entries].sort(
      (a, b) =>
        new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    );

    // Track columns for overlapping entries
    const entryColumns: ProcessedTimeEntry[][] = [];

    // Process each entry to find its column position
    const processedEntries: ProcessedTimeEntry[] = [];

    sortedEntries.forEach((entry) => {
      const startTime = new Date(entry.start_time);
      const endTime = new Date(entry.end_time);

      // Find the first column where this entry doesn't overlap with any existing entry
      let columnIndex = 0;
      let foundColumn = false;

      while (!foundColumn) {
        // Create column if it doesn't exist
        if (!entryColumns[columnIndex]) {
          entryColumns[columnIndex] = [];
          foundColumn = true;
        } else {
          // Check if this entry overlaps with any entry in this column
          const overlaps = entryColumns[columnIndex].some((existingEntry) => {
            const existingStart = new Date(existingEntry.start_time);
            const existingEnd = new Date(existingEntry.end_time);

            // Check for overlap
            return (
              (startTime <= existingEnd && startTime >= existingStart) ||
              (endTime <= existingEnd && endTime >= existingStart) ||
              (startTime <= existingStart && endTime >= existingEnd)
            );
          });

          if (!overlaps) {
            foundColumn = true;
          } else {
            columnIndex++;
          }
        }
      }

      // Add entry to its column
      entryColumns[columnIndex].push({
        ...entry,
        columnIndex,
        totalColumns: 0, // Will be updated after all entries are processed
      });

      // Add to processed entries
      processedEntries.push({
        ...entry,
        columnIndex,
        totalColumns: 0,
      });
    });

    // Update total columns for each entry
    const totalColumns = entryColumns.length;
    processedEntries.forEach((entry) => {
      entry.totalColumns = totalColumns;
    });

    return processedEntries;
  }, [entries]);

  // Position entries in the column based on their time
  const renderEntries = () => {
    return processedEntries.map((entry) => {
      const startTime = new Date(entry.start_time);
      const endTime = new Date(entry.end_time);

      // Calculate position based on hours (5am to 11pm = 0 to 1080px)
      const startHour = startTime.getHours() + startTime.getMinutes() / 60;
      const endHour = endTime.getHours() + endTime.getMinutes() / 60;

      // Clamp to our visible range
      const visibleStartHour = Math.max(5, Math.min(23, startHour));
      const visibleEndHour = Math.max(5, Math.min(23, endHour));

      // Convert to percentages
      const top = ((visibleStartHour - 5) / 18) * 100;
      const height = ((visibleEndHour - visibleStartHour) / 18) * 100;

      // If entry is too small, ensure minimum height
      const minHeight = 1.5; // percent
      const adjustedHeight = Math.max(height, minHeight);

      // Calculate width and left offset based on column
      const columnWidth = entry.totalColumns ? 100 / entry.totalColumns : 100;
      const left = entry.columnIndex * columnWidth;
      const width = columnWidth;

      // Find the category for color
      const category = categories.find((c) => c.id === entry.category_id);

      return (
        <div
          key={entry.id}
          className="absolute rounded-md px-2 py-1 text-xs text-white overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
          style={{
            top: `${top}%`,
            height: `${adjustedHeight}%`,
            left: `${left}%`,
            width: `${width}%`,
            backgroundColor: category?.color || "#3b82f6",
            // Add a subtle border to distinguish overlapping entries
            border: "1px solid rgba(255,255,255,0.3)",
          }}
          onClick={() => onEditEntry(entry)}
          title={entry.description}
        >
          <div className="font-medium truncate">{entry.description}</div>
          {adjustedHeight > 4 && (
            <div className="text-xs opacity-90 truncate">
              {startTime.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}{" "}
              -
              {endTime.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div className={cn("flex-1 relative", isToday && "bg-accent/10")}>
      {/* Horizontal hour guidelines */}
      {Array.from({ length: 18 }).map((_, index) => (
        <div
          key={index}
          className="absolute w-full border-b border-border/50 pointer-events-none"
          style={{ top: `${(index / 18) * 100}%`, height: "1px" }}
        />
      ))}

      {/* Current time indicator */}
      {isToday && <CurrentTimeIndicator />}

      {/* Entries */}
      {renderEntries()}
    </div>
  );
}

function CurrentTimeIndicator() {
  const now = new Date();
  const currentHour = now.getHours() + now.getMinutes() / 60;

  // Only show if within our visible range (5am-11pm)
  if (currentHour < 5 || currentHour > 23) {
    return null;
  }

  // Calculate position (5am to 11pm = 0 to 100%)
  const top = ((currentHour - 5) / 18) * 100;

  return (
    <div
      className="absolute w-full pointer-events-none"
      style={{ top: `${top}%` }}
    >
      <div className="h-0.5 bg-red-500 w-full" />
      <div className="absolute -left-1 -top-1.5 h-3 w-3 rounded-full bg-red-500" />
    </div>
  );
}
