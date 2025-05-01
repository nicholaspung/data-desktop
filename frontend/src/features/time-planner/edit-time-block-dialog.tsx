// src/features/time-planner/edit-time-block-dialog.tsx
import { useState, useEffect } from "react";
import { TimeBlock } from "./types";
import ReusableDialog from "@/components/reusable/reusable-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import TimePicker from "./time-picker";
import CategoryPicker from "./category-picker";

interface EditTimeBlockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  timeBlock: TimeBlock;
  onUpdateBlock: (block: TimeBlock) => void;
}

export default function EditTimeBlockDialog({
  open,
  onOpenChange,
  timeBlock,
  onUpdateBlock,
}: EditTimeBlockDialogProps) {
  const [title, setTitle] = useState(timeBlock.title);
  const [description, setDescription] = useState(timeBlock.description || "");
  const [startTime, setStartTime] = useState<Date>(timeBlock.startTime);
  const [endTime, setEndTime] = useState<Date>(timeBlock.endTime);
  const [category, setCategory] = useState(timeBlock.category);
  const [color, setColor] = useState(timeBlock.color || "#3b82f6");

  // Reset form when dialog opens or timeBlock changes
  useEffect(() => {
    if (open) {
      setTitle(timeBlock.title);
      setDescription(timeBlock.description || "");
      setStartTime(timeBlock.startTime);
      setEndTime(timeBlock.endTime);
      setCategory(timeBlock.category);
      setColor(timeBlock.color || "#3b82f6");
    }
  }, [open, timeBlock]);

  const handleSubmit = () => {
    if (!title || !startTime || !endTime || !category) return;

    const updatedBlock: TimeBlock = {
      ...timeBlock,
      title,
      description: description || undefined,
      startTime,
      endTime,
      category,
      color,
    };

    onUpdateBlock(updatedBlock);
  };

  const handleSelectCategory = (catName: string, catColor: string) => {
    setCategory(catName);
    setColor(catColor);
  };

  return (
    <ReusableDialog
      title="Edit Time Block"
      open={open}
      onOpenChange={onOpenChange}
      onConfirm={handleSubmit}
      confirmText="Update"
      confirmVariant="default"
      customContent={
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="Meeting, Work, Exercise, etc."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Time</Label>
              <TimePicker value={startTime} onChange={setStartTime} />
            </div>
            <div className="space-y-2">
              <Label>End Time</Label>
              <TimePicker
                value={endTime}
                onChange={setEndTime}
                minTime={startTime}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Category</Label>
            <CategoryPicker
              onSelectCategory={handleSelectCategory}
              selectedCategory={category}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Additional details..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
        </div>
      }
    />
  );
}
