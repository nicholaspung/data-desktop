// src/features/time-planner/edit-time-block-dialog.tsx
import { useState, useEffect } from "react";
import { TimeBlock } from "./types";
import ReusableDialog from "@/components/reusable/reusable-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  const [dayOfWeek, setDayOfWeek] = useState<number>(timeBlock.dayOfWeek);
  const [startHour, setStartHour] = useState<number>(timeBlock.startHour);
  const [startMinute, setStartMinute] = useState<number>(timeBlock.startMinute);
  const [endHour, setEndHour] = useState<number>(timeBlock.endHour);
  const [endMinute, setEndMinute] = useState<number>(timeBlock.endMinute);
  const [category, setCategory] = useState(timeBlock.category);
  const [color, setColor] = useState(timeBlock.color || "#3b82f6");

  // Reset form and set default values when dialog opens or timeBlock changes
  useEffect(() => {
    if (open) {
      setTitle(timeBlock.title);
      setDescription(timeBlock.description || "");
      setDayOfWeek(timeBlock.dayOfWeek);
      setStartHour(timeBlock.startHour);
      setStartMinute(timeBlock.startMinute);
      setEndHour(timeBlock.endHour);
      setEndMinute(timeBlock.endMinute);
      setCategory(timeBlock.category);
      setColor(timeBlock.color || "#3b82f6");
    }
  }, [open, timeBlock]);

  const handleSubmit = () => {
    if (!title || !category) return;

    const updatedBlock: TimeBlock = {
      ...timeBlock,
      title,
      description: description || undefined,
      dayOfWeek,
      startHour,
      startMinute,
      endHour,
      endMinute,
      category,
      color,
    };

    onUpdateBlock(updatedBlock);
  };

  const handleSelectCategory = (
    catId: string,
    catName: string,
    catColor: string
  ) => {
    setCategory(catName);
    setColor(catColor);
  };

  // Generate hours for select options
  const hours = Array.from({ length: 24 }, (_, i) => i);

  // Generate minutes for select options (every 15 minutes)
  const minutes = [0, 15, 30, 45];

  const daysOfWeek = [
    { name: "Monday", value: 1 },
    { name: "Tuesday", value: 2 },
    { name: "Wednesday", value: 3 },
    { name: "Thursday", value: 4 },
    { name: "Friday", value: 5 },
    { name: "Saturday", value: 6 },
    { name: "Sunday", value: 0 },
  ];

  // Helper function to format hours for display
  const formatHour = (hour: number) => {
    const period = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12; // Convert 0 to 12 for 12AM
    return `${displayHour}:00 ${period}`;
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

          <div className="space-y-2">
            <Label htmlFor="day">Day</Label>
            <Select
              value={dayOfWeek.toString()}
              onValueChange={(value) => setDayOfWeek(Number(value))}
            >
              <SelectTrigger id="day">
                <SelectValue placeholder="Select day" />
              </SelectTrigger>
              <SelectContent>
                {daysOfWeek.map((day) => (
                  <SelectItem key={day.value} value={day.value.toString()}>
                    {day.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Time</Label>
              <div className="flex space-x-2">
                <Select
                  value={startHour.toString()}
                  onValueChange={(value) => setStartHour(Number(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Hour" />
                  </SelectTrigger>
                  <SelectContent>
                    {hours.map((hour) => (
                      <SelectItem
                        key={`start-hour-${hour}`}
                        value={hour.toString()}
                      >
                        {formatHour(hour)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={startMinute.toString()}
                  onValueChange={(value) => setStartMinute(Number(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Minute" />
                  </SelectTrigger>
                  <SelectContent>
                    {minutes.map((minute) => (
                      <SelectItem
                        key={`start-minute-${minute}`}
                        value={minute.toString()}
                      >
                        :{minute.toString().padStart(2, "0")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>End Time</Label>
              <div className="flex space-x-2">
                <Select
                  value={endHour.toString()}
                  onValueChange={(value) => setEndHour(Number(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Hour" />
                  </SelectTrigger>
                  <SelectContent>
                    {hours.map((hour) => (
                      <SelectItem
                        key={`end-hour-${hour}`}
                        value={hour.toString()}
                      >
                        {formatHour(hour)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={endMinute.toString()}
                  onValueChange={(value) => setEndMinute(Number(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Minute" />
                  </SelectTrigger>
                  <SelectContent>
                    {minutes.map((minute) => (
                      <SelectItem
                        key={`end-minute-${minute}`}
                        value={minute.toString()}
                      >
                        :{minute.toString().padStart(2, "0")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
