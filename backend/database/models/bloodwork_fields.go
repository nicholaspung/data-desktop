// This code is auto-generated from bloodwork-definitions.ts
// Do not edit manually - run field-sync-generator.js instead
package models

import (
	"myproject/backend/database"
)

// GetBloodworkFields returns the field definitions for the Bloodwork dataset
// Note: Keep these in sync with bloodwork-definitions.ts in the frontend
func GetBloodworkFields() []database.FieldDefinition {
	return []database.FieldDefinition{
		{
			Key:         "date",
			Type:        database.FieldTypeDate,
			DisplayName: "Test Date",
			Description: "Date of the blood test",

			IsSearchable: true,
		},
		{
			Key:         "fasted",
			Type:        database.FieldTypeBoolean,
			DisplayName: "Fasted",
			Description: "Whether the blood was drawn in a fasted state",

			IsSearchable: false,
		},
		{
			Key:         "lab_name",
			Type:        database.FieldTypeText,
			DisplayName: "Lab Name",
			Description: "Name of the laboratory or facility",

			IsSearchable: true,
		},
		{
			Key:         "notes",
			Type:        database.FieldTypeText,
			DisplayName: "Notes",
			Description: "Additional notes about this blood test",

			IsSearchable: false,
		},
	}
}
