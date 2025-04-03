// src/features/habits/habit-streaks-view.tsx
import { useState, useEffect } from "react";
import { ApiService } from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Flame, Award, TrendingUp } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { BarChart } from "@/components/charts";
import { isSameDay, addDays } from "date-fns";

interface HabitEntry {
  id: string;
  date: Date;
  habit_name: string;
  completed: boolean;
  notes?: string;
}

interface HabitStreak {
  habitName: string;
  currentStreak: number;
  longestStreak: number;
  completionRate: number;
  totalCompleted: number;
  totalEntries: number;
}

export default function HabitStreaksView() {
  const [data, setData] = useState<HabitEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [streakData, setStreakData] = useState<HabitStreak[]>([]);

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

      setData(processedRecords);

      // Calculate streak data
      calculateStreaks(processedRecords);
    } catch (error) {
      console.error("Error loading habit data:", error);
      setError("Failed to load habit data");
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate streak data for all habits
  const calculateStreaks = (entries: HabitEntry[]) => {
    // Get unique habit names
    const habitNames = Array.from(
      new Set(entries.map((item) => item.habit_name))
    );

    // Initialize streak data
    const streaks: HabitStreak[] = [];

    // Calculate streak data for each habit
    habitNames.forEach((habitName) => {
      const habitEntries = entries
        .filter((entry) => entry.habit_name === habitName)
        .sort((a, b) => a.date.getTime() - b.date.getTime());

      if (habitEntries.length === 0) return;

      let currentStreak = 0;
      let longestStreak = 0;
      let streak = 0;
      let prevDate: Date | null = null;

      // Calculate total completed and completion rate
      const totalEntries = habitEntries.length;
      const totalCompleted = habitEntries.filter(
        (entry) => entry.completed
      ).length;
      const completionRate = (totalCompleted / totalEntries) * 100;

      // Calculate streaks
      habitEntries.forEach((entry) => {
        if (entry.completed) {
          // If this is the first entry or the previous entry was on the day before
          if (!prevDate || isSameDay(addDays(prevDate, 1), entry.date)) {
            streak++;
          } else if (!isSameDay(prevDate, entry.date)) {
            // Reset streak if there's a gap
            streak = 1;
          }

          // Update longest streak
          longestStreak = Math.max(longestStreak, streak);
          prevDate = entry.date;
        } else {
          // Reset streak on incomplete entry
          streak = 0;
          prevDate = null;
        }
      });

      // Get the latest entries to check if the streak is current
      const today = new Date();
      const latestEntry = habitEntries[habitEntries.length - 1];

      // If the latest entry is completed and within the last 2 days, consider the streak current
      if (
        latestEntry.completed &&
        (isSameDay(latestEntry.date, today) ||
          isSameDay(latestEntry.date, addDays(today, -1)))
      ) {
        currentStreak = streak;
      } else {
        currentStreak = 0;
      }

      // Add to streaks array
      streaks.push({
        habitName,
        currentStreak,
        longestStreak,
        completionRate,
        totalCompleted,
        totalEntries,
      });
    });

    // Sort streaks by current streak (descending)
    streaks.sort((a, b) => b.currentStreak - a.currentStreak);

    setStreakData(streaks);
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
            "No habit data available. Add your first habit entry to see streak information."}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center">
              <Flame className="h-5 w-5 mr-2 text-orange-500" />
              Current Streaks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {streakData.map((item) => (
                <div
                  key={`current-${item.habitName}`}
                  className="flex justify-between items-center"
                >
                  <span className="font-medium">{item.habitName}</span>
                  <span className="text-2xl">{item.currentStreak} days</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center">
              <Award className="h-5 w-5 mr-2 text-yellow-500" />
              Longest Streaks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...streakData]
                .sort((a, b) => b.longestStreak - a.longestStreak)
                .map((item) => (
                  <div
                    key={`longest-${item.habitName}`}
                    className="flex justify-between items-center"
                  >
                    <span className="font-medium">{item.habitName}</span>
                    <span className="text-2xl">{item.longestStreak} days</span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-green-500" />
              Completion Rates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...streakData]
                .sort((a, b) => b.completionRate - a.completionRate)
                .map((item) => (
                  <div
                    key={`rate-${item.habitName}`}
                    className="flex justify-between items-center"
                  >
                    <span className="font-medium">{item.habitName}</span>
                    <span className="text-2xl">
                      {item.completionRate.toFixed(0)}%
                    </span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Habit Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <BarChart
            data={streakData.map((item) => ({
              name: item.habitName,
              "Completion Rate": item.completionRate,
              "Current Streak": item.currentStreak,
              "Longest Streak": item.longestStreak,
            }))}
            bars={[
              {
                dataKey: "Completion Rate",
                name: "Completion Rate",
                color: "#8884d8",
                unit: "%",
              },
            ]}
            xAxisKey="name"
            yAxisUnit="%"
            height={300}
            tooltipFormatter={(value) => `${Number(value).toFixed(1)}%`}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Streak Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <BarChart
            data={streakData.map((item) => ({
              name: item.habitName,
              "Current Streak": item.currentStreak,
              "Longest Streak": item.longestStreak,
            }))}
            bars={[
              {
                dataKey: "Current Streak",
                name: "Current Streak",
                color: "#82ca9d",
                unit: " days",
              },
              {
                dataKey: "Longest Streak",
                name: "Longest Streak",
                color: "#8884d8",
                unit: " days",
              },
            ]}
            xAxisKey="name"
            yAxisUnit=" days"
            height={300}
            tooltipFormatter={(value) => `${value} days`}
          />
        </CardContent>
      </Card>
    </div>
  );
}
