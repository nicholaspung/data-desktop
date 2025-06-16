import React, { useState, useEffect } from "react";
import { Experiment, GoalType, Metric } from "@/store/experiment-definitions.d";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Loader2, Save, Plus, Target } from "lucide-react";
import { useStore } from "@tanstack/react-store";
import dataStore, { addEntry, updateEntry } from "@/store/data-store";
import { ApiService } from "@/services/api";
import { toast } from "sonner";
import ReusableSelect from "@/components/reusable/reusable-select";
import ReusableMultiSelect from "@/components/reusable/reusable-multiselect";
import { Switch } from "@/components/ui/switch";
import { ProtectedField } from "@/components/security/protected-content";
import AutocompleteInput from "@/components/reusable/autocomplete-input";

export default function AddMetricForm({
  metric,
  onSuccess,
  onCancel,
  className,
}: {
  metric?: Metric;
  onSuccess?: () => void;
  onCancel?: () => void;
  className?: string;
}) {
  const categories =
    useStore(dataStore, (state) => state.metric_categories) || [];
  const experiments = useStore(dataStore, (state) => state.experiments) || [];

  const isEditMode = !!metric;

  const [name, setName] = useState(metric?.name || "");
  const [description, setDescription] = useState(metric?.description || "");
  const [type, setType] = useState<
    "number" | "boolean" | "time" | "percentage"
  >((metric?.type as any) || "number");
  const [unit, setUnit] = useState(metric?.unit || "");
  const [defaultValue, setDefaultValue] = useState(
    metric?.default_value?.toString() || "0"
  );

  const [categoryId, setCategoryId] = useState(metric?.category_id || "");
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [isDuplicateCategory, setIsDuplicateCategory] = useState(false);

  const [active, setActive] = useState(metric?.active ?? true);
  const [isPrivate, setIsPrivate] = useState(metric?.private ?? false);
  const [experimentId, setExperimentId] = useState<string>("");

  const [scheduleFrequency, setScheduleFrequency] = useState<
    "daily" | "weekly" | "interval" | "custom"
  >((metric?.schedule_frequency as any) || "daily");
  const [scheduleStartDate, setScheduleStartDate] = useState<string>(
    metric?.schedule_start_date
      ? new Date(metric.schedule_start_date).toLocaleDateString("en-CA")
      : ""
  );
  const [scheduleEndDate, setScheduleEndDate] = useState<string>(
    metric?.schedule_end_date
      ? new Date(metric.schedule_end_date).toLocaleDateString("en-CA")
      : ""
  );
  const [scheduleDays, setScheduleDays] = useState<string[]>(
    Array.isArray(metric?.schedule_days)
      ? metric.schedule_days
          .map((day) => {
            switch (day) {
              case 0:
                return "sunday";
              case 1:
                return "monday";
              case 2:
                return "tuesday";
              case 3:
                return "wednesday";
              case 4:
                return "thursday";
              case 5:
                return "friday";
              case 6:
                return "saturday";
              default:
                return "";
            }
          })
          .filter(Boolean)
      : []
  );

  const [hasDefaultGoal, setHasDefaultGoal] = useState<boolean>(
    Boolean(metric?.goal_value && metric?.goal_type)
  );
  const [goalValue, setGoalValue] = useState<string>(
    metric?.goal_value
      ? String(metric.goal_value)
      : type === "boolean"
        ? "true"
        : "0"
  );
  const [goalType, setGoalType] = useState<string>(
    metric?.goal_type || GoalType.MINIMUM
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(
    isEditMode || false
  );
  const [showSchedulingOptions, setShowSchedulingOptions] = useState(
    isEditMode &&
      (!!metric?.schedule_frequency ||
        !!metric?.schedule_start_date ||
        !!metric?.schedule_end_date ||
        (Array.isArray(metric?.schedule_days) &&
          metric.schedule_days.length > 0))
  );

  const [scheduleIntervalValue, setScheduleIntervalValue] = useState<number>(
    metric?.schedule_interval_value || 1
  );
  const [scheduleIntervalUnit, setScheduleIntervalUnit] = useState<string>(
    metric?.schedule_interval_unit || "days"
  );

  const categoryOptions = categories.map((cat: any) => ({
    id: cat.id,
    label: cat.name,
  }));

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

  useEffect(() => {
    if (!isEditMode) {
      if (type === "boolean") {
        setDefaultValue("false");
        setGoalValue("true");
      } else if (type === "number" || type === "percentage") {
        setDefaultValue("0");

        if (goalValue === "true" || goalValue === "false") {
          setGoalValue("0");
        }
      } else if (type === "time") {
        setDefaultValue("0");

        if (goalValue === "true" || goalValue === "false") {
          setGoalValue("0");
        }
      }
    }
  }, [type, isEditMode]);

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
      }
    } catch (error) {
      console.error("Error creating category:", error);
      toast.error("Failed to create category");
    } finally {
      setIsAddingCategory(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (!name) {
        toast.error("Metric name is required");
        setIsSubmitting(false);
        return;
      }

      let processedDefaultValue = defaultValue;
      if (type === "boolean") {
        processedDefaultValue = defaultValue === "true" ? "true" : "false";
      }

      let processedGoalValue = null;
      if (hasDefaultGoal && goalValue) {
        if (type === "boolean") {
          processedGoalValue = goalValue === "true" ? "true" : "false";
        } else {
          processedGoalValue = goalValue;
        }
      }

      const numericScheduleDays = scheduleDays
        .map((day) => {
          switch (day) {
            case "sunday":
              return 0;
            case "monday":
              return 1;
            case "tuesday":
              return 2;
            case "wednesday":
              return 3;
            case "thursday":
              return 4;
            case "friday":
              return 5;
            case "saturday":
              return 6;
            default:
              return -1;
          }
        })
        .filter((day) => day >= 0);

      const now = new Date();
      const hour = now.getHours();
      const minute = now.getMinutes();
      const startDate = scheduleStartDate.split("-").map(Number);
      const endDate = scheduleEndDate.split("-").map(Number);

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
        schedule_interval_value:
          showSchedulingOptions && scheduleFrequency === "interval"
            ? scheduleIntervalValue
            : null,
        schedule_interval_unit:
          showSchedulingOptions && scheduleFrequency === "interval"
            ? scheduleIntervalUnit
            : null,
        schedule_start_date:
          showSchedulingOptions && scheduleStartDate
            ? new Date(
                startDate[0],
                startDate[1] - 1,
                startDate[2],
                hour,
                minute
              )
            : null,
        schedule_end_date:
          showSchedulingOptions && scheduleEndDate
            ? new Date(endDate[0], endDate[1] - 1, endDate[2], hour, minute)
            : null,
        schedule_days: showSchedulingOptions ? numericScheduleDays : null,

        goal_value: hasDefaultGoal ? processedGoalValue : null,
        goal_type: hasDefaultGoal
          ? type === "boolean"
            ? "boolean"
            : goalType
          : null,
      };

      let response;

      if (isEditMode && metric) {
        response = await ApiService.updateRecord(metric.id, {
          ...metric,
          ...metricData,
        });

        if (response) {
          updateEntry(metric.id, response, "metrics");
          toast.success("Metric updated successfully");
        }
      } else {
        response = await ApiService.addRecord("metrics", metricData);

        if (response) {
          addEntry(response, "metrics");
          toast.success("Metric created successfully");
        }
      }

      if (onSuccess) {
        onSuccess();
      }

      if (!isEditMode) {
        resetForm();
      }
    } catch (error) {
      console.error("Error saving metric:", error);
      toast.error(`Failed to ${isEditMode ? "update" : "create"} metric`);
    } finally {
      setIsSubmitting(false);
    }
  };

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
    setHasDefaultGoal(false);
    setGoalValue("");
    setGoalType(GoalType.MINIMUM);
  };

  return (
    <form onSubmit={handleSubmit} className={className}>
      <div className="space-y-4">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="type">Metric Type</Label>
            <ReusableSelect
              value={type}
              onChange={(value) => setType(value as any)}
              title="metric type"
              disabled={isEditMode}
              options={[
                { id: "number", label: "Number (e.g., 10, 25.5)" },
                { id: "boolean", label: "Yes/No (e.g., Completed)" },
                { id: "percentage", label: "Percentage (e.g., 85%)" },
                { id: "time", label: "Time (e.g., minutes)" },
              ]}
            />
            {isEditMode && (
              <p className="text-xs text-muted-foreground mt-1">
                Metric type cannot be changed after creation
              </p>
            )}
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
        {!isEditMode && (
          <div className="space-y-2">
            <Label htmlFor="experiment">Attach to Experiment (optional)</Label>
            <ReusableSelect
              value={experimentId}
              onChange={setExperimentId}
              title="experiment"
              noDefault={false}
              renderItem={(option) =>
                option.private ? (
                  <ProtectedField>
                    <span>{option.name}</span>
                  </ProtectedField>
                ) : (
                  option.name
                )
              }
              options={experiments
                .filter((exp: Experiment) => exp.status === "active")
                .map((exp: Experiment) => ({
                  id: exp.id,
                  label: exp.name,
                  name: exp.name,
                  private: exp.private,
                }))}
            />
          </div>
        )}
        <div className="flex items-center justify-between space-x-2">
          <div>
            <Label htmlFor="has-default-goal" className="cursor-pointer">
              <Target className="h-4 w-4 inline-block mr-1" />
              Set Default Goal
            </Label>
            <p className="text-sm text-muted-foreground">
              This will set a default goal for this metric in the daily tracker
            </p>
          </div>
          <Switch
            id="has-default-goal"
            checked={hasDefaultGoal}
            onCheckedChange={setHasDefaultGoal}
          />
        </div>
        {hasDefaultGoal && (
          <div className="pl-4 border-l-2 border-primary/30 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="goal-value">Goal Value</Label>
              {type === "boolean" ? (
                <ReusableSelect
                  value={goalValue}
                  onChange={setGoalValue}
                  title="goal value"
                  options={[
                    { id: "true", label: "Yes / Completed" },
                    { id: "false", label: "No / Not Completed" },
                  ]}
                />
              ) : (
                <Input
                  id="goal-value"
                  type={
                    type === "time" ||
                    type === "number" ||
                    type === "percentage"
                      ? "number"
                      : "text"
                  }
                  placeholder="Goal value"
                  value={goalValue}
                  onChange={(e) => setGoalValue(e.target.value)}
                  required={hasDefaultGoal}
                />
              )}
            </div>
            {type !== "boolean" && (
              <div className="space-y-2">
                <Label htmlFor="goal-type">Goal Type</Label>
                <ReusableSelect
                  options={[
                    { id: GoalType.MINIMUM, label: "At least (minimum)" },
                    { id: GoalType.MAXIMUM, label: "At most (maximum)" },
                    { id: GoalType.EXACT, label: "Exactly" },
                  ]}
                  value={goalType}
                  onChange={setGoalType}
                  title="goal type"
                />
              </div>
            )}
          </div>
        )}
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
        {showAdvancedOptions && (
          <>
            <Separator />
            <div className="space-y-4 pt-2">
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
                        { id: "interval", label: "Interval" },
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
                  {scheduleFrequency === "interval" && (
                    <div className="flex items-end gap-4">
                      <div className="space-y-2 flex-1">
                        <Label htmlFor="scheduleIntervalValue">Every</Label>
                        <Input
                          id="scheduleIntervalValue"
                          type="number"
                          min="1"
                          value={scheduleIntervalValue}
                          onChange={(e) =>
                            setScheduleIntervalValue(parseInt(e.target.value))
                          }
                        />
                      </div>
                      <div className="space-y-2 flex-1">
                        <Label htmlFor="scheduleIntervalUnit">Unit</Label>
                        <ReusableSelect
                          value={scheduleIntervalUnit}
                          onChange={(value) => setScheduleIntervalUnit(value)}
                          title="unit"
                          options={[
                            { id: "days", label: "Days" },
                            { id: "weeks", label: "Weeks" },
                            { id: "months", label: "Months" },
                          ]}
                        />
                      </div>
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
          <Button
            type="submit"
            disabled={isSubmitting || !name || (hasDefaultGoal && !goalValue)}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {isEditMode ? "Updating..." : "Creating..."}
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {isEditMode ? "Update Metric" : "Create Metric"}
              </>
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}
