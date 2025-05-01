// src/features/time-planner/add-time-block-dialog.tsx
import { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
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
import { ScrollArea } from "@/components/ui/scroll-area";

interface AddTimeBlockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddBlock: (block: TimeBlock) => void;
  selectedDay: number | null;
}

// Create an array of time options in 15-minute increments
const generateTimeOptions = () => {
  const options = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const formattedHour = hour % 12 || 12; // Convert 0 to 12 for 12AM
      const period = hour >= 12 ? "PM" : "AM";
      const formattedMinute = minute.toString().padStart(2, "0");

      const display = `${formattedHour}:${formattedMinute} ${period}`;
      const value = `${hour}:${minute}`; // Store as 24-hour format for processing

      options.push({ display, value });
    }
  }
  return options;
};

const TIME_OPTIONS = generateTimeOptions();

export default function AddTimeBlockDialog({
  open,
  onOpenChange,
  onAddBlock,
  selectedDay,
}: AddTimeBlockDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dayOfWeek, setDayOfWeek] = useState<number>(1); // Monday as default
  const [startTime, setStartTime] = useState<string>("9:0"); // Default to 9:00 AM
  const [endTime, setEndTime] = useState<string>("10:0"); // Default to 10:00 AM
  const [category, setCategory] = useState("");
  const [color, setColor] = useState("#3b82f6"); // Default blue color

  // Validation states
  const [errors, setErrors] = useState<{
    title?: string;
    category?: string;
    time?: string;
  }>({});

  // Reset form and set default values when dialog opens
  useEffect(() => {
    if (open) {
      setTitle("");
      setDescription("");
      setDayOfWeek(selectedDay !== null ? selectedDay : 1);
      setStartTime("9:0");
      setEndTime("10:0");
      setCategory("");
      setColor("#3b82f6");
      setErrors({});
    }
  }, [open, selectedDay]);

  const validateForm = () => {
    const newErrors: { title?: string; category?: string; time?: string } = {};

    if (!title.trim()) {
      newErrors.title = "Title is required";
    }

    if (!category) {
      newErrors.category = "Category is required";
    }

    // Parse time values
    const [startHour, startMinute] = startTime.split(":").map(Number);
    const [endHour, endMinute] = endTime.split(":").map(Number);

    // Calculate total minutes for comparison
    const startTotalMinutes = startHour * 60 + startMinute;
    const endTotalMinutes = endHour * 60 + endMinute;

    // Check if end time is before start time (without crossing midnight)
    if (endTotalMinutes <= startTotalMinutes && !(endHour < startHour)) {
      newErrors.time = "End time must be after start time";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    // Parse time values
    const [startHour, startMinute] = startTime.split(":").map(Number);
    const [endHour, endMinute] = endTime.split(":").map(Number);

    const newBlock: TimeBlock = {
      id: uuidv4(),
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

    onAddBlock(newBlock);
  };

  const handleSelectCategory = (catName: string, catColor: string) => {
    setCategory(catName);
    setColor(catColor);
    // Clear category error when selected
    setErrors((prev) => ({ ...prev, category: undefined }));
  };

  // Helper function to check if end time is after start time
  const isEndTimeValid = (start: string, end: string) => {
    const [startHour, startMinute] = start.split(":").map(Number);
    const [endHour, endMinute] = end.split(":").map(Number);

    const startTotalMinutes = startHour * 60 + startMinute;
    const endTotalMinutes = endHour * 60 + endMinute;

    // Allow crossing midnight (e.g., 11 PM to 1 AM)
    if (endHour < startHour) return true;

    return endTotalMinutes > startTotalMinutes;
  };

  const daysOfWeek = [
    { name: "Monday", value: 1 },
    { name: "Tuesday", value: 2 },
    { name: "Wednesday", value: 3 },
    { name: "Thursday", value: 4 },
    { name: "Friday", value: 5 },
    { name: "Saturday", value: 6 },
    { name: "Sunday", value: 0 },
  ];

  return (
    <ReusableDialog
      title="Add Time Block"
      open={open}
      onOpenChange={onOpenChange}
      onConfirm={handleSubmit}
      confirmText="Add Block"
      disableDefaultConfirm
      showTrigger={false}
      confirmIcon={<span className="mr-2">+</span>}
      customContent={
        <ScrollArea className="max-h-[60vh] pr-3 overflow-y-auto">
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label
                htmlFor="title"
                className={errors.title ? "text-destructive" : ""}
              >
                Title{" "}
                {errors.title && <span className="text-destructive">*</span>}
              </Label>
              <Input
                id="title"
                placeholder="Meeting, Work, Exercise, etc."
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (e.target.value.trim()) {
                    setErrors((prev) => ({ ...prev, title: undefined }));
                  }
                }}
                className={errors.title ? "border-destructive" : ""}
              />
              {errors.title && (
                <p className="text-sm text-destructive">{errors.title}</p>
              )}
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
                <Label
                  htmlFor="start-time"
                  className={errors.time ? "text-destructive" : ""}
                >
                  Start Time
                </Label>
                <Select
                  value={startTime}
                  onValueChange={(value) => {
                    setStartTime(value);
                    // Clear time error if the new selection is valid
                    if (isEndTimeValid(value, endTime)) {
                      setErrors((prev) => ({ ...prev, time: undefined }));
                    } else {
                      setErrors((prev) => ({
                        ...prev,
                        time: "End time must be after start time",
                      }));
                    }
                  }}
                >
                  <SelectTrigger
                    id="start-time"
                    className={errors.time ? "border-destructive" : ""}
                  >
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_OPTIONS.map((option) => (
                      <SelectItem
                        key={`start-${option.value}`}
                        value={option.value}
                      >
                        {option.display}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="end-time"
                  className={errors.time ? "text-destructive" : ""}
                >
                  End Time{" "}
                  {errors.time && <span className="text-destructive">*</span>}
                </Label>
                <Select
                  value={endTime}
                  onValueChange={(value) => {
                    setEndTime(value);
                    // Clear time error if the new selection is valid
                    if (isEndTimeValid(startTime, value)) {
                      setErrors((prev) => ({ ...prev, time: undefined }));
                    } else {
                      setErrors((prev) => ({
                        ...prev,
                        time: "End time must be after start time",
                      }));
                    }
                  }}
                >
                  <SelectTrigger
                    id="end-time"
                    className={errors.time ? "border-destructive" : ""}
                  >
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_OPTIONS.map((option) => (
                      <SelectItem
                        key={`end-${option.value}`}
                        value={option.value}
                      >
                        {option.display}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.time && (
                  <p className="text-sm text-destructive">{errors.time}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label className={errors.category ? "text-destructive" : ""}>
                Category{" "}
                {errors.category && <span className="text-destructive">*</span>}
              </Label>
              <CategoryPicker
                onSelectCategory={handleSelectCategory}
                selectedCategory={category}
              />
              {errors.category && (
                <p className="text-sm text-destructive">{errors.category}</p>
              )}
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
        </ScrollArea>
      }
    />
  );
}
