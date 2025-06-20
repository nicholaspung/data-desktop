import {
  FieldDefinitionsDataset,
  DATASET_REFERENCES,
  createRelationField,
} from "@/types/types";

export const EXPERIMENT_FIELD_DEFINITIONS: FieldDefinitionsDataset = {
  id: "experiments",
  name: "Experiments",
  description: "Track experiments with specific metrics and goals",
  fields: [
    {
      key: "name",
      type: "text",
      displayName: "Name",
      description: "Name of the experiment",
      isSearchable: true,
    },
    {
      key: "description",
      type: "text",
      displayName: "Description",
      description: "Description of the experiment",
      isOptional: true,
    },
    {
      key: "start_state",
      type: "text",
      displayName: "Start State",
      description: "Start state of the experiment",
      isOptional: true,
    },
    {
      key: "end_state",
      type: "text",
      displayName: "End State",
      description: "End state of the experiment",
      isOptional: true,
    },
    {
      key: "start_date",
      type: "date",
      displayName: "Start Date",
      description: "When the experiment starts",
      isSearchable: true,
    },
    {
      key: "end_date",
      type: "date",
      displayName: "End Date",
      description: "When the experiment ends (optional)",
      isOptional: true,
    },
    {
      key: "goal",
      type: "text",
      displayName: "Goal",
      description: "The goal of this experiment",
    },
    {
      key: "status",
      type: "text",
      displayName: "Status",
      description: "Status of the experiment (active, completed, paused)",
    },
    {
      key: "private",
      type: "boolean",
      displayName: "Private",
      description: "Is experiment private?",
    },
    {
      key: "starting_images",
      type: "file-multiple",
      displayName: "Starting Images",
      description: "Images from the beginning of the experiment",
      isOptional: true,
    },
    {
      key: "ending_images",
      type: "file-multiple",
      displayName: "Ending Images",
      description: "Images from the end of the experiment",
      isOptional: true,
    },
  ],
};

export const METRIC_FIELD_DEFINITIONS: FieldDefinitionsDataset = {
  id: "metrics",
  name: "Metrics",
  description: "Define metrics to track daily",
  fields: [
    {
      key: "name",
      type: "text",
      displayName: "Name",
      description: "Name of the metric",
      isSearchable: true,
    },
    {
      key: "description",
      type: "text",
      displayName: "Description",
      description: "Description of the metric",
      isOptional: true,
    },
    {
      key: "type",
      type: "select-single",
      displayName: "Type",
      description: "Type of metric (number, boolean, time, percentage)",
      options: [
        { id: "number", label: "number" },
        { id: "boolean", label: "boolean" },
        { id: "time", label: "time" },
        { id: "percentage", label: "percentage" },
      ],
    },
    {
      key: "unit",
      type: "text",
      displayName: "Unit",
      description: "Unit of measurement (if applicable)",
      isOptional: true,
    },
    {
      key: "default_value",
      type: "text",
      displayName: "Default Value",
      description: "Default value for this metric",
    },
    createRelationField(
      "category_id",
      "Category",
      DATASET_REFERENCES.METRIC_CATEGORIES,
      {
        description: "Category of this metric",
        deleteBehavior: "preventDeleteIfReferenced",
        displayField: "name",
        displayFieldType: "text",
        isSearchable: false,
        isOptional: true,
      }
    ),
    {
      key: "active",
      type: "boolean",
      displayName: "Active",
      description: "Is metric active?",
    },
    {
      key: "private",
      type: "boolean",
      displayName: "Private",
      description: "Is metric private?",
    },
    {
      key: "schedule_start_date",
      type: "date",
      displayName: "Start Showing",
      description: "When to start showing this metric",
      isOptional: true,
    },
    {
      key: "schedule_end_date",
      type: "date",
      displayName: "Stop Showing",
      description: "When to stop showing this metric",
      isOptional: true,
    },
    {
      key: "schedule_days",
      type: "select-multiple",
      displayName: "Show On Days",
      description: "Which days of the week to show this metric",
      isOptional: true,
      options: [
        { id: "sunday", label: "Sunday" },
        { id: "monday", label: "Monday" },
        { id: "tuesday", label: "Tuesday" },
        { id: "wednesday", label: "Wednesday" },
        { id: "thursday", label: "Thursday" },
        { id: "friday", label: "Friday" },
        { id: "saturday", label: "Saturday" },
      ],
    },
    {
      key: "schedule_frequency",
      type: "select-single",
      displayName: "Frequency",
      description: "How often to show this metric",
      isOptional: true,
      options: [
        { id: "daily", label: "Daily" },
        { id: "weekly", label: "Weekly" },
        { id: "custom", label: "Custom" },
      ],
    },
    {
      key: "goal_value",
      type: "text",
      displayName: "Goal Value",
      description: "Default goal value for this metric",
      isOptional: true,
    },
    {
      key: "goal_type",
      type: "select-single",
      displayName: "Goal Type",
      description: "How to interpret the goal",
      isOptional: true,
      options: [
        { id: "minimum", label: "Minimum" },
        { id: "maximum", label: "Maximum" },
        { id: "exact", label: "Exact" },
        { id: "boolean", label: "Boolean" },
      ],
    },
  ],
};

