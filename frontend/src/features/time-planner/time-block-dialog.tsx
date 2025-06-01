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

interface TimeBlockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (block: TimeBlock) => void;
  timeBlock?: TimeBlock;
  selectedDay?: number | null;
}

const generateTimeOptions = () => {
  const options = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const formattedHour = hour % 12 || 12;
      const period = hour >= 12 ? "PM" : "AM";
      const formattedMinute = minute.toString().padStart(2, "0");

      const display = `${formattedHour}:${formattedMinute} ${period}`;
      const value = `${hour}:${minute}`;

      options.push({ display, value });
    }
  }
  return options;
};

const TIME_OPTIONS = generateTimeOptions();

export default function TimeBlockDialog({
  open,
  onOpenChange,
  onSave,
  timeBlock,
  selectedDay,
}: TimeBlockDialogProps) {
  const isEditMode = !!timeBlock;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dayOfWeek, setDayOfWeek] = useState<number>(1);
  const [startTime, setStartTime] = useState<string>("9:0");
  const [endTime, setEndTime] = useState<string>("10:0");
  const [category, setCategory] = useState("");
  const [color, setColor] = useState("#3b82f6");

  const [errors, setErrors] = useState<{
    title?: string;
    category?: string;
    time?: string;
  }>({});

  useEffect(() => {
    if (open) {
      setErrors({});

      if (isEditMode && timeBlock) {
        setTitle(timeBlock.title);
        setDescription(timeBlock.description || "");
        setDayOfWeek(timeBlock.dayOfWeek);
        setStartTime(`${timeBlock.startHour}:${timeBlock.startMinute}`);
        setEndTime(`${timeBlock.endHour}:${timeBlock.endMinute}`);
        setCategory(timeBlock.category);
        setColor(timeBlock.color || "#3b82f6");
      } else {
        setTitle("");
        setDescription("");
        setDayOfWeek(selectedDay || 1);
        setStartTime("9:0");
        setEndTime("10:0");
        setCategory("");
        setColor("#3b82f6");
      }
    }
  }, [open, timeBlock, isEditMode, selectedDay]);

  const validateForm = () => {
    const newErrors: { title?: string; category?: string; time?: string } = {};

    if (!title.trim()) {
      newErrors.title = "Title is required";
    }

    if (!category) {
      newErrors.category = "Category is required";
    }

    const [startHour, startMinute] = startTime.split(":").map(Number);
    const [endHour, endMinute] = endTime.split(":").map(Number);

    const startTotalMinutes = startHour * 60 + startMinute;
    const endTotalMinutes = endHour * 60 + endMinute;

    if (endTotalMinutes <= startTotalMinutes && !(endHour < startHour)) {
      newErrors.time = "End time must be after start time";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    const [startHour, startMinute] = startTime.split(":").map(Number);
    const [endHour, endMinute] = endTime.split(":").map(Number);

    const block: TimeBlock = {
      id: isEditMode && timeBlock ? timeBlock.id : uuidv4(),
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

    onSave(block);
    onOpenChange(false);
  };

  const handleSelectCategory = (catName: string, catColor: string) => {
    setCategory(catName);
    setColor(catColor);
    setErrors((prev) => ({ ...prev, category: undefined }));
  };

  const isEndTimeValid = (start: string, end: string) => {
    const [startHour, startMinute] = start.split(":").map(Number);
    const [endHour, endMinute] = end.split(":").map(Number);

    const startTotalMinutes = startHour * 60 + startMinute;
    const endTotalMinutes = endHour * 60 + endMinute;

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
      title={isEditMode ? "Edit Time Block" : "Add Time Block"}
      open={open}
      onOpenChange={onOpenChange}
      onConfirm={handleSubmit}
      confirmText={isEditMode ? "Update" : "Add Block"}
      disableDefaultConfirm
      showTrigger={false}
      confirmIcon={isEditMode ? undefined : <span className="mr-2">+</span>}
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
