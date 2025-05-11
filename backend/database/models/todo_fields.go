// backend/database/models/todo_fields.go
package models

import (
	"myproject/backend/database"
)

func GetTodoFields() []database.FieldDefinition {
	return []database.FieldDefinition{
		{
			Key:          "title",
			Type:         database.FieldTypeText,
			DisplayName:  "Title",
			Description:  "Title of the todo",
			IsSearchable: true,
		},
		{
			Key:         "description",
			Type:        database.FieldTypeText,
			DisplayName: "Description",
			Description: "Detailed description of the todo",
			IsOptional:  true,
		},
		{
			Key:          "deadline",
			Type:         database.FieldTypeDate,
			DisplayName:  "Deadline",
			Description:  "When this todo needs to be completed by",
			IsSearchable: true,
		},
		{
			Key:         "priority",
			Type:        database.FieldTypeText,
			DisplayName: "Priority",
			Description: "Priority level (low, medium, high, urgent)",
		},
		{
			Key:         "tags",
			Type:        database.FieldTypeText,
			DisplayName: "Tags",
			Description: "Comma-separated tags for categorization",
			IsOptional:  true,
		},
		{
			Key:            "related_metric_id",
			Type:           database.FieldTypeText,
			DisplayName:    "Related Metric",
			Description:    "Metric linked to this todo for tracking progress",
			IsRelation:     true,
			RelatedDataset: "metrics",
			RelatedField:   "id",
			IsOptional:     true,
		},
		{
			Key:         "metric_type",
			Type:        database.FieldTypeText,
			DisplayName: "Metric Type",
			Description: "Type of metric (completion or time)",
			IsOptional:  true,
		},
		{
			Key:         "failed_deadlines",
			Type:        database.FieldTypeText,
			DisplayName: "Failed Deadlines",
			Description: "JSON array of previous failed deadlines",
			IsOptional:  true,
		},
		{
			Key:         "reminder_date",
			Type:        database.FieldTypeDate,
			DisplayName: "Reminder Date",
			Description: "When to send a reminder about this todo",
			IsOptional:  true,
		},
		{
			Key:         "is_complete",
			Type:        database.FieldTypeBoolean,
			DisplayName: "Completed",
			Description: "Whether this todo has been completed",
		},
		{
			Key:         "completed_at",
			Type:        database.FieldTypeDate,
			DisplayName: "Completed At",
			Description: "When this todo was completed",
			IsOptional:  true,
		},
		{
			Key:         "status",
			Type:        database.FieldTypeText,
			DisplayName: "Status",
			Description: "Current status of the todo",
		},
		{
			Key:         "private",
			Type:        database.FieldTypeBoolean,
			DisplayName: "Private",
			Description: "Is todo private?",
		},
	}
}