export const DAILY_LOG_FIELD_DEFINITIONS: FieldDefinitionsDataset = {
  id: "daily_logs",
  name: "Daily Logs",
  description: "Daily tracking of metrics",
  fields: [
    {
      key: "date",
      type: "date",
      displayName: "Date",
      description: "Date of the log",
      isSearchable: true,
    },
    createRelationField("metric_id", "Metric", DATASET_REFERENCES.METRICS, {
      description: "The metric being tracked",
      deleteBehavior: "preventDeleteIfReferenced",
      displayField: "name",
      displayFieldType: "text",
      secondaryDisplayField: "description",
      secondaryDisplayFieldType: "text",
    }),
    createRelationField(
      "experiment_id",
      "Experiment",
      DATASET_REFERENCES.EXPERIMENTS,
      {
        description: "The experiment this log belongs to (if any)",
        deleteBehavior: "cascadeDeleteIfReferenced",
        displayField: "name",
        displayFieldType: "text",
        isSearchable: false,
        isOptional: true,
      }
    ),
    {
      key: "value",
      type: "text",
      displayName: "Value",
      description: "The value recorded for this metric",
    },
    {
      key: "notes",
      type: "text",
      displayName: "Notes",
      description: "Additional notes",
      isOptional: true,
    },
    {
      key: "goal_value",
      type: "text",
      displayName: "Goal Value",
      description: "Target value for this log entry",
      isOptional: true,
    },
    {
      key: "goal_type",
      type: "select-single",
      displayName: "Goal Type",
      description: "How to interpret the goal",
      isOptional: true,
      options: [
        { id: "minimum", label: "Minimum" },
        { id: "maximum", label: "Maximum" },
        { id: "exact", label: "Exact" },
        { id: "boolean", label: "Yes/No" },
      ],
    },
  ],
};

export const METRIC_CATEGORY_FIELD_DEFINITIONS: FieldDefinitionsDataset = {
  id: "metric_categories",
  name: "Metric Categories",
  description: "Categories for organizing metrics",
  fields: [
    {
      key: "name",
      type: "text",
      displayName: "Name",
      description: "Name of the category",
      isSearchable: true,
    },
  ],
};

export const EXPERIMENT_METRIC_FIELD_DEFINITIONS: FieldDefinitionsDataset = {
  id: "experiment_metrics",
  name: "Experiment Metrics",
  description: "Metrics and targets for experiments",
  fields: [
    createRelationField(
      "experiment_id",
      "Experiment",
      DATASET_REFERENCES.EXPERIMENTS,
      {
        description: "The experiment this metric belongs to",
        deleteBehavior: "cascadeDeleteIfReferenced",
        displayField: "name",
        displayFieldType: "text",
      }
    ),
    createRelationField("metric_id", "Metric", DATASET_REFERENCES.METRICS, {
      description: "The metric to track in this experiment",
      deleteBehavior: "preventDeleteIfReferenced",
      displayField: "name",
      displayFieldType: "text",
    }),
    {
      key: "target",
      type: "text",
      displayName: "Target",
      description: "Target value for this metric",
    },
    {
      key: "target_type",
      type: "text",
      displayName: "Target Type",
      description:
        "How to evaluate the target (atleast, atmost, exactly, boolean)",
    },
    {
      key: "importance",
      type: "number",
      displayName: "Importance",
      description:
        "How important this metric is to the experiment (1-10 scale)",
    },
    {
      key: "private",
      type: "boolean",
      displayName: "Private",
      description: "Is experiment metric private?",
    },
  ],
};
