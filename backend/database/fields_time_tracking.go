package database

func GetTimeEntriesFields() []FieldDefinition {
	return []FieldDefinition{
		{
			Key:          "description",
			Type:         FieldTypeText,
			DisplayName:  "Description",
			Description:  "Description of the activity",
			IsSearchable: true,
		},
		{
			Key:          "start_time",
			Type:         FieldTypeDate,
			DisplayName:  "Start Time",
			Description:  "When the activity started",
			IsSearchable: true,
		},
		{
			Key:          "end_time",
			Type:         FieldTypeDate,
			DisplayName:  "End Time",
			Description:  "When the activity ended",
			IsSearchable: true,
		},
		{
			Key:         "duration_minutes",
			Type:        FieldTypeNumber,
			DisplayName: "Duration (minutes)",
			Description: "Duration of the activity in minutes",
		},
		{
			Key:            "category_id",
			Type:           FieldTypeText,
			DisplayName:    "Category",
			Description:    "Category of the activity",
			IsRelation:     true,
			RelatedDataset: "time_categories",
			RelatedField:   "id",
			IsOptional:     true,
			IsSearchable:   true,
		},
		{
			Key:          "tags",
			Type:         FieldTypeText,
			DisplayName:  "Tags",
			Description:  "Comma-separated tags for the activity",
			IsOptional:   true,
			IsSearchable: true,
		},
		{
			Key:         "private",
			Type:        FieldTypeBoolean,
			DisplayName: "Private",
			Description: "Is time entry private?",
		},
	}
}

func GetTimeCategoriesFields() []FieldDefinition {
	return []FieldDefinition{
		{
			Key:          "name",
			Type:         FieldTypeText,
			DisplayName:  "Name",
			Description:  "Name of the category",
			IsSearchable: true,
		},
		{
			Key:         "color",
			Type:        FieldTypeText,
			DisplayName: "Color",
			Description: "Color hex code for the category",
			IsOptional:  true,
		},
		{
			Key:         "private",
			Type:        FieldTypeBoolean,
			DisplayName: "Private",
			Description: "Is time category private?",
			IsOptional:  true,
		},
	}
}

func GetTimePlannerConfigFields() []FieldDefinition {
	return []FieldDefinition{
		{
			Key:          "name",
			Type:         FieldTypeText,
			DisplayName:  "Name",
			Description:  "Name of the time planner configuration",
			IsSearchable: true,
		},
		{
			Key:         "description",
			Type:        FieldTypeText,
			DisplayName: "Description",
			Description: "Description of the time planner configuration",
			IsOptional:  true,
		},
		{
			Key:         "blocks",
			Type:        FieldTypeText,
			DisplayName: "Time Blocks",
			Description: "Time blocks for this configuration",
		},
	}
}
