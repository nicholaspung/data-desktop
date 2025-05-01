// src/features/time-planner/time-planner.tsx
import { useState, useEffect } from "react";
import { addDays, format, startOfWeek, isSameDay } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import TimePlannerDay from "./time-planner-day";
import AddTimeBlockDialog from "./add-time-block-dialog";
import TimePlannerSummary from "./time-planner-summary";
import { TimeBlock } from "./types";

export default function TimePlanner() {
  const [currentWeekStart, setCurrentWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const [timeBlocks, setTimeBlocks] = useState<Record<string, TimeBlock[]>>({});
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  // Load saved time blocks from localStorage on mount
  useEffect(() => {
    const savedBlocks = localStorage.getItem("timeBlocks");
    if (savedBlocks) {
      try {
        const parsed = JSON.parse(savedBlocks);
        // Convert date strings back to Date objects
        Object.values(parsed).forEach((blocks: any) => {
          blocks.forEach((block: any) => {
            block.startTime = new Date(block.startTime);
            block.endTime = new Date(block.endTime);
          });
        });
        setTimeBlocks(parsed);
      } catch (error) {
        console.error("Failed to parse saved time blocks:", error);
      }
    }
  }, []);

  // Save time blocks to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("timeBlocks", JSON.stringify(timeBlocks));
  }, [timeBlocks]);

  // Generate array of dates for the week
  const weekDays = Array.from({ length: 7 }, (_, i) =>
    addDays(currentWeekStart, i)
  );

  // Handle adding a new time block
  const handleAddTimeBlock = (block: TimeBlock) => {
    const dateKey = format(block.startTime, "yyyy-MM-dd");
    setTimeBlocks((prev) => ({
      ...prev,
      [dateKey]: [...(prev[dateKey] || []), block],
    }));
    setAddDialogOpen(false);
  };

  // Handle editing a time block
  const handleEditTimeBlock = (oldBlock: TimeBlock, newBlock: TimeBlock) => {
    const oldDateKey = format(oldBlock.startTime, "yyyy-MM-dd");
    const newDateKey = format(newBlock.startTime, "yyyy-MM-dd");

    setTimeBlocks((prev) => {
      const newBlocks = { ...prev };

      // Remove the old block
      if (newBlocks[oldDateKey]) {
        newBlocks[oldDateKey] = newBlocks[oldDateKey].filter(
          (b) => b.id !== oldBlock.id
        );

        // Clean up empty arrays
        if (newBlocks[oldDateKey].length === 0) {
          delete newBlocks[oldDateKey];
        }
      }

      // Add the new block
      if (!newBlocks[newDateKey]) {
        newBlocks[newDateKey] = [];
      }
      newBlocks[newDateKey].push(newBlock);

      return newBlocks;
    });
  };

  // Handle deleting a time block
  const handleDeleteTimeBlock = (block: TimeBlock) => {
    const dateKey = format(block.startTime, "yyyy-MM-dd");

    setTimeBlocks((prev) => {
      const newBlocks = { ...prev };
      if (newBlocks[dateKey]) {
        newBlocks[dateKey] = newBlocks[dateKey].filter(
          (b) => b.id !== block.id
        );

        // Clean up empty arrays
        if (newBlocks[dateKey].length === 0) {
          delete newBlocks[dateKey];
        }
      }
      return newBlocks;
    });
  };

  // Get blocks for a specific day
  const getBlocksForDay = (date: Date): TimeBlock[] => {
    const dateKey = format(date, "yyyy-MM-dd");
    return timeBlocks[dateKey] || [];
  };

  // Navigate to previous week
  const goToPreviousWeek = () => {
    setCurrentWeekStart((prev) => addDays(prev, -7));
  };

  // Navigate to next week
  const goToNextWeek = () => {
    setCurrentWeekStart((prev) => addDays(prev, 7));
  };

  // Get all blocks for the current week
  const getAllBlocksForWeek = (): TimeBlock[] => {
    return weekDays.flatMap((day) => getBlocksForDay(day));
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">
          Week of {format(currentWeekStart, "MMMM d, yyyy")}
        </h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={goToPreviousWeek}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Previous
          </Button>
          <Button variant="outline" size="sm" onClick={goToNextWeek}>
            Next <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
        {weekDays.map((day) => (
          <Card
            key={format(day, "yyyy-MM-dd")}
            className={`border ${
              isSameDay(day, new Date()) ? "border-primary" : ""
            }`}
          >
            <CardHeader className="p-3">
              <CardTitle className="text-sm font-medium">
                <div className="flex justify-between items-center">
                  <span>{format(day, "EEE, MMM d")}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => {
                      setSelectedDate(day);
                      setAddDialogOpen(true);
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[300px]">
                <TimePlannerDay
                  date={day}
                  timeBlocks={getBlocksForDay(day)}
                  onEdit={handleEditTimeBlock}
                  onDelete={handleDeleteTimeBlock}
                  onAddBlock={(date) => {
                    setSelectedDate(date);
                    setAddDialogOpen(true);
                  }}
                />
              </ScrollArea>
            </CardContent>
          </Card>
        ))}
      </div>

      <TimePlannerSummary timeBlocks={getAllBlocksForWeek()} />

      <AddTimeBlockDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onAddBlock={handleAddTimeBlock}
        selectedDate={selectedDate}
      />
    </div>
  );
}
