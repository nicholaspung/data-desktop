// src/features/experiments/add-metric-form.tsx
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Loader2, Save, Plus } from "lucide-react";
import { useStore } from "@tanstack/react-store";
import dataStore, { addEntry } from "@/store/data-store";
import { ApiService } from "@/services/api";
import { toast } from "sonner";
import ReusableSelect from "@/components/reusable/reusable-select";
import ReusableMultiSelect from "@/components/reusable/reusable-multiselect";
import { Switch } from "@/components/ui/switch";
import { Experiment } from "@/store/experiment-definitions";
import { ProtectedField } from "@/components/security/protected-content";
import AutocompleteInput from "@/components/reusable/autocomplete-input";

export default function AddMetricForm({
  onSuccess,
  onCancel,
  className,
}: {
  onSuccess?: () => void;
  onCancel?: () => void;
  className?: string;
}) {
  // Get available categories from the store
  const categories =
    useStore(dataStore, (state) => state.metric_categories) || [];
  const experiments = useStore(dataStore, (state) => state.experiments) || [];

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<
    "number" | "boolean" | "time" | "percentage"
  >("number");
  const [unit, setUnit] = useState("");
  const [defaultValue, setDefaultValue] = useState("0");

  // Category state
  const [categoryId, setCategoryId] = useState("");
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [isDuplicateCategory, setIsDuplicateCategory] = useState(false);

  const [active, setActive] = useState(true);
  const [isPrivate, setIsPrivate] = useState(false);
  const [experimentId, setExperimentId] = useState<string>("");

  // Schedule fields
  const [scheduleFrequency, setScheduleFrequency] = useState<
    "daily" | "weekly" | "custom"
  >("daily");
  const [scheduleStartDate, setScheduleStartDate] = useState<string>("");
  const [scheduleEndDate, setScheduleEndDate] = useState<string>("");
  const [scheduleDays, setScheduleDays] = useState<string[]>([]);

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [showSchedulingOptions, setShowSchedulingOptions] = useState(false);

  // Format category options for autocomplete
  const categoryOptions = categories.map((cat: any) => ({
    id: cat.id,
    label: cat.name,
  }));

  // Check for duplicate category
  useEffect(() => {
    if (showAddCategory && newCategoryName.trim()) {
      const duplicate = categories.some(
        (cat: any) =>
          cat.name.toLowerCase() === newCategoryName.trim().toLowerCase()
      );
      setIsDuplicateCategory(duplicate);
    } else {
      setIsDuplicateCategory(false);
    }
  }, [newCategoryName, categories, showAddCategory]);

  // Update default value when type changes
  useEffect(() => {
    if (type === "boolean") {
      setDefaultValue("false");
    } else if (type === "number" || type === "percentage") {
      setDefaultValue("0");
    } else if (type === "time") {
      setDefaultValue("0");
    }
  }, [type]);

  // Handle creating a new category
  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error("Category name is required");
      return;
    }

    if (isDuplicateCategory) {
      toast.error("A category with this name already exists");
      return;
    }

    setIsAddingCategory(true);

    try {
      const categoryData = {
        name: newCategoryName.trim(),
      };

      const response = await ApiService.addRecord(
        "metric_categories",
        categoryData
      );

      if (response) {
        addEntry(response, "metric_categories");
        setCategoryId(response.id);
        setNewCategoryName("");
        setShowAddCategory(false);
        toast.success(`Category "${response.name}" created and selected`);
        if (onSuccess) {
          onSuccess();
        }
      }
    } catch (error) {
      console.error("Error creating category:", error);
      toast.error("Failed to create category");
    } finally {
      setIsAddingCategory(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate required fields
      if (!name) {
        toast.error("Metric name is required");
        setIsSubmitting(false);
        return;
      }

      // Ensure default value is properly formatted based on type
      let processedDefaultValue = defaultValue;
      if (type === "boolean") {
        processedDefaultValue = defaultValue === "true" ? "true" : "false";
      }

      // Prepare the metric data
      const metricData = {
        name,
        description,
        type,
        unit,
        default_value: processedDefaultValue,
        category_id: categoryId || null,
        active,
        private: isPrivate,
        schedule_frequency: showSchedulingOptions ? scheduleFrequency : null,
        schedule_start_date:
          showSchedulingOptions && scheduleStartDate
            ? new Date(scheduleStartDate)
            : null,
        schedule_end_date:
          showSchedulingOptions && scheduleEndDate
            ? new Date(scheduleEndDate)
            : null,
        schedule_days: showSchedulingOptions ? scheduleDays : null,
      };

      // Add metric to database
      const response = await ApiService.addRecord("metrics", metricData);

      if (response) {
        // Add to store
        addEntry(response, "metrics");

        // If experiment is selected, create the experiment-metric relationship
        if (experimentId) {
          const experimentMetricData = {
            experiment_id: experimentId,
            metric_id: response.id,
            target: type === "boolean" ? "true" : "0",
            target_type: type === "boolean" ? "boolean" : "atleast",
            importance: 5, // Default importance
            private: isPrivate,
          };

          const relationResponse = await ApiService.addRecord(
            "experiment_metrics",
            experimentMetricData
          );

          if (relationResponse) {
            addEntry(relationResponse, "experiment_metrics");
          }
        }

        toast.success("Metric created successfully");
        resetForm();

        if (onSuccess) {
          onSuccess();
        }
      }
    } catch (error) {
      console.error("Error creating metric:", error);
      toast.error("Failed to create metric");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form fields
  const resetForm = () => {
    setName("");
    setDescription("");
    setType("number");
    setUnit("");
    setDefaultValue("0");
    setCategoryId("");
    setShowAddCategory(false);
    setNewCategoryName("");
    setActive(true);
    setIsPrivate(false);
    setExperimentId("");
    setScheduleFrequency("daily");
    setScheduleStartDate("");
    setScheduleEndDate("");
    setScheduleDays([]);
    setShowAdvancedOptions(false);
    setShowSchedulingOptions(false);
  };

  return (
    <form onSubmit={handleSubmit} className={className}>
      <div className="space-y-4">
        {/* Basic Information */}
        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Metric Name</Label>
            <Input
              id="name"
              placeholder="e.g., Steps Walked, Meditation, Weight"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              placeholder="Description of what this metric tracks"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        {/* Type and Unit */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="type">Metric Type</Label>
            <ReusableSelect
              value={type}
              onChange={(value) => setType(value as any)}
              title="metric type"
              options={[
                { id: "number", label: "Number (e.g., 10, 25.5)" },
                { id: "boolean", label: "Yes/No (e.g., Completed)" },
                { id: "percentage", label: "Percentage (e.g., 85%)" },
                { id: "time", label: "Time (e.g., minutes)" },
              ]}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="unit">Unit (optional)</Label>
            <Input
              id="unit"
              placeholder="e.g., kg, miles, mins"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              disabled={type === "boolean"}
            />
          </div>
        </div>

        {/* Default Value */}
        <div className="space-y-2">
          <Label htmlFor="defaultValue">Default Value</Label>
          {type === "boolean" ? (
            <ReusableSelect
              value={defaultValue}
              onChange={setDefaultValue}
              title="default value"
              options={[
                { id: "false", label: "No / Not Completed" },
                { id: "true", label: "Yes / Completed" },
              ]}
            />
          ) : (
            <Input
              id="defaultValue"
              type={
                type === "time" || type === "number" || type === "percentage"
                  ? "number"
                  : "text"
              }
              placeholder="Default value"
              value={defaultValue}
              onChange={(e) => setDefaultValue(e.target.value)}
            />
          )}
        </div>

        {/* Category Selection with AutocompleteInput */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label htmlFor="category">Category (optional)</Label>

            {!showAddCategory && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowAddCategory(true)}
                className="text-xs"
              >
                <Plus className="h-3 w-3 mr-1" />
                New Category
              </Button>
            )}
          </div>

          {!showAddCategory ? (
            <ReusableSelect
              value={categoryId}
              onChange={setCategoryId}
              title="category"
              noDefault={false}
              options={categories.map((cat: any) => ({
                id: cat.id,
                label: cat.name,
              }))}
            />
          ) : (
            <div className="border p-3 rounded-md bg-muted/20">
              <p className="text-sm font-medium mb-2">Create New Category</p>
              <div className="flex flex-col gap-2">
                <AutocompleteInput
                  id="newCategory"
                  value={newCategoryName}
                  onChange={setNewCategoryName}
                  options={categoryOptions}
                  placeholder="New category name"
                  autofocus={true}
                  description={
                    isDuplicateCategory
                      ? "A category with this name already exists"
                      : "Enter a unique name for the category"
                  }
                />

                {isDuplicateCategory && (
                  <p className="text-sm text-destructive">
                    This category already exists. Please use a different name.
                  </p>
                )}

                <div className="flex gap-2 mt-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowAddCategory(false);
                      setNewCategoryName("");
                    }}
                    disabled={isAddingCategory}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    onClick={handleAddCategory}
                    disabled={
                      isAddingCategory ||
                      !newCategoryName.trim() ||
                      isDuplicateCategory
                    }
                  >
                    {isAddingCategory ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4 mr-1" />
                    )}
                    Add Category
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Attach to Experiment */}
        <div className="space-y-2">
          <Label htmlFor="experiment">Attach to Experiment (optional)</Label>
          <ReusableSelect
            value={experimentId}
            onChange={setExperimentId}
            title="experiment"
            noDefault={false}
            renderItem={(option) =>
              option.private ? (
                <ProtectedField>{option.name}</ProtectedField>
              ) : (
                option.name
              )
            }
            options={experiments
              .filter((exp: Experiment) => exp.status === "active") // Only show active experiments
              .map((exp: Experiment) => ({
                id: exp.id,
                label: exp.name,
                name: exp.name,
                private: exp.private,
              }))}
          />
        </div>

        {/* Advanced Options Toggle */}
        <div className="pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
            className="px-0 text-muted-foreground"
          >
            {showAdvancedOptions ? "Hide" : "Show"} Advanced Options
          </Button>
        </div>

        {/* Advanced Options */}
        {showAdvancedOptions && (
          <>
            <Separator />

            <div className="space-y-4 pt-2">
              {/* Active Status */}
              <div className="flex items-center justify-between">
                <Label htmlFor="active" className="cursor-pointer">
                  Active
                </Label>
                <Switch
                  id="active"
                  checked={active}
                  onCheckedChange={setActive}
                />
              </div>

              {/* Privacy Setting */}
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

              {/* Scheduling Options Toggle */}
              <div className="flex items-center justify-between">
                <Label htmlFor="scheduling" className="cursor-pointer">
                  Enable Scheduling
                </Label>
                <Switch
                  id="scheduling"
                  checked={showSchedulingOptions}
                  onCheckedChange={setShowSchedulingOptions}
                />
              </div>

              {/* Scheduling Options */}
              {showSchedulingOptions && (
                <div className="space-y-4 pl-4 border-l-2 border-muted mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="scheduleFrequency">Frequency</Label>
                    <ReusableSelect
                      value={scheduleFrequency}
                      onChange={(value) => setScheduleFrequency(value as any)}
                      title="frequency"
                      options={[
                        { id: "daily", label: "Daily" },
                        { id: "weekly", label: "Weekly" },
                        { id: "custom", label: "Custom" },
                      ]}
                    />
                  </div>

                  {scheduleFrequency === "custom" && (
                    <div className="space-y-2">
                      <Label htmlFor="scheduleDays">Show on Days</Label>
                      <ReusableMultiSelect
                        selected={scheduleDays}
                        onChange={setScheduleDays}
                        options={[
                          { id: "sunday", label: "Sunday" },
                          { id: "monday", label: "Monday" },
                          { id: "tuesday", label: "Tuesday" },
                          { id: "wednesday", label: "Wednesday" },
                          { id: "thursday", label: "Thursday" },
                          { id: "friday", label: "Friday" },
                          { id: "saturday", label: "Saturday" },
                        ]}
                        placeholder="Select days..."
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="scheduleStartDate">
                        Start Date (optional)
                      </Label>
                      <Input
                        id="scheduleStartDate"
                        type="date"
                        value={scheduleStartDate}
                        onChange={(e) => setScheduleStartDate(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="scheduleEndDate">
                        End Date (optional)
                      </Label>
                      <Input
                        id="scheduleEndDate"
                        type="date"
                        value={scheduleEndDate}
                        onChange={(e) => setScheduleEndDate(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* Form Actions */}
        <div className="flex justify-end gap-2 pt-4">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Create Metric
              </>
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}
