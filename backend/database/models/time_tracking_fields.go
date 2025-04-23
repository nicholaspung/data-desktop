// backend/database/models/time_tracking_fields.go
package models

import (
	"myproject/backend/database"
)

// GetTimeEntriesFields returns the field definitions for the Time Entries dataset
func GetTimeEntriesFields() []database.FieldDefinition {
	return []database.FieldDefinition{
		{
			Key:          "description",
			Type:         database.FieldTypeText,
			DisplayName:  "Description",
			Description:  "Description of the activity",
			IsSearchable: true,
		},
		{
			Key:          "start_time",
			Type:         database.FieldTypeDate,
			DisplayName:  "Start Time",
			Description:  "When the activity started",
			IsSearchable: true,
		},
		{
			Key:          "end_time",
			Type:         database.FieldTypeDate,
			DisplayName:  "End Time",
			Description:  "When the activity ended",
			IsSearchable: true,
		},
		{
			Key:         "duration_minutes",
			Type:        database.FieldTypeNumber,
			DisplayName: "Duration (minutes)",
			Description: "Duration of the activity in minutes",
		},
		{
			Key:            "category_id",
			Type:           database.FieldTypeText,
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
			Type:         database.FieldTypeText,
			DisplayName:  "Tags",
			Description:  "Comma-separated tags for the activity",
			IsOptional:   true,
			IsSearchable: true,
		},
		{
			Key:         "private",
			Type:        database.FieldTypeBoolean,
			DisplayName: "Private",
			Description: "Is time entry private?",
		},
	}
}

// GetTimeCategoriesFields returns the field definitions for the Time Categories dataset
func GetTimeCategoriesFields() []database.FieldDefinition {
	return []database.FieldDefinition{
		{
			Key:          "name",
			Type:         database.FieldTypeText,
			DisplayName:  "Name",
			Description:  "Name of the category",
			IsSearchable: true,
		},
		{
			Key:         "color",
			Type:        database.FieldTypeText,
			DisplayName: "Color",
			Description: "Color hex code for the category",
			IsOptional:  true,
		},
		{
			Key:         "private",
			Type:        database.FieldTypeBoolean,
			DisplayName: "Private",
			Description: "Is time category private?",
			IsOptional:  true,
		},
	}
}
