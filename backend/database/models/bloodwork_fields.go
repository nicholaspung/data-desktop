// backend/database/models/bloodwork_fields.go
package models

import (
	"myproject/backend/database"
)

// GetBloodworkFields returns the field definitions for the Bloodwork dataset
// Note: Keep these in sync with bloodwork field definitions in the frontend
func GetBloodworkFields() []database.FieldDefinition {
	return []database.FieldDefinition{
		{
			Key:          "date",
			Type:         database.FieldTypeDate,
			DisplayName:  "Date",
			Description:  "Date of the blood test",
			IsSearchable: true,
		},
		{
			Key:         "fasted",
			Type:        database.FieldTypeBoolean,
			DisplayName: "Fasted",
			Description: "Whether the blood was drawn in a fasted state",
		},
		{
			Key:          "total_cholesterol",
			Type:         database.FieldTypeNumber,
			DisplayName:  "Total Cholesterol",
			Unit:         "mg/dL",
			Description:  "Total cholesterol level",
			IsSearchable: true,
		},
		{
			Key:          "ldl",
			Type:         database.FieldTypeNumber,
			DisplayName:  "LDL",
			Unit:         "mg/dL",
			Description:  "Low-density lipoprotein",
			IsSearchable: true,
		},
		{
			Key:          "hdl",
			Type:         database.FieldTypeNumber,
			DisplayName:  "HDL",
			Unit:         "mg/dL",
			Description:  "High-density lipoprotein",
			IsSearchable: true,
		},
		{
			Key:          "triglycerides",
			Type:         database.FieldTypeNumber,
			DisplayName:  "Triglycerides",
			Unit:         "mg/dL",
			Description:  "Triglycerides level",
			IsSearchable: true,
		},
		{
			Key:          "glucose",
			Type:         database.FieldTypeNumber,
			DisplayName:  "Glucose",
			Unit:         "mg/dL",
			Description:  "Blood glucose level",
			IsSearchable: true,
		},
		// Add more bloodwork fields as needed
	}
}
