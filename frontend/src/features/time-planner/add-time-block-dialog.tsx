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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

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

  // Validation states
  const [errors, setErrors] = useState<{
    title?: string;
    category?: string;
    time?: string;
  }>({});
  const [showValidation, setShowValidation] = useState(false);

  // Reset form when dialog opens
  useEffect(() => {
    if (open && selectedDate) {
      // Reset all form fields
      setTitle("");
      setDescription("");
      setCategory("");
      setColor("#3b82f6");
      setErrors({});
      setShowValidation(false);

      // Create a new date based on the selected date, but keep time at current or default 9am
      const now = new Date();
      // Use the selected date, but with the current time
      const baseDate = new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        selectedDate.getDate(),
        now.getHours(),
        now.getMinutes()
      );

      // If it's before 9am or after 5pm, default to 9am
      const hour = baseDate.getHours();
      if (hour < 9 || hour > 17) {
        const defaultStart = setMinutes(setHours(baseDate, 9), 0); // 9:00 AM
        setStartTime(defaultStart);
        setEndTime(addHours(defaultStart, 1)); // 1 hour later
      } else {
        // Otherwise use the current time
        setStartTime(baseDate);
        setEndTime(addHours(baseDate, 1)); // 1 hour later
      }
    }
  }, [open, selectedDate]);

  // Validate form
  const validateForm = () => {
    const newErrors: {
      title?: string;
      category?: string;
      time?: string;
    } = {};

    if (!title.trim()) {
      newErrors.title = "Title is required";
    }

    if (!category) {
      newErrors.category = "Category is required";
    }

    if (!startTime || !endTime) {
      newErrors.time = "Start and end times are required";
    } else if (startTime >= endTime) {
      newErrors.time = "End time must be after start time";
    }

    setErrors(newErrors);
    setShowValidation(true);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      return;
    }

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

  const handleSelectCategory = (id: string, name: string, color: string) => {
    setCategory(name);
    setColor(color);
    if (showValidation && errors.category) {
      setErrors((prev) => ({ ...prev, category: undefined }));
    }
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    if (showValidation && errors.title && e.target.value.trim()) {
      setErrors((prev) => ({ ...prev, title: undefined }));
    }
  };

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
            {showValidation && Object.keys(errors).length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Please fix the following errors:
                  <ul className="mt-2 list-disc list-inside">
                    {errors.title && <li>{errors.title}</li>}
                    {errors.category && <li>{errors.category}</li>}
                    {errors.time && <li>{errors.time}</li>}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="title" className="flex items-center">
                Title
                {errors.title && showValidation && (
                  <span className="text-destructive ml-1 text-sm">*</span>
                )}
              </Label>
              <Input
                id="title"
                placeholder="Meeting, Work, Exercise, etc."
                value={title}
                onChange={handleTitleChange}
                className={
                  errors.title && showValidation ? "border-destructive" : ""
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label
                  className={
                    errors.time && showValidation ? "text-destructive" : ""
                  }
                >
                  Start Time
                  {errors.time && showValidation && (
                    <span className="text-destructive ml-1">*</span>
                  )}
                </Label>
                <TimePicker
                  value={startTime}
                  onChange={(date) => {
                    setStartTime(date);
                    if (showValidation && errors.time && date < endTime) {
                      setErrors((prev) => ({ ...prev, time: undefined }));
                    }
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label
                  className={
                    errors.time && showValidation ? "text-destructive" : ""
                  }
                >
                  End Time
                  {errors.time && showValidation && (
                    <span className="text-destructive ml-1">*</span>
                  )}
                </Label>
                <TimePicker
                  value={endTime}
                  onChange={(date) => {
                    setEndTime(date);
                    if (showValidation && errors.time && startTime < date) {
                      setErrors((prev) => ({ ...prev, time: undefined }));
                    }
                  }}
                  minTime={startTime}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label
                className={
                  errors.category && showValidation ? "text-destructive" : ""
                }
              >
                Category
                {errors.category && showValidation && (
                  <span className="text-destructive ml-1">*</span>
                )}
              </Label>
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
        </ScrollArea>
      }
    />
  );
}
