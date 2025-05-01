// src/features/time-planner/time-planner-day.tsx
import { useState } from "react";
import { format, differenceInMinutes, isSameDay } from "date-fns";
import { MoreHorizontal, PlusCircle } from "lucide-react";
import { TimeBlock } from "./types";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import EditTimeBlockDialog from "./edit-time-block-dialog";

interface TimePlannerDayProps {
  date: Date;
  timeBlocks: TimeBlock[];
  onEdit: (oldBlock: TimeBlock, newBlock: TimeBlock) => void;
  onDelete: (block: TimeBlock) => void;
  onAddBlock?: (date: Date) => void;
}

export default function TimePlannerDay({
  date,
  timeBlocks,
  onEdit,
  onDelete,
  onAddBlock,
}: TimePlannerDayProps) {
  const [editingBlock, setEditingBlock] = useState<TimeBlock | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // Filter blocks to ensure they belong to this date
  // (Although timeBlocks should already be filtered by the parent)
  const dateBlocks = timeBlocks.filter((block) =>
    isSameDay(block.startTime, date)
  );

  // Sort blocks by start time
  const sortedBlocks = [...dateBlocks].sort(
    (a, b) => a.startTime.getTime() - b.startTime.getTime()
  );

  const handleOpenEdit = (block: TimeBlock) => {
    setEditingBlock(block);
    setEditDialogOpen(true);
  };

  const handleEdit = (newBlock: TimeBlock) => {
    if (editingBlock) {
      onEdit(editingBlock, newBlock);
      setEditingBlock(null);
      setEditDialogOpen(false);
    }
  };

  const getDurationText = (block: TimeBlock) => {
    const minutes = differenceInMinutes(block.endTime, block.startTime);
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (hours === 0) {
      return `${minutes}m`;
    } else if (remainingMinutes === 0) {
      return `${hours}h`;
    } else {
      return `${hours}h ${remainingMinutes}m`;
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
            onClick={() => onAddBlock(date)}
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
                {format(block.startTime, "h:mm a")} -{" "}
                {format(block.endTime, "h:mm a")}
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

      {editingBlock && (
        <EditTimeBlockDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          timeBlock={editingBlock}
          onUpdateBlock={handleEdit}
        />
      )}
    </div>
  );
}
