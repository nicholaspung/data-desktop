import { useState, useMemo } from "react";
import { MoreHorizontal, PlusCircle, AlertTriangle } from "lucide-react";
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
  allTimeBlocks?: TimeBlock[];
}

export default function TimePlannerDay({
  dayIndex,
  timeBlocks,
  onEdit,
  onDelete,
  onAddBlock,
  allTimeBlocks = [],
}: TimePlannerDayProps) {
  const [editingBlock, setEditingBlock] = useState<TimeBlock | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const sortedBlocks = [...timeBlocks].sort((a, b) => {
    if (a.startHour !== b.startHour) {
      return a.startHour - b.startHour;
    }

    return a.startMinute - b.startMinute;
  });

  const blocksOverlap = (block1: TimeBlock, block2: TimeBlock): boolean => {
    const start1 = block1.startHour * 60 + block1.startMinute;
    const end1 = block1.endHour * 60 + block1.endMinute;
    const start2 = block2.startHour * 60 + block2.startMinute;
    const end2 = block2.endHour * 60 + block2.endMinute;

    return start1 < end2 && start2 < end1;
  };

  const overlappingBlocks = useMemo(() => {
    const overlaps = new Set<string>();

    for (let i = 0; i < sortedBlocks.length; i++) {
      for (let j = i + 1; j < sortedBlocks.length; j++) {
        if (blocksOverlap(sortedBlocks[i], sortedBlocks[j])) {
          overlaps.add(sortedBlocks[i].id);
          overlaps.add(sortedBlocks[j].id);
        }
      }
    }

    return overlaps;
  }, [sortedBlocks]);

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
    const period = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    const displayMinute = minute.toString().padStart(2, "0");
    return `${displayHour}:${displayMinute} ${period}`;
  };

  const getDurationText = (block: TimeBlock) => {
    const startMinutes = block.startHour * 60 + block.startMinute;
    const endMinutes = block.endHour * 60 + block.endMinute;
    let duration = endMinutes - startMinutes;

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
            className={`p-3 hover:bg-accent/50 transition-colors relative ${
              overlappingBlocks.has(block.id)
                ? "bg-red-50 ring-1 ring-red-200"
                : ""
            }`}
            style={{
              borderLeft: `4px solid ${
                overlappingBlocks.has(block.id)
                  ? "#ef4444"
                  : block.color || "#888888"
              }`,
            }}
          >
            <div className="flex justify-between items-start">
              <div className="space-y-1 pr-8">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-sm">{block.title}</h4>
                  {overlappingBlocks.has(block.id) && (
                    <AlertTriangle className="h-3 w-3 text-red-500" />
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatTime(block.startHour, block.startMinute)} -{" "}
                  {formatTime(block.endHour, block.endMinute)}
                  <span className="mx-1">•</span>
                  {getDurationText(block)}
                  {overlappingBlocks.has(block.id) && (
                    <span className="text-red-600 font-medium ml-2">
                      • Overlap detected
                    </span>
                  )}
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
        existingBlocks={allTimeBlocks}
      />
    </>
  );
}
