// backend/database/models/habit_fields.go
package models

import (
	"myproject/backend/database"
)

// GetHabitFields returns the field definitions for the Habit dataset
// Note: Keep these in sync with habit field definitions in the frontend
func GetHabitFields() []database.FieldDefinition {
	return []database.FieldDefinition{
		{
			Key:          "date",
			Type:         database.FieldTypeDate,
			DisplayName:  "Date",
			Description:  "Date of the habit tracking",
			IsSearchable: true,
		},
		{
			Key:         "completed",
			Type:        database.FieldTypeBoolean,
			DisplayName: "Completed",
			Description: "Whether the habit was completed",
		},
		{
			Key:          "name",
			Type:         database.FieldTypeText,
			DisplayName:  "Habit Name",
			Description:  "Name of the habit",
			IsSearchable: true,
		},
		{
			Key:          "category",
			Type:         database.FieldTypeText,
			DisplayName:  "Category",
			Description:  "Category or type of habit",
			IsSearchable: true,
		},
		{
			Key:         "notes",
			Type:        database.FieldTypeText,
			DisplayName: "Notes",
			Description: "Additional notes about the habit",
		},
		{
			Key:         "difficulty",
			Type:        database.FieldTypeNumber,
			DisplayName: "Difficulty",
			Description: "Difficulty level of the habit (1-10)",
		},
		{
			Key:         "duration_minutes",
			Type:        database.FieldTypeNumber,
			DisplayName: "Duration",
			Unit:        "minutes",
			Description: "Time spent on the habit",
		},
		// Add more habit fields as needed
	}
}
