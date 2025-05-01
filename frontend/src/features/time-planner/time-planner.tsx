// src/features/time-planner/time-planner.tsx
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus } from "lucide-react";
import TimePlannerDay from "./time-planner-day";
import AddTimeBlockDialog from "./add-time-block-dialog";
import TimePlannerSummary from "./time-planner-summary";
import { TimeBlock } from "./types";

export default function TimePlanner() {
  const [timeBlocks, setTimeBlocks] = useState<Record<number, TimeBlock[]>>({});
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  // Load saved time blocks from localStorage on mount
  useEffect(() => {
    const savedBlocks = localStorage.getItem("weeklyTimeBlocks");
    if (savedBlocks) {
      try {
        const parsed = JSON.parse(savedBlocks);
        setTimeBlocks(parsed);
      } catch (error) {
        console.error("Failed to parse saved time blocks:", error);
      }
    }
  }, []);

  // Save time blocks to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("weeklyTimeBlocks", JSON.stringify(timeBlocks));
  }, [timeBlocks]);

  // Define days of the week
  const daysOfWeek = [
    { name: "Monday", index: 1 },
    { name: "Tuesday", index: 2 },
    { name: "Wednesday", index: 3 },
    { name: "Thursday", index: 4 },
    { name: "Friday", index: 5 },
    { name: "Saturday", index: 6 },
    { name: "Sunday", index: 0 },
  ];

  // Handle adding a new time block
  const handleAddTimeBlock = (block: TimeBlock) => {
    setTimeBlocks((prev) => ({
      ...prev,
      [block.dayOfWeek]: [...(prev[block.dayOfWeek] || []), block],
    }));
    setAddDialogOpen(false);
  };

  // Handle editing a time block
  const handleEditTimeBlock = (oldBlock: TimeBlock, newBlock: TimeBlock) => {
    setTimeBlocks((prev) => {
      const newBlocks = { ...prev };

      // Remove the old block
      if (newBlocks[oldBlock.dayOfWeek]) {
        newBlocks[oldBlock.dayOfWeek] = newBlocks[oldBlock.dayOfWeek].filter(
          (b) => b.id !== oldBlock.id
        );

        // Clean up empty arrays
        if (newBlocks[oldBlock.dayOfWeek].length === 0) {
          delete newBlocks[oldBlock.dayOfWeek];
        }
      }

      // Add the new block
      if (!newBlocks[newBlock.dayOfWeek]) {
        newBlocks[newBlock.dayOfWeek] = [];
      }
      newBlocks[newBlock.dayOfWeek].push(newBlock);

      return newBlocks;
    });
  };

  // Handle deleting a time block
  const handleDeleteTimeBlock = (block: TimeBlock) => {
    setTimeBlocks((prev) => {
      const newBlocks = { ...prev };
      if (newBlocks[block.dayOfWeek]) {
        newBlocks[block.dayOfWeek] = newBlocks[block.dayOfWeek].filter(
          (b) => b.id !== block.id
        );

        // Clean up empty arrays
        if (newBlocks[block.dayOfWeek].length === 0) {
          delete newBlocks[block.dayOfWeek];
        }
      }
      return newBlocks;
    });
  };

  // Get blocks for a specific day
  const getBlocksForDay = (dayIndex: number): TimeBlock[] => {
    return timeBlocks[dayIndex] || [];
  };

  // Get all blocks for the week
  const getAllBlocksForWeek = (): TimeBlock[] => {
    return Object.values(timeBlocks).flat();
  };

  return (
    <div className="space-y-4 mt-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Weekly Schedule</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
        {daysOfWeek.map((day) => (
          <Card key={day.index} className="border">
            <CardHeader className="p-3">
              <CardTitle className="text-sm font-medium">
                <div className="flex justify-between items-center">
                  <span>{day.name}</span>
                  <button
                    className="h-6 w-6 rounded-full flex items-center justify-center hover:bg-accent"
                    onClick={() => {
                      setSelectedDay(day.index);
                      setAddDialogOpen(true);
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[300px]">
                <TimePlannerDay
                  dayIndex={day.index}
                  timeBlocks={getBlocksForDay(day.index)}
                  onEdit={handleEditTimeBlock}
                  onDelete={handleDeleteTimeBlock}
                  onAddBlock={(dayIndex) => {
                    setSelectedDay(dayIndex);
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
        selectedDay={selectedDay}
      />
    </div>
  );
}
