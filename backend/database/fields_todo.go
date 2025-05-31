package database

func GetTodoFields() []FieldDefinition {
	return []FieldDefinition{
		{
			Key:          "title",
			Type:         FieldTypeText,
			DisplayName:  "Title",
			Description:  "Title of the todo",
			IsSearchable: true,
		},
		{
			Key:         "description",
			Type:        FieldTypeText,
			DisplayName: "Description",
			Description: "Detailed description of the todo",
			IsOptional:  true,
		},
		{
			Key:          "deadline",
			Type:         FieldTypeDate,
			DisplayName:  "Deadline",
			Description:  "When this todo needs to be completed by",
			IsSearchable: true,
		},
		{
			Key:         "priority",
			Type:        FieldTypeText,
			DisplayName: "Priority",
			Description: "Priority level (low, medium, high, urgent)",
		},
		{
			Key:         "tags",
			Type:        FieldTypeText,
			DisplayName: "Tags",
			Description: "Comma-separated tags for categorization",
			IsOptional:  true,
		},
		{
			Key:            "related_metric_id",
			Type:           FieldTypeText,
			DisplayName:    "Related Metric",
			Description:    "Metric linked to this todo for tracking progress",
			IsRelation:     true,
			RelatedDataset: "metrics",
			RelatedField:   "id",
			IsOptional:     true,
		},
		{
			Key:         "metric_type",
			Type:        FieldTypeText,
			DisplayName: "Metric Type",
			Description: "Type of metric (completion or time)",
			IsOptional:  true,
		},
		{
			Key:         "failed_deadlines",
			Type:        FieldTypeText,
			DisplayName: "Failed Deadlines",
			Description: "JSON array of previous failed deadlines",
			IsOptional:  true,
		},
		{
			Key:         "reminder_date",
			Type:        FieldTypeDate,
			DisplayName: "Reminder Date",
			Description: "When to send a reminder about this todo",
			IsOptional:  true,
		},
		{
			Key:         "is_complete",
			Type:        FieldTypeBoolean,
			DisplayName: "Completed",
			Description: "Whether this todo has been completed",
		},
		{
			Key:         "completed_at",
			Type:        FieldTypeDate,
			DisplayName: "Completed At",
			Description: "When this todo was completed",
			IsOptional:  true,
		},
		{
			Key:         "status",
			Type:        FieldTypeText,
			DisplayName: "Status",
			Description: "Current status of the todo",
		},
		{
			Key:         "private",
			Type:        FieldTypeBoolean,
			DisplayName: "Private",
			Description: "Is todo private?",
		},
	}
}
