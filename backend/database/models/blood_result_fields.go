// This code is auto-generated from bloodwork-definitions.ts
// Do not edit manually - run field-sync-generator.js instead
package models

import (
	"myproject/backend/database"
)

// GetBloodResultFields returns the field definitions for the Blood Results dataset
// Note: Keep these in sync with bloodwork-definitions.ts in the frontend
func GetBloodResultFields() []database.FieldDefinition {
	return []database.FieldDefinition{
		{
			Key:         "blood_test_id",
			Type:        database.FieldTypeText,
			DisplayName: "Test ID",
			Description: "ID of the related blood test",

			IsSearchable:   true,
			IsRelation:     true,
			RelatedDataset: "bloodwork",
			RelatedField:   "id",
		},
		{
			Key:         "blood_marker_id",
			Type:        database.FieldTypeText,
			DisplayName: "Marker ID",
			Description: "ID of the related blood marker",

			IsSearchable:   true,
			IsRelation:     true,
			RelatedDataset: "blood_markers",
			RelatedField:   "id",
		},
		{
			Key:         "value",
			Type:        database.FieldTypeNumber,
			DisplayName: "Value",
			Description: "Measured result value",

			IsSearchable: false,
		},
		{
			Key:         "notes",
			Type:        database.FieldTypeText,
			DisplayName: "Notes",
			Description: "Additional notes for this result",

			IsSearchable: false,
		},
	}
}
