// src/features/time-planner/add-time-block-dialog.tsx
import { useState, useEffect } from "react";
import { setHours, setMinutes, addHours } from "date-fns";
import { v4 as uuidv4 } from "uuid";
import { TimeBlock } from "./types";
import ReusableDialog from "@/components/reusable/reusable-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import TimePicker from "./time-picker";
import CategoryPicker from "./category-picker";

interface AddTimeBlockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddBlock: (block: TimeBlock) => void;
  selectedDate: Date | null;
}

export default function AddTimeBlockDialog({
  open,
  onOpenChange,
  onAddBlock,
  selectedDate,
}: AddTimeBlockDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState<Date>(new Date());
  const [endTime, setEndTime] = useState<Date>(new Date());
  const [category, setCategory] = useState("");
  const [color, setColor] = useState("#3b82f6"); // Default blue color

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setTitle("");
      setDescription("");

      // Set default times based on selected date or current date
      const baseDate = selectedDate || new Date();
      const defaultStart = setMinutes(setHours(baseDate, 9), 0); // 9:00 AM
      const defaultEnd = addHours(defaultStart, 1); // 1 hour later

      setStartTime(defaultStart);
      setEndTime(defaultEnd);
      setCategory("");
      setColor("#3b82f6");
    }
  }, [open, selectedDate]);

  const handleSubmit = () => {
    if (!title || !startTime || !endTime || !category) return;

    const newBlock: TimeBlock = {
      id: uuidv4(),
      title,
      description: description || undefined,
      startTime,
      endTime,
      category,
      color,
    };

    onAddBlock(newBlock);
  };

  const handleSelectCategory = (catName: string, catColor: string) => {
    setCategory(catName);
    setColor(catColor);
  };

  return (
    <ReusableDialog
      title="Add Time Block"
      open={open}
      onOpenChange={onOpenChange}
      onConfirm={handleSubmit}
      confirmText="Add Block"
      confirmIcon={<span className="mr-2">+</span>}
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
