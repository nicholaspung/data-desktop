// src/features/daily-tracker/calendar-view.tsx
import { useState, useEffect } from "react";
import { useStore } from "@tanstack/react-store";
import dataStore from "@/store/data-store";
import { DailyLog, Metric } from "@/store/experiment-definitions";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  format,
  isSameDay,
  addMonths,
  subMonths,
} from "date-fns";
import { eachDayOfInterval } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Calendar, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface CalendarViewProps {
  selectedMetrics: string[];
}

export default function CalendarView({ selectedMetrics }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedDateMetrics, setSelectedDateMetrics] = useState<DailyLog[]>(
    []
  );
  const [showDialog, setShowDialog] = useState(false);

  const metrics = useStore(dataStore, (state) => state.metrics) || [];
  const dailyLogs = useStore(dataStore, (state) => state.daily_logs) || [];

  useEffect(() => {
    if (selectedDate) {
      const logs = dailyLogs.filter((log: DailyLog) => {
        const logDate = new Date(log.date);
        return (
          isSameDay(logDate, selectedDate) &&
          selectedMetrics.includes(log.metric_id)
        );
      });
      setSelectedDateMetrics(logs);
      setShowDialog(true);
    }
  }, [selectedDate, selectedMetrics, dailyLogs]);

  const prevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const handleDateClick = (day: Date) => {
    setSelectedDate(day);
  };

  const renderHeader = () => {
    return (
      <div className="flex justify-between items-center mb-4">
        <Button onClick={prevMonth} size="sm" variant="outline">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-lg font-semibold">
          {format(currentMonth, "MMMM yyyy")}
        </h2>
        <Button onClick={nextMonth} size="sm" variant="outline">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    );
  };

  const renderDays = () => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return (
      <div className="grid grid-cols-7 gap-1 mb-2">
        {days.map((day) => (
          <div key={day} className="text-center font-medium text-sm">
            {day}
          </div>
        ))}
      </div>
    );
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const dateFormat = "d";
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    const formattedDays = [];

    for (const day of days) {
      const dateString = format(day, "yyyy-MM-dd");
      const hasLogs = dailyLogs.some((log) => {
        const logDate = new Date(log.date);
        return (
          isSameDay(logDate, day) && selectedMetrics.includes(log.metric_id)
        );
      });

      const metricsForDay = dailyLogs.filter((log) => {
        const logDate = new Date(log.date);
        return (
          isSameDay(logDate, day) && selectedMetrics.includes(log.metric_id)
        );
      });

      // Count completed metrics (true boolean values)
      const completedCount = metricsForDay.filter((log) => {
        try {
          const value = JSON.parse(log.value);
          return value === true;
        } catch {
          return false;
        }
      }).length;

      formattedDays.push(
        <div
          key={dateString}
          className={cn(
            "h-24 p-1 border rounded-md",
            !isSameMonth(day, monthStart)
              ? "bg-gray-100 dark:bg-gray-800 text-gray-400"
              : "",
            hasLogs ? "border-blue-300 dark:border-blue-700" : "",
            "cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
          )}
          onClick={() => handleDateClick(day)}
        >
          <div className="flex justify-between">
            <span
              className={cn(
                "text-sm font-medium",
                isSameDay(day, new Date())
                  ? "bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center"
                  : ""
              )}
            >
              {format(day, dateFormat)}
            </span>
            {hasLogs && (
              <Badge variant="outline" className="text-xs">
                {metricsForDay.length}
              </Badge>
            )}
          </div>
          <div className="mt-1 space-y-1 overflow-hidden max-h-[calc(100%-1.5rem)]">
            {completedCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                <Check className="h-3 w-3 mr-1" /> {completedCount}
              </Badge>
            )}
            {metricsForDay.length > 0 &&
              metricsForDay.slice(0, 2).map((log, idx) => {
                const metric = metrics.find(
                  (m: Metric) => m.id === log.metric_id
                );
                return (
                  <div key={idx} className="truncate text-xs">
                    <span className="w-2 h-2 inline-block rounded-full bg-primary mr-1" />
                    <span className="truncate">{metric?.name}</span>
                  </div>
                );
              })}
            {metricsForDay.length > 2 && (
              <div className="text-xs text-muted-foreground">
                +{metricsForDay.length - 2} more
              </div>
            )}
          </div>
        </div>
      );
    }

    const rows_per_week = [];
    for (let i = 0; i < formattedDays.length; i += 7) {
      rows_per_week.push(
        <div key={i} className="grid grid-cols-7 gap-1">
          {formattedDays.slice(i, i + 7)}
        </div>
      );
    }

    return <div className="space-y-1">{rows_per_week}</div>;
  };

  const renderSelectedDateDialog = () => {
    if (!selectedDate) return null;

    const formattedDate = format(selectedDate, "EEEE, MMMM d, yyyy");
    return (
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Calendar className="mr-2 h-5 w-5" />
              {formattedDate}
            </DialogTitle>
            <DialogDescription>Metrics logged for this date</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {selectedDateMetrics.length === 0 ? (
              <p className="text-center text-muted-foreground">
                No metrics logged for this date
              </p>
            ) : (
              selectedDateMetrics.map((log) => {
                const metric = metrics.find(
                  (m: Metric) => m.id === log.metric_id
                );
                let displayValue = "Unknown";

                try {
                  const value = JSON.parse(log.value);

                  if (typeof value === "boolean") {
                    displayValue = value ? "Completed" : "Not Completed";
                  } else if (typeof value === "number") {
                    displayValue = `${value}${metric?.unit ? ` ${metric.unit}` : ""}`;
                  } else {
                    displayValue = String(value);
                  }
                } catch (e) {
                  console.error("Error parsing log value:", e);
                  displayValue = log.value;
                }

                return (
                  <div key={log.id} className="border rounded-md p-3">
                    <h4 className="font-medium">{metric?.name}</h4>
                    <div className="flex justify-between mt-1">
                      <span className="text-sm text-muted-foreground">
                        Value:
                      </span>
                      <span className="text-sm font-medium">
                        {displayValue}
                      </span>
                    </div>
                    {log.notes && (
                      <div className="mt-2">
                        <span className="text-sm text-muted-foreground">
                          Notes:
                        </span>
                        <p className="text-sm mt-1">{log.notes}</p>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Metric Calendar View</CardTitle>
      </CardHeader>
      <CardContent>
        {renderHeader()}
        {renderDays()}
        {renderCells()}
        {renderSelectedDateDialog()}
      </CardContent>
    </Card>
  );
}
