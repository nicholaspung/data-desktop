import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  TrendingUp,
  TrendingDown,
  Activity,
  BookOpen,
} from "lucide-react";
import { DailyJournalEntry } from "@/store/journaling-definitions";
import { useStore } from "@tanstack/react-store";
import dataStore from "@/store/data-store";
import { format, isToday } from "date-fns";
import DailyJournalHistory from "./daily-journal-history";
import { useState } from "react";

interface DailySummaryViewProps {
  selectedDate: Date;
  entries: DailyJournalEntry[];
}

export default function DailySummaryView({
  selectedDate,
  entries,
}: DailySummaryViewProps) {
  const [dateInput, setDateInput] = useState(
    format(selectedDate, "yyyy-MM-dd")
  );

  const dailyLogs = useStore(dataStore, (state) => state.daily_logs || []);
  const bodyMeasurements = useStore(
    dataStore,
    (state) => state.body_measurements || []
  );

  const selectedDateMetrics = dailyLogs.filter((log) => {
    const logDate = new Date(log.date);
    return (
      logDate.getDate() === selectedDate.getDate() &&
      logDate.getMonth() === selectedDate.getMonth() &&
      logDate.getFullYear() === selectedDate.getFullYear()
    );
  });

  const selectedDateMeasurements = bodyMeasurements.filter((measurement) => {
    const measurementDate = new Date(measurement.date);
    return (
      measurementDate.getDate() === selectedDate.getDate() &&
      measurementDate.getMonth() === selectedDate.getMonth() &&
      measurementDate.getFullYear() === selectedDate.getFullYear()
    );
  });

  const getDateLabel = (date: Date) => {
    if (isToday(date)) return "Today";
    return format(date, "EEEE, MMMM d, yyyy");
  };

  const handleDateChange = (newDate: string) => {
    setDateInput(newDate);
  };

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous)
      return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (current < previous)
      return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <Activity className="h-4 w-4 text-gray-600" />;
  };

  return (
    <div className="space-y-6">
      {/* Date Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Daily Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">
                Select Date
              </label>
              <input
                type="date"
                value={dateInput}
                onChange={(e) => handleDateChange(e.target.value)}
                className="px-3 py-2 border rounded-md"
              />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold">
                {getDateLabel(selectedDate)}
              </h3>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Journal Entries for Selected Date */}
      {entries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Journal Entries ({entries.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DailyJournalHistory entries={entries} showDate={false} />
          </CardContent>
        </Card>
      )}

      {/* Existing Metrics for the Day */}
      {selectedDateMetrics.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Recorded Metrics ({selectedDateMetrics.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedDateMetrics.map((metric) => (
                <div key={metric.id} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">
                      {metric.metric_id_data?.name || "Metric"}
                    </span>
                    <span className="text-lg font-bold">{metric.value}</span>
                  </div>
                  {metric.notes && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {metric.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Body Measurements */}
      {selectedDateMeasurements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Body Measurements ({selectedDateMeasurements.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedDateMeasurements.map((measurement) => (
                <div key={measurement.id} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">
                      {measurement.measurement || "Measurement"}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold">
                        {measurement.value} {measurement.unit}
                      </span>
                      {/* Add trend indicator if we have previous data */}
                      {getTrendIcon(Number(measurement.value), 0)}
                    </div>
                  </div>
                  {/* Body measurements don't currently have notes field */}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {entries.length === 0 &&
        selectedDateMetrics.length === 0 &&
        selectedDateMeasurements.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                No Data for This Date
              </h3>
              <p className="text-muted-foreground">
                No journal entries, metrics, or measurements recorded for{" "}
                {format(selectedDate, "MMMM d, yyyy")}.
              </p>
              <Button
                className="mt-4"
                onClick={() => setDateInput(format(new Date(), "yyyy-MM-dd"))}
              >
                Go to Today
              </Button>
            </CardContent>
          </Card>
        )}
    </div>
  );
}
