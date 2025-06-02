import { useState, useMemo } from "react";
import { TimeEntry, TimeCategory } from "@/store/time-tracking-definitions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateString } from "@/lib/time-utils";
import { cn } from "@/lib/utils";
import { useStore } from "@tanstack/react-store";
import dataStore from "@/store/data-store";
import { timeFilterStore, filterTimeEntries } from "@/store/time-filter-store";

interface TimeEntriesCalendarProps {
  isLoading: boolean;
  onEditEntry: (entry: TimeEntry) => void;
}

type ViewMode = "day" | "week";

interface ProcessedTimeEntry extends TimeEntry {
  columnIndex: number;
  totalColumns: number;
}

export default function TimeEntriesCalendar({
  isLoading,
  onEditEntry,
}: TimeEntriesCalendarProps) {
  const rawEntries = useStore(dataStore, (state) => state.time_entries);
  const categories = useStore(dataStore, (state) => state.time_categories);
  const hiddenHours = useStore(timeFilterStore, (state) => state.hiddenHours);

  const entries = useMemo(() => {
    return filterTimeEntries(rawEntries, hiddenHours);
  }, [rawEntries, hiddenHours]);

  const visibleHours = useMemo(() => {
    return Array.from({ length: 24 }, (_, i) => i).filter(
      (hour) => !hiddenHours.includes(hour)
    );
  }, [hiddenHours]);

  const [viewMode, setViewMode] = useState<ViewMode>("day");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const { startDate, endDate } = useMemo(() => {
    const start = new Date(selectedDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(selectedDate);

    if (viewMode === "week") {
      const day = start.getDay();
      start.setDate(start.getDate() - day);

      end.setDate(start.getDate() + 6);
    }

    end.setHours(23, 59, 59, 999);

    return { startDate: start, endDate: end };
  }, [selectedDate, viewMode]);

  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      const entryDate = new Date(entry.start_time);
      return entryDate >= startDate && entryDate <= endDate;
    });
  }, [entries, startDate, endDate]);

  const days = useMemo(() => {
    const daysArray = [];
    const currentDay = new Date(startDate);

    while (currentDay <= endDate) {
      daysArray.push(new Date(currentDay));
      currentDay.setDate(currentDay.getDate() + 1);
    }

    return daysArray;
  }, [startDate, endDate]);

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

  const timeLabels = visibleHours.map((hour) => {
    if (hour === 0) return "12am";
    if (hour < 12) return `${hour}am`;
    if (hour === 12) return "12pm";
    return `${hour - 12}pm`;
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
          <div className="flex h-[600px] border-l">
            {/* Time labels */}
            <div className="w-16 border-r flex flex-col border-t">
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
                "flex-1 flex border-b",
                viewMode === "day" ? "" : "divide-x"
              )}
            >
              {viewMode === "day" ? (
                <DayColumn
                  day={selectedDate}
                  entries={filteredEntries}
                  categories={categories}
                  onEditEntry={onEditEntry}
                  visibleHours={visibleHours}
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
                      visibleHours={visibleHours}
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
  visibleHours: number[];
}

function DayColumn({
  day,
  entries,
  categories,
  onEditEntry,
  visibleHours,
}: DayColumnProps) {
  const isToday = formatDateString(day) === formatDateString(new Date());

  const processedEntries = useMemo(() => {
    if (entries.length === 0) return [];

    const sortedEntries = [...entries].sort(
      (a, b) =>
        new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    );

    const entryColumns: ProcessedTimeEntry[][] = [];

    const processedEntries: ProcessedTimeEntry[] = [];

    sortedEntries.forEach((entry) => {
      const startTime = new Date(entry.start_time);
      const endTime = new Date(entry.end_time);

      let columnIndex = 0;
      let foundColumn = false;

      while (!foundColumn) {
        if (!entryColumns[columnIndex]) {
          entryColumns[columnIndex] = [];
          foundColumn = true;
        } else {
          const overlaps = entryColumns[columnIndex].some((existingEntry) => {
            const existingStart = new Date(existingEntry.start_time);
            const existingEnd = new Date(existingEntry.end_time);

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

      entryColumns[columnIndex].push({
        ...entry,
        columnIndex,
        totalColumns: 0,
      });

      processedEntries.push({
        ...entry,
        columnIndex,
        totalColumns: 0,
      });
    });

    const totalColumns = entryColumns.length;
    processedEntries.forEach((entry) => {
      entry.totalColumns = totalColumns;
    });

    return processedEntries;
  }, [entries]);

  const renderEntries = () => {
    return processedEntries.map((entry) => {
      const startTime = new Date(entry.start_time);
      const endTime = new Date(entry.end_time);

      const startHourWithMinutes =
        startTime.getHours() + startTime.getMinutes() / 60;
      const endHourWithMinutes = endTime.getHours() + endTime.getMinutes() / 60;

      const hasVisibleOverlap = visibleHours.some(
        (hour) => startHourWithMinutes <= hour + 1 && endHourWithMinutes >= hour
      );

      if (!hasVisibleOverlap) {
        return null;
      }

      const getHourPosition = (hourWithMinutes: number) => {
        let position = 0;
        for (let i = 0; i < visibleHours.length; i++) {
          const visibleHour = visibleHours[i];
          if (hourWithMinutes <= visibleHour) {
            return i + (hourWithMinutes - visibleHour);
          }
          if (hourWithMinutes <= visibleHour + 1) {
            return i + (hourWithMinutes - visibleHour);
          }
          position = i + 1;
        }
        return position;
      };

      const startPosition = getHourPosition(startHourWithMinutes);
      const endPosition = getHourPosition(endHourWithMinutes);

      const top = (startPosition / visibleHours.length) * 100;
      const height =
        ((endPosition - startPosition) / visibleHours.length) * 100;

      const minHeight = 1.5;
      const adjustedHeight = Math.max(height, minHeight);

      const columnWidth = entry.totalColumns ? 100 / entry.totalColumns : 100;
      const left = entry.columnIndex * columnWidth;
      const width = columnWidth;

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
      {visibleHours.map((_, index) => (
        <div
          key={index}
          className="absolute w-full border-b border-border/50 pointer-events-none"
          style={{
            top: `${(index / visibleHours.length) * 100}%`,
            height: "1px",
          }}
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
  const hiddenHours = useStore(timeFilterStore, (state) => state.hiddenHours);
  const visibleHours = useMemo(() => {
    return Array.from({ length: 24 }, (_, i) => i).filter(
      (hour) => !hiddenHours.includes(hour)
    );
  }, [hiddenHours]);

  const now = new Date();
  const currentHourWithMinutes = now.getHours() + now.getMinutes() / 60;

  const currentHour = Math.floor(currentHourWithMinutes);
  if (hiddenHours.includes(currentHour)) {
    return null;
  }

  const getHourPosition = (hourWithMinutes: number) => {
    let position = 0;
    for (let i = 0; i < visibleHours.length; i++) {
      const visibleHour = visibleHours[i];
      if (hourWithMinutes <= visibleHour + 1) {
        return i + (hourWithMinutes - visibleHour);
      }
      position = i + 1;
    }
    return position;
  };

  const position = getHourPosition(currentHourWithMinutes);
  const top = (position / visibleHours.length) * 100;

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
