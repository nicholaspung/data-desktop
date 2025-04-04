// backend/database/models/bloodwork_fields.go
package models

import (
	"myproject/backend/database"
)

// GetBloodworkFields returns the field definitions for the Bloodwork dataset
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
		// Add a relation field to test markers
		{
			Key:            "markers",
			Type:           database.FieldTypeText,
			DisplayName:    "Markers",
			Description:    "Blood markers measured in this test",
			IsSearchable:   false,
			IsRelation:     true,
			RelatedDataset: "blood_markers",
			RelatedField:   "blood_test_id",
		},
	}
}

// GetBloodMarkerFields returns the field definitions for blood markers
func GetBloodMarkerFields() []database.FieldDefinition {
	return []database.FieldDefinition{
		{
			Key:          "name",
			Type:         database.FieldTypeText,
			DisplayName:  "Name",
			Description:  "Marker name",
			IsSearchable: true,
		},
		{
			Key:         "unit",
			Type:        database.FieldTypeText,
			DisplayName: "Unit",
			Description: "Measurement unit",
		},
		{
			Key:         "lower_reference",
			Type:        database.FieldTypeNumber,
			DisplayName: "Lower Reference",
			Description: "Lower end of reference range",
		},
		{
			Key:         "upper_reference",
			Type:        database.FieldTypeNumber,
			DisplayName: "Upper Reference",
			Description: "Upper end of reference range",
		},
	}
}

// GetBloodResultFields returns the field definitions for blood test results
func GetBloodResultFields() []database.FieldDefinition {
	return []database.FieldDefinition{
		{
			Key:            "blood_test_id",
			Type:           database.FieldTypeText,
			DisplayName:    "Test ID",
			Description:    "Related blood test",
			IsRelation:     true,
			RelatedDataset: "bloodwork",
			RelatedField:   "id",
		},
		{
			Key:            "blood_marker_id",
			Type:           database.FieldTypeText,
			DisplayName:    "Marker ID",
			Description:    "Related blood marker",
			IsRelation:     true,
			RelatedDataset: "blood_markers",
			RelatedField:   "id",
		},
		{
			Key:         "value",
			Type:        database.FieldTypeNumber,
			DisplayName: "Value",
			Description: "Test result value",
		},
		{
			Key:         "is_flagged",
			Type:        database.FieldTypeBoolean,
			DisplayName: "Flagged",
			Description: "Whether this result is outside reference range",
		},
	}
}
