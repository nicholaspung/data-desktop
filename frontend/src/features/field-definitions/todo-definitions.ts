import {
  FieldDefinitionsDataset,
  DATASET_REFERENCES,
  createRelationField,
} from "@/types/types";

export const TODO_FIELD_DEFINITIONS: FieldDefinitionsDataset = {
  id: "todos",
  name: "Todos",
  description: "Tasks with deadlines and progress tracking",
  fields: [
    {
      key: "title",
      type: "text",
      displayName: "Title",
      description: "Title of the todo",
      isSearchable: true,
    },
    {
      key: "description",
      type: "text",
      displayName: "Description",
      description: "Detailed description of the todo",
      isOptional: true,
    },
    {
      key: "deadline",
      type: "date",
      displayName: "Deadline",
      description: "When this todo needs to be completed by",
      isSearchable: true,
    },
    {
      key: "priority",
      type: "select-single",
      displayName: "Priority",
      description: "Priority level",
      options: [
        { id: "low", label: "Low" },
        { id: "medium", label: "Medium" },
        { id: "high", label: "High" },
        { id: "urgent", label: "Urgent" },
      ],
    },
    {
      key: "tags",
      type: "text",
      displayName: "Tags",
      description: "Comma-separated tags for categorization",
      isOptional: true,
    },
    createRelationField(
      "related_metric_id",
      "Related Metric",
      DATASET_REFERENCES.METRICS,
      {
        description: "Metric linked to this todo for tracking progress",
        deleteBehavior: "preventDeleteIfReferenced",
        displayField: "name",
        displayFieldType: "text",
        isSearchable: false,
        isOptional: true,
      }
    ),
    {
      key: "metric_type",
      type: "select-single",
      displayName: "Metric Type",
      description: "Type of metric",
      options: [
        { id: "completion", label: "Completion" },
        { id: "time", label: "Time Tracked" },
      ],
      isOptional: true,
    },
    {
      key: "failed_deadlines",
      type: "text",
      displayName: "Failed Deadlines",
      description: "Previous failed deadlines",
      isOptional: true,
    },
    {
      key: "reminder_date",
      type: "date",
      displayName: "Reminder Date",
      description: "When to send a reminder about this todo",
      isOptional: true,
    },
    {
      key: "is_complete",
      type: "boolean",
      displayName: "Completed",
      description: "Whether this todo has been completed",
    },
    {
      key: "completed_at",
      type: "date",
      displayName: "Completed At",
      description: "When this todo was completed",
      isOptional: true,
    },
    {
      key: "status",
      type: "select-single",
      displayName: "Status",
      description: "Current status of the todo",
      options: [
        { id: "not_started", label: "Not Started" },
        { id: "in_progress", label: "In Progress" },
        { id: "completed", label: "Completed" },
        { id: "overdue", label: "Overdue" },
      ],
    },
  ],
};
