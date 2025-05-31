package database

func GetBloodworkFields() []FieldDefinition {
	return []FieldDefinition{
		{
			Key:          "date",
			Type:         FieldTypeDate,
			DisplayName:  "Date",
			Description:  "Date when the blood test was taken",
			IsSearchable: true,
		},
		{
			Key:         "fasted",
			Type:        FieldTypeBoolean,
			DisplayName: "Fasted",
			Description: "Whether the test was taken while fasting",
		},
		{
			Key:         "lab_name",
			Type:        FieldTypeText,
			DisplayName: "Lab Name",
			Description: "Name of the laboratory that performed the test",
			IsOptional:  true,
		},
		{
			Key:         "notes",
			Type:        FieldTypeText,
			DisplayName: "Notes",
			Description: "Additional notes about this blood test",
			IsOptional:  true,
		},
	}
}