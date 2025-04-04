// This code is auto-generated from bloodwork-definitions.ts
// Do not edit manually - run field-sync-generator.js instead
package models

import (
	"myproject/backend/database"
)

// GetBloodMarkerFields returns the field definitions for the Blood Markers dataset
// Note: Keep these in sync with bloodwork-definitions.ts in the frontend
func GetBloodMarkerFields() []database.FieldDefinition {
	return []database.FieldDefinition{
		{
			Key:         "name",
			Type:        database.FieldTypeText,
			DisplayName: "Marker Name",
			Description: "Name of the blood marker",

			IsSearchable: true,
		},
		{
			Key:         "unit",
			Type:        database.FieldTypeText,
			DisplayName: "Unit",
			Description: "Measurement unit (e.g., mg/dL, mmol/L)",

			IsSearchable: false,
		},
		{
			Key:         "lower_reference",
			Type:        database.FieldTypeNumber,
			DisplayName: "Lower Reference",
			Description: "Lower end of normal reference range",

			IsSearchable: false,
		},
		{
			Key:         "upper_reference",
			Type:        database.FieldTypeNumber,
			DisplayName: "Upper Reference",
			Description: "Upper end of normal reference range",

			IsSearchable: false,
		},
		{
			Key:         "general_reference",
			Type:        database.FieldTypeText,
			DisplayName: "General Reference",
			Description: "General reference range",

			IsSearchable: false,
		},
		{
			Key:         "description",
			Type:        database.FieldTypeText,
			DisplayName: "Description",
			Description: "Information about what this marker measures",

			IsSearchable: false,
		},
		{
			Key:         "category",
			Type:        database.FieldTypeText,
			DisplayName: "Category",
			Description: "Category of marker (e.g., Lipids, Metabolic, etc.)",

			IsSearchable: true,
		},
		{
			Key:         "optimal_low",
			Type:        database.FieldTypeNumber,
			DisplayName: "Optimal Low",
			Description: "Lower end of optimal range (may differ from reference)",

			IsSearchable: false,
		},
		{
			Key:         "optimal_high",
			Type:        database.FieldTypeNumber,
			DisplayName: "Optimal High",
			Description: "Upper end of optimal range (may differ from reference)",

			IsSearchable: false,
		},
		{
			Key:         "optimal_general",
			Type:        database.FieldTypeText,
			DisplayName: "Optimal General",
			Description: "General optimal range (may differ from reference)",

			IsSearchable: false,
		},
	}
}
