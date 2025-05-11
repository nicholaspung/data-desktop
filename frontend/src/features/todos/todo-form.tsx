// frontend/src/features/todos/todo-form.tsx
import { useState } from "react";
import { useStore } from "@tanstack/react-store";
import dataStore, { addEntry, updateEntry } from "@/store/data-store";
import loadingStore from "@/store/loading-store";
import { Todo, TodoStatus, TodoPriority } from "@/store/todo-definitions.d";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar as CalendarIcon, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { ApiService } from "@/services/api";
import ReusableSelect from "@/components/reusable/reusable-select";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import TagInput from "@/components/reusable/tag-input";

interface TodoFormProps {
  onSuccess?: () => void;
  existingTodo?: Todo;
}

export default function TodoForm({ onSuccess, existingTodo }: TodoFormProps) {
  const isEditMode = !!existingTodo;

  // Get metrics and categories from store instead of API call
  const metrics = useStore(dataStore, (state) => state.metrics);
  const metricCategories = useStore(
    dataStore,
    (state) => state.metric_categories
  );
  const isLoadingMetrics = useStore(loadingStore, (state) => state.metrics);

  // Get all todos to extract available tags
  const allTodos = useStore(dataStore, (state) => state.todos);

  // Default state for a new todo
  const [title, setTitle] = useState(existingTodo?.title || "");
  const [description, setDescription] = useState(
    existingTodo?.description || ""
  );
  const [deadline, setDeadline] = useState<Date>(
    existingTodo?.deadline ? new Date(existingTodo.deadline) : new Date()
  );
  const [priority, setPriority] = useState<TodoPriority>(
    (existingTodo?.priority as TodoPriority) || TodoPriority.MEDIUM
  );
  // Change tags from array to comma-separated string for TagInput
  const [tagsString, setTagsString] = useState<string>(
    existingTodo?.tags || ""
  );
  const [relatedMetricId, setRelatedMetricId] = useState<string>(
    existingTodo?.relatedMetricId || ""
  );
  const [metricType, setMetricType] = useState<
    "completion" | "time" | undefined
  >(existingTodo?.metricType as "completion" | "time" | undefined);
  const [reminderDate, setReminderDate] = useState<Date | undefined>(
    existingTodo?.reminderDate ? new Date(existingTodo.reminderDate) : undefined
  );
  const [createMetric, setCreateMetric] = useState(!isEditMode);
  const [isPrivate, setIsPrivate] = useState(false);

  // For validation
  const [errors, setErrors] = useState<{
    title?: string;
    deadline?: string;
    metricType?: string;
  }>({});

  // For overall form validation
  const [formError, setFormError] = useState<string | null>(null);

  // For form submission
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validate the form
  const validateForm = () => {
    const newErrors: {
      title?: string;
      deadline?: string;
      metricType?: string;
    } = {};

    // Clear form error
    setFormError(null);

    if (!title.trim()) {
      newErrors.title = "Title is required";
    }

    if (!deadline) {
      newErrors.deadline = "Deadline is required";
    }

    if (createMetric && !metricType) {
      newErrors.metricType = "Please select a metric type";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      setFormError("Please fix the errors before submitting the form");
      return false;
    }

    return true;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      // Create a metric if enabled and not in edit mode
      let metricId = relatedMetricId;
      if (createMetric && !isEditMode && metricType) {
        // First, check if "Todo" category exists, if not create it
        let todoCategoryId: string;
        const existingCategory = metricCategories.find(
          (cat) => cat.name === "Todo"
        );

        if (existingCategory) {
          todoCategoryId = existingCategory.id;
        } else {
          // Create "Todo" category
          const newCategory = {
            name: "Todo",
          };
          const savedCategory = await ApiService.addRecord(
            "metric_categories",
            newCategory
          );
          if (savedCategory) {
            todoCategoryId = savedCategory.id;
            addEntry(savedCategory, "metric_categories");
          } else {
            throw new Error("Failed to create Todo category");
          }
        }

        // Define the new metric
        const newMetric = {
          name: `${title} Progress`,
          description: `Tracks progress for todo: ${title}`,
          type: metricType === "completion" ? "boolean" : "number",
          unit: metricType === "time" ? "minutes" : undefined,
          default_value: metricType === "completion" ? "false" : "0",
          active: true,
          private: false,
          schedule_frequency: "daily",
          goal_type: metricType === "completion" ? "boolean" : "minimum",
          goal_value: metricType === "completion" ? "true" : "30",
          category_id: todoCategoryId,
        };

        // Save the new metric and get its ID
        const savedMetric = await ApiService.addRecord("metrics", newMetric);
        if (savedMetric) {
          metricId = savedMetric.id;
          addEntry(savedMetric, "metrics");
          toast.success("Created associated tracking metric");
        }
      }

      // Prepare the todo data
      const todoData: any = {
        title,
        description: description || undefined,
        deadline: deadline.toISOString(),
        priority,
        tags: tagsString,
        relatedMetricId: metricId || undefined,
        metricType: metricType || undefined,
        reminderDate: reminderDate?.toISOString(),
        is_complete: false,
        status: TodoStatus.NOT_STARTED,
        private: isPrivate,
      };

      if (isEditMode && existingTodo) {
        // Update existing todo
        const response = await ApiService.updateRecord(existingTodo.id, {
          ...existingTodo,
          ...todoData,
        });

        if (response) {
          updateEntry(existingTodo.id, response, "todos");
          toast.success("Todo updated successfully");
          onSuccess?.();
        }
      } else {
        // Create new todo
        const response = await ApiService.addRecord("todos", todoData);

        if (response) {
          addEntry(response, "todos");
          toast.success("Todo created successfully");
          onSuccess?.();
        }
      }
    } catch (error) {
      console.error("Failed to save todo:", error);
      toast.error(
        isEditMode ? "Failed to update todo" : "Failed to create todo"
      );
      setFormError("An error occurred while saving. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter active metrics only
  const activeMetrics = metrics.filter((metric) => metric.active);

  // Format the metric options for display
  const metricOptions = activeMetrics.map((metric) => ({
    id: metric.id,
    label: metric.name,
    description: metric.description,
    type: metric.type,
  }));

  // Priority options for select
  const priorityOptions = [
    { id: TodoPriority.LOW, label: "Low" },
    { id: TodoPriority.MEDIUM, label: "Medium" },
    { id: TodoPriority.HIGH, label: "High" },
    { id: TodoPriority.URGENT, label: "Urgent" },
  ];

  // Metric type options for select
  const metricTypeOptions = [
    { id: "completion", label: "Completion (Yes/No)" },
    { id: "time", label: "Time Tracked (Minutes)" },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-2">
      {/* Form error alert */}
      {formError && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}

      {/* Required fields notice */}
      <div className="text-sm text-muted-foreground mb-2">
        Fields marked with * are required
      </div>

      <div className="space-y-2">
        <Label
          htmlFor="title"
          className={errors.title ? "text-destructive" : ""}
        >
          Title <span className="text-destructive">*</span>
        </Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (e.target.value.trim()) {
              setErrors((prev) => ({ ...prev, title: undefined }));
              setFormError(null);
            }
          }}
          placeholder="What needs to be done?"
          className={errors.title ? "border-destructive" : ""}
        />
        {errors.title && (
          <p className="text-xs text-destructive flex items-center gap-1 mt-1">
            <AlertCircle className="h-3 w-3" />
            {errors.title}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">
          Description{" "}
          <span className="text-xs text-muted-foreground">(optional)</span>
        </Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add details about this todo"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label
            htmlFor="deadline"
            className={errors.deadline ? "text-destructive" : ""}
          >
            Deadline <span className="text-destructive">*</span>
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="deadline"
                variant="outline"
                className={`w-full justify-start text-left font-normal ${
                  errors.deadline ? "border-destructive" : ""
                }`}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {deadline ? format(deadline, "PPP") : "Select deadline"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={deadline}
                onSelect={(date) => {
                  if (date) {
                    setDeadline(date);
                    setErrors((prev) => ({ ...prev, deadline: undefined }));
                    setFormError(null);
                  }
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          {errors.deadline && (
            <p className="text-xs text-destructive flex items-center gap-1 mt-1">
              <AlertCircle className="h-3 w-3" />
              {errors.deadline}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="priority">
            Priority <span className="text-destructive">*</span>
          </Label>
          <ReusableSelect
            options={priorityOptions}
            value={priority}
            onChange={(value) => setPriority(value as TodoPriority)}
            placeholder="Select priority"
            triggerClassName="w-full"
          />
        </div>
      </div>

      {/* Replace the old tags section with TagInput component */}
      <TagInput
        value={tagsString}
        onChange={setTagsString}
        label="Tags (optional)"
        generalData={allTodos}
        generalDataTagField="tags"
      />

      <div className="space-y-4">
        <Label htmlFor="tracking">
          Progress Tracking{" "}
          <span className="text-xs text-muted-foreground">(optional)</span>
        </Label>

        {!isEditMode && (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="create-metric"
                className="h-4 w-4"
                checked={createMetric}
                onChange={(e) => {
                  setCreateMetric(e.target.checked);
                  // Clear any metric-related errors if unchecked
                  if (!e.target.checked) {
                    setErrors((prev) => ({ ...prev, metricType: undefined }));
                    setFormError(null);
                  }
                }}
              />
              <Label htmlFor="create-metric" className="text-sm font-normal">
                Create a metric to track progress on this todo
              </Label>
            </div>

            {createMetric && (
              <div className="pl-6 space-y-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="metric-type"
                    className={errors.metricType ? "text-destructive" : ""}
                  >
                    Metric Type <span className="text-destructive">*</span>
                  </Label>
                  <ReusableSelect
                    options={metricTypeOptions}
                    value={metricType || ""}
                    onChange={(value) => {
                      setMetricType(value as "completion" | "time" | undefined);
                      setErrors((prev) => ({ ...prev, metricType: undefined }));
                      setFormError(null);
                    }}
                    placeholder="Select metric type"
                    triggerClassName={cn(
                      "w-full",
                      errors.metricType ? "border-destructive" : ""
                    )}
                  />
                  {errors.metricType && (
                    <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.metricType}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Completion tracks whether you worked on this todo each day.
                    Time tracked logs how many minutes you spent working on it.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {!createMetric && (
          <div className="space-y-2">
            <Label htmlFor="related-metric">
              Link to Existing Metric{" "}
              <span className="text-xs text-muted-foreground">(optional)</span>
            </Label>
            <ReusableSelect
              options={metricOptions}
              value={relatedMetricId}
              onChange={setRelatedMetricId}
              isLoading={isLoadingMetrics}
              placeholder="Select a metric to track progress"
              triggerClassName="w-full"
              renderItem={(option) => (
                <div className="flex flex-col">
                  <span>{option.label}</span>
                  {option.description && (
                    <span className="text-xs text-muted-foreground">
                      {option.description}
                    </span>
                  )}
                </div>
              )}
            />
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="reminder">
          Reminder Date{" "}
          <span className="text-xs text-muted-foreground">(optional)</span>
        </Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              id="reminder"
              variant="outline"
              className="w-full justify-start text-left font-normal"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {reminderDate ? format(reminderDate, "PPP") : "Set reminder date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={reminderDate}
              onSelect={(date) => setReminderDate(date || undefined)}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        <p className="text-xs text-muted-foreground">
          You'll be reminded about this todo on the selected date
        </p>
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="private" className="cursor-pointer">
          Private (PIN Protected)
        </Label>
        <Switch
          id="private"
          checked={isPrivate}
          onCheckedChange={setIsPrivate}
        />
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="submit" disabled={isSubmitting} className="gap-2">
          {isSubmitting && (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          )}
          {isEditMode ? "Update Todo" : "Create Todo"}
        </Button>
      </div>
    </form>
  );
}
