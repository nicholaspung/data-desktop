import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus } from "lucide-react";
import TimePlannerDay from "./time-planner-day";
import TimePlannerSummary from "./time-planner-summary";
import { TimeBlock, TimeBlockConfig } from "./types";
import TimePlannerConfigManager from "./time-planner-config-manager";
import TimeBlockDialog from "./time-block-dialog";

export default function TimePlanner() {
  const [timeBlocks, setTimeBlocks] = useState<Record<number, TimeBlock[]>>({});
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [currentConfig, setCurrentConfig] = useState<TimeBlockConfig | null>(
    null
  );
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const savedConfigBlocks = useRef<Record<number, TimeBlock[]>>({});

  useEffect(() => {
    localStorage.setItem("weeklyTimeBlocks", JSON.stringify(timeBlocks));
  }, [timeBlocks]);

  useEffect(() => {
    if (currentConfig) {
      const currentBlocksJson = JSON.stringify(timeBlocks);
      const savedBlocksJson = JSON.stringify(savedConfigBlocks.current);
      setHasUnsavedChanges(currentBlocksJson !== savedBlocksJson);
    } else {
      setHasUnsavedChanges(Object.keys(timeBlocks).length > 0);
    }
  }, [timeBlocks, currentConfig]);

  const daysOfWeek = [
    { name: "Monday", index: 1 },
    { name: "Tuesday", index: 2 },
    { name: "Wednesday", index: 3 },
    { name: "Thursday", index: 4 },
    { name: "Friday", index: 5 },
    { name: "Saturday", index: 6 },
    { name: "Sunday", index: 0 },
  ];

  const handleAddTimeBlock = (block: TimeBlock) => {
    setTimeBlocks((prev) => ({
      ...prev,
      [block.dayOfWeek]: [...(prev[block.dayOfWeek] || []), block],
    }));
    setAddDialogOpen(false);
  };

  const handleEditTimeBlock = (oldBlock: TimeBlock, newBlock: TimeBlock) => {
    setTimeBlocks((prev) => {
      const newBlocks = { ...prev };

      if (newBlocks[oldBlock.dayOfWeek]) {
        newBlocks[oldBlock.dayOfWeek] = newBlocks[oldBlock.dayOfWeek].filter(
          (b) => b.id !== oldBlock.id
        );

        if (newBlocks[oldBlock.dayOfWeek].length === 0) {
          delete newBlocks[oldBlock.dayOfWeek];
        }
      }

      if (!newBlocks[newBlock.dayOfWeek]) {
        newBlocks[newBlock.dayOfWeek] = [];
      }
      newBlocks[newBlock.dayOfWeek].push(newBlock);

      return newBlocks;
    });
  };

  const handleDeleteTimeBlock = (block: TimeBlock) => {
    setTimeBlocks((prev) => {
      const newBlocks = { ...prev };
      if (newBlocks[block.dayOfWeek]) {
        newBlocks[block.dayOfWeek] = newBlocks[block.dayOfWeek].filter(
          (b) => b.id !== block.id
        );

        if (newBlocks[block.dayOfWeek].length === 0) {
          delete newBlocks[block.dayOfWeek];
        }
      }
      return newBlocks;
    });
  };

  const getBlocksForDay = (dayIndex: number): TimeBlock[] => {
    return timeBlocks[dayIndex] || [];
  };

  const getAllBlocksForWeek = (): TimeBlock[] => {
    return Object.values(timeBlocks).flat();
  };

  const handleLoadConfig = (blocks: Record<number, TimeBlock[]>) => {
    setTimeBlocks(blocks);
    savedConfigBlocks.current = JSON.parse(JSON.stringify(blocks));
  };

  const handleConfigLoaded = (config: TimeBlockConfig | null) => {
    setCurrentConfig(config);
    if (config) {
      savedConfigBlocks.current = JSON.parse(JSON.stringify(timeBlocks));
    } else {
      savedConfigBlocks.current = {};
    }
    setHasUnsavedChanges(false);
  };

  const handleWipeConfig = () => {
    setTimeBlocks({});
    setCurrentConfig(null);
    savedConfigBlocks.current = {};
    setHasUnsavedChanges(false);
  };

  return (
    <div className="space-y-4 mt-4">
      {/* Header - responsive layout */}
      <div className="flex flex-col space-y-4 lg:flex-row lg:justify-between lg:items-start lg:space-y-0">
        <h2 className="text-xl font-bold">Weekly Schedule</h2>
        <div className="w-full lg:w-auto">
          <TimePlannerConfigManager
            currentTimeBlocks={timeBlocks}
            onLoadConfig={handleLoadConfig}
            onWipeConfig={handleWipeConfig}
            hasUnsavedChanges={hasUnsavedChanges}
            currentConfig={currentConfig}
            onConfigLoaded={handleConfigLoaded}
          />
        </div>
      </div>

      {/* Days grid - responsive breakpoints */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4">
        {daysOfWeek.map((day) => (
          <Card key={day.index} className="border">
            <CardHeader className="p-3">
              <CardTitle className="text-sm font-medium">
                <div className="flex justify-between items-center">
                  <span className="truncate">{day.name}</span>
                  <button
                    className="h-6 w-6 rounded-full flex items-center justify-center hover:bg-accent flex-shrink-0 ml-2"
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
              <ScrollArea className="h-[250px] sm:h-[300px] lg:h-[350px]">
                <TimePlannerDay
                  dayIndex={day.index}
                  timeBlocks={getBlocksForDay(day.index)}
                  onEdit={handleEditTimeBlock}
                  onDelete={handleDeleteTimeBlock}
                  onAddBlock={(dayIndex) => {
                    setSelectedDay(dayIndex);
                    setAddDialogOpen(true);
                  }}
                  allTimeBlocks={getAllBlocksForWeek()}
                />
              </ScrollArea>
            </CardContent>
          </Card>
        ))}
      </div>

      <TimePlannerSummary timeBlocks={getAllBlocksForWeek()} />

      <TimeBlockDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSave={handleAddTimeBlock}
        selectedDay={selectedDay}
        existingBlocks={getAllBlocksForWeek()}
      />
    </div>
  );
}
