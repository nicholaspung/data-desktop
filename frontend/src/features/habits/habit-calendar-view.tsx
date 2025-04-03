// src/features/habits/habit-calendar-view.tsx
import { useState, useEffect } from "react";
import { ApiService } from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Check, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
} from "date-fns";

interface HabitEntry {
  id: string;
  date: Date;
  habit_name: string;
  completed: boolean;
  notes?: string;
}

export default function HabitCalendarView() {
  const [data, setData] = useState<HabitEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [availableHabits, setAvailableHabits] = useState<string[]>([]);
  const [selectedHabit, setSelectedHabit] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const records = await ApiService.getRecords<HabitEntry>("habits");

      if (!records || records.length === 0) {
        setData([]);
        setError("No habit data available. Please add some records first.");
        return;
      }

      // Process the data
      const processedRecords = records.map((record) => ({
        ...record,
        date: new Date(record.date),
      }));

      // Extract unique habit names
      const habitNames = Array.from(
        new Set(processedRecords.map((item) => item.habit_name))
      );
      setAvailableHabits(habitNames);

      // Set default selected habit
      if (habitNames.length > 0 && !selectedHabit) {
        setSelectedHabit(habitNames[0]);
      }

      setData(processedRecords);
    } catch (error) {
      console.error("Error loading habit data:", error);
      setError("Failed to load habit data");
    } finally {
      setIsLoading(false);
    }
  };

  // Get days for the selected month
  const getDaysInMonth = () => {
    const firstDayOfMonth = startOfMonth(selectedMonth);
    const lastDayOfMonth = endOfMonth(selectedMonth);

    return eachDayOfInterval({
      start: firstDayOfMonth,
      end: lastDayOfMonth,
    });
  };

  // Get habit status for a specific day
  const getHabitStatusForDay = (day: Date) => {
    if (!selectedHabit) return null;

    const entry = data.find(
      (item) => item.habit_name === selectedHabit && isSameDay(item.date, day)
    );

    return entry ? entry.completed : null;
  };

  // Calculate completion rate for current month
  const getMonthlyCompletionRate = () => {
    if (!selectedHabit) return 0;

    const daysInMonth = getDaysInMonth();
    let completedCount = 0;
    let entryCount = 0;

    daysInMonth.forEach((day) => {
      const status = getHabitStatusForDay(day);
      if (status !== null) {
        entryCount++;
        if (status) completedCount++;
      }
    });

    return entryCount > 0 ? (completedCount / entryCount) * 100 : 0;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || data.length === 0) {
    return (
      <Alert>
        <AlertDescription>
          {error ||
            "No habit data available. Add your first habit entry to see visualizations."}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="flex flex-col md:flex-row gap-4">
          <Select value={selectedHabit || ""} onValueChange={setSelectedHabit}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select habit" />
            </SelectTrigger>
            <SelectContent>
              {availableHabits.map((habit) => (
                <SelectItem key={habit} value={habit}>
                  {habit}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={format(selectedMonth, "yyyy-MM")}
            onValueChange={(value) => setSelectedMonth(new Date(value + "-01"))}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select month" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }, (_, i) => {
                const date = new Date();
                date.setMonth(date.getMonth() - i);
                return (
                  <SelectItem
                    key={format(date, "yyyy-MM")}
                    value={format(date, "yyyy-MM")}
                  >
                    {format(date, "MMMM yyyy")}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        {selectedHabit && (
          <Badge variant="outline" className="px-3 py-1">
            Completion Rate: {getMonthlyCompletionRate().toFixed(0)}%
          </Badge>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {selectedHabit
              ? `${selectedHabit} - ${format(selectedMonth, "MMMM yyyy")}`
              : "Select a habit"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {/* Day headers */}
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="text-center font-medium p-2">
                {day}
              </div>
            ))}

            {/* Calendar days */}
            {selectedHabit &&
              getDaysInMonth().map((day, index) => {
                const status = getHabitStatusForDay(day);
                const dayNum = day.getDate();
                const offset = new Date(
                  day.getFullYear(),
                  day.getMonth(),
                  1
                ).getDay();

                // Add empty cells for proper alignment of first week
                if (index === 0) {
                  const emptyCells = [];
                  for (let i = 0; i < offset; i++) {
                    emptyCells.push(
                      <div key={`empty-${i}`} className="p-2"></div>
                    );
                  }

                  return [
                    ...emptyCells,
                    <div
                      key={format(day, "yyyy-MM-dd")}
                      className={`p-2 text-center border rounded-md ${
                        status === true
                          ? "bg-green-100 dark:bg-green-900/30"
                          : status === false
                            ? "bg-red-100 dark:bg-red-900/30"
                            : "bg-muted/50"
                      }`}
                    >
                      <div className="font-medium">{dayNum}</div>
                      {status !== null && (
                        <div className="mt-1">
                          {status ? (
                            <Check className="h-5 w-5 mx-auto text-green-600 dark:text-green-400" />
                          ) : (
                            <X className="h-5 w-5 mx-auto text-red-600 dark:text-red-400" />
                          )}
                        </div>
                      )}
                    </div>,
                  ];
                }

                return (
                  <div
                    key={format(day, "yyyy-MM-dd")}
                    className={`p-2 text-center border rounded-md ${
                      status === true
                        ? "bg-green-100 dark:bg-green-900/30"
                        : status === false
                          ? "bg-red-100 dark:bg-red-900/30"
                          : "bg-muted/50"
                    }`}
                  >
                    <div className="font-medium">{dayNum}</div>
                    {status !== null && (
                      <div className="mt-1">
                        {status ? (
                          <Check className="h-5 w-5 mx-auto text-green-600 dark:text-green-400" />
                        ) : (
                          <X className="h-5 w-5 mx-auto text-red-600 dark:text-red-400" />
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
