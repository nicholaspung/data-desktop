// src/features/daily-tracker/components/add-metric-form.tsx
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ReusableSelect from "@/components/reusable/reusable-select";
import { InlineHelp } from "@/components/reusable/feature-guide";

export default function AddMetricForm({
  onSubmit,
  onCancel,
  isEdit = false,
  initialData = {},
  categories = [],
  experiments = [],
}: {
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isEdit?: boolean;
  initialData?: any;
  categories: { id: string; name: string }[];
  experiments: { id: string; name: string }[];
}) {
  const [formData, setFormData] = useState({
    name: initialData.name || "",
    description: initialData.description || "",
    type: initialData.type || "boolean",
    defaultValue: initialData.defaultValue || "",
    unit: initialData.unit || "",
    categoryId: initialData.categoryId || "",
    isPrivate: initialData.isPrivate || false,
    active: initialData.active !== undefined ? initialData.active : true,

    // Scheduling options
    scheduleFrequency: initialData.scheduleFrequency || "daily",
    scheduleDays: initialData.scheduleDays || [0, 1, 2, 3, 4, 5, 6], // Default all days
    scheduleStartDate:
      initialData.scheduleStartDate ||
      new Date().toISOString().substring(0, 10),
    scheduleEndDate: initialData.scheduleEndDate || "",

    // Experiment options
    attachToExperiments: initialData.attachToExperiments || [],
  });

  const [activeTab, setActiveTab] = useState("basic");

  const handleChange = (field: string, value: any) => {
    setFormData({
      ...formData,
      [field]: value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="scheduling">Scheduling</TabsTrigger>
          <TabsTrigger value="experiments">Experiments</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        {/* Basic Information Tab */}
        <TabsContent value="basic" className="space-y-4">
          <InlineHelp storageKey="metric-basic-info-help">
            The basic information defines what you're tracking and how it should
            be measured.
            <li>
              - Choose a descriptive <strong>name</strong> that clearly
              identifies what you're tracking
            </li>
            <li>
              - Select the appropriate <strong>type</strong> that matches what
              you're measuring
            </li>
            <li>
              - Set a <strong>default value</strong> that will be pre-filled
              when tracking
            </li>
          </InlineHelp>

          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Metric Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  placeholder="e.g., Morning Meditation, Steps Walked"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  placeholder="Describe what this metric measures and how to track it"
                  className="min-h-[80px]"
                />
              </div>

              <div className="space-y-2">
                <Label>Metric Type *</Label>
                <RadioGroup
                  value={formData.type}
                  onValueChange={(value) => handleChange("type", value)}
                  className="flex flex-col space-y-1"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="boolean" id="boolean" />
                    <Label htmlFor="boolean">Boolean (Yes/No)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="number" id="number" />
                    <Label htmlFor="number">Number</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="time" id="time" />
                    <Label htmlFor="time">Time Duration</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="percentage" id="percentage" />
                    <Label htmlFor="percentage">Percentage</Label>
                  </div>
                </RadioGroup>
              </div>

              {(formData.type === "number" ||
                formData.type === "percentage") && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="defaultValue">Default Value</Label>
                    <Input
                      id="defaultValue"
                      type="number"
                      value={formData.defaultValue}
                      onChange={(e) =>
                        handleChange("defaultValue", e.target.value)
                      }
                      placeholder="0"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="unit">Unit (optional)</Label>
                    <Input
                      id="unit"
                      value={formData.unit}
                      onChange={(e) => handleChange("unit", e.target.value)}
                      placeholder="e.g., steps, kg, miles"
                    />
                  </div>
                </div>
              )}

              {formData.type === "time" && (
                <div className="space-y-2">
                  <Label htmlFor="defaultValue">Default Minutes</Label>
                  <Input
                    id="defaultValue"
                    type="number"
                    value={formData.defaultValue}
                    onChange={(e) =>
                      handleChange("defaultValue", e.target.value)
                    }
                    placeholder="0"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="category">Category (optional)</Label>
                <ReusableSelect
                  options={[
                    { id: "none", label: "No Category" },
                    ...categories,
                  ]}
                  value={formData.categoryId || "none"}
                  onChange={(value) =>
                    handleChange("categoryId", value === "none" ? "" : value)
                  }
                  placeholder="Select category"
                  title="category"
                />
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Scheduling Tab */}
        <TabsContent value="scheduling" className="space-y-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Frequency</Label>
              <Select
                value={formData.scheduleFrequency}
                onValueChange={(value) =>
                  handleChange("scheduleFrequency", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                  <SelectItem value="manual">Manual (Search Only)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.scheduleFrequency === "weekly" && (
              <div className="space-y-2">
                <Label>Days of Week</Label>
                <div className="flex flex-wrap gap-2">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                    (day, index) => (
                      <div key={day} className="flex items-center space-x-2">
                        <Checkbox
                          id={`day-${index}`}
                          checked={formData.scheduleDays.includes(index)}
                          onCheckedChange={(checked) => {
                            const newDays = checked
                              ? [...formData.scheduleDays, index]
                              : formData.scheduleDays.filter(
                                  (d: any) => d !== index
                                );
                            handleChange("scheduleDays", newDays);
                          }}
                        />
                        <Label htmlFor={`day-${index}`}>{day}</Label>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date (optional)</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.scheduleStartDate}
                  onChange={(e) =>
                    handleChange("scheduleStartDate", e.target.value)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">End Date (optional)</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.scheduleEndDate}
                  onChange={(e) =>
                    handleChange("scheduleEndDate", e.target.value)
                  }
                />
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Experiments Tab */}
        <TabsContent value="experiments" className="space-y-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Attach to Experiments (optional)</Label>
              <p className="text-sm text-muted-foreground mb-2">
                You can connect this metric to one or more experiments for
                tracking purposes. Detailed targets will be configured in the
                experiment settings.
              </p>

              {experiments.length === 0 ? (
                <div className="text-sm border rounded-md p-4 bg-muted/40">
                  No active experiments found. Create an experiment first to
                  connect this metric.
                </div>
              ) : (
                <div className="space-y-2">
                  {experiments.map((experiment) => (
                    <div
                      key={experiment.id}
                      className="flex items-center space-x-2"
                    >
                      <Checkbox
                        id={`exp-${experiment.id}`}
                        checked={formData.attachToExperiments.includes(
                          experiment.id
                        )}
                        onCheckedChange={(checked) => {
                          const newExperiments = checked
                            ? [...formData.attachToExperiments, experiment.id]
                            : formData.attachToExperiments.filter(
                                (id: any) => id !== experiment.id
                              );
                          handleChange("attachToExperiments", newExperiments);
                        }}
                      />
                      <Label htmlFor={`exp-${experiment.id}`}>
                        {experiment.name}
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="text-sm bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md p-4">
              <p className="font-medium">Note about experiments</p>
              <p className="mt-1">
                After connecting this metric to an experiment, you'll need to
                configure specific targets and tracking parameters in the
                experiment settings.
              </p>
            </div>
          </div>
        </TabsContent>

        {/* Advanced Tab */}
        <TabsContent value="advanced" className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="active">Active</Label>
                <p className="text-sm text-muted-foreground">
                  Inactive metrics won't appear in the tracker
                </p>
              </div>
              <Switch
                id="active"
                checked={formData.active}
                onCheckedChange={(checked) => handleChange("active", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="private">Private (PIN Protected)</Label>
                <p className="text-sm text-muted-foreground">
                  Private metrics require PIN authentication to view
                </p>
              </div>
              <Switch
                id="private"
                checked={formData.isPrivate}
                onCheckedChange={(checked) =>
                  handleChange("isPrivate", checked)
                }
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {isEdit ? "Update Metric" : "Create Metric"}
        </Button>
      </div>
    </form>
  );
}
