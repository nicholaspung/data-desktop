// src/features/time-planner/time-planner-day.tsx
import { useState } from "react";
import { MoreHorizontal, PlusCircle } from "lucide-react";
import { TimeBlock } from "./types";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import TimeBlockDialog from "./time-block-dialog";

interface TimePlannerDayProps {
  dayIndex: number;
  timeBlocks: TimeBlock[];
  onEdit: (oldBlock: TimeBlock, newBlock: TimeBlock) => void;
  onDelete: (block: TimeBlock) => void;
  onAddBlock?: (dayIndex: number) => void;
}

export default function TimePlannerDay({
  dayIndex,
  timeBlocks,
  onEdit,
  onDelete,
  onAddBlock,
}: TimePlannerDayProps) {
  const [editingBlock, setEditingBlock] = useState<TimeBlock | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // Sort blocks by start time
  const sortedBlocks = [...timeBlocks].sort((a, b) => {
    // Compare hours first
    if (a.startHour !== b.startHour) {
      return a.startHour - b.startHour;
    }
    // If hours are the same, compare minutes
    return a.startMinute - b.startMinute;
  });

  const handleOpenEdit = (block: TimeBlock) => {
    setEditingBlock(block);
    setEditDialogOpen(true);
  };

  const handleUpdateBlock = (newBlock: TimeBlock) => {
    if (editingBlock) {
      onEdit(editingBlock, newBlock);
      setEditingBlock(null);
    }
  };

  const formatTime = (hour: number, minute: number) => {
    // Convert 24-hour to 12-hour format with AM/PM
    const period = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12; // Convert 0 to 12 for 12AM
    const displayMinute = minute.toString().padStart(2, "0");
    return `${displayHour}:${displayMinute} ${period}`;
  };

  const getDurationText = (block: TimeBlock) => {
    // Calculate duration in minutes
    const startMinutes = block.startHour * 60 + block.startMinute;
    const endMinutes = block.endHour * 60 + block.endMinute;
    let duration = endMinutes - startMinutes;

    // Handle duration that crosses midnight
    if (duration < 0) {
      duration += 24 * 60;
    }

    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;

    if (hours === 0) {
      return `${minutes}m`;
    } else if (minutes === 0) {
      return `${hours}h`;
    } else {
      return `${hours}h ${minutes}m`;
    }
  };

  if (sortedBlocks.length === 0) {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground">
        {onAddBlock && (
          <Button
            variant="ghost"
            size="sm"
            className="mt-2"
            onClick={() => onAddBlock(dayIndex)}
          >
            <PlusCircle className="h-4 w-4 mr-1" />
            Add Time Block
          </Button>
        )}
        {!onAddBlock && "No time blocks planned for this day"}
      </div>
    );
  }

  return (
    <>
      <div className="divide-y">
        {sortedBlocks.map((block) => (
          <div
            key={block.id}
            className="p-3 hover:bg-accent/50 transition-colors relative"
            style={{
              borderLeft: `4px solid ${block.color || "#888888"}`,
            }}
          >
            <div className="flex justify-between items-start">
              <div className="space-y-1 pr-8">
                <h4 className="font-medium text-sm">{block.title}</h4>
                <div className="text-xs text-muted-foreground">
                  {formatTime(block.startHour, block.startMinute)} -{" "}
                  {formatTime(block.endHour, block.endMinute)}
                  <span className="mx-1">•</span>
                  {getDurationText(block)}
                </div>
                {block.description && (
                  <p className="text-xs mt-1">{block.description}</p>
                )}
                <div className="inline-block px-2 py-1 bg-muted text-xs rounded-full mt-1">
                  {block.category}
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 absolute top-3 right-2"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleOpenEdit(block)}>
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onDelete(block)}
                    className="text-destructive focus:text-destructive"
                  >
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ))}
      </div>

      {/* Use the unified dialog for editing */}
      <TimeBlockDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSave={handleUpdateBlock}
        timeBlock={editingBlock || undefined}
      />
    </>
  );
}
