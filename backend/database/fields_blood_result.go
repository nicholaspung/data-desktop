package database

func GetBloodResultFields() []FieldDefinition {
	return []FieldDefinition{
		{
			Key:            "blood_test_id",
			Type:           FieldTypeText,
			DisplayName:    "Blood Test",
			Description:    "Reference to the bloodwork test this result belongs to",
			IsRelation:     true,
			RelatedDataset: "bloodwork",
			RelatedField:   "id",
		},
		{
			Key:            "blood_marker_id",
			Type:           FieldTypeText,
			DisplayName:    "Blood Marker",
			Description:    "Reference to the blood marker being measured",
			IsRelation:     true,
			RelatedDataset: "blood_markers",
			RelatedField:   "id",
		},
		{
			Key:         "value_number",
			Type:        FieldTypeNumber,
			DisplayName: "Numeric Value",
			Description: "Numeric value of the test result",
			IsOptional:  true,
		},
		{
			Key:         "value_text",
			Type:        FieldTypeText,
			DisplayName: "Text Value",
			Description: "Text value of the test result (for non-numeric results)",
			IsOptional:  true,
		},
		{
			Key:         "notes",
			Type:        FieldTypeText,
			DisplayName: "Notes",
			Description: "Additional notes about this result",
			IsOptional:  true,
		},
	}
}