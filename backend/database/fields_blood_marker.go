package database

func GetBloodMarkerFields() []FieldDefinition {
	return []FieldDefinition{
		{
			Key:          "name",
			Type:         FieldTypeText,
			DisplayName:  "Name",
			Description:  "Name of the blood marker",
			IsSearchable: true,
		},
		{
			Key:         "unit",
			Type:        FieldTypeText,
			DisplayName: "Unit",
			Description: "Unit of measurement for this marker",
		},
		{
			Key:         "lower_reference",
			Type:        FieldTypeNumber,
			DisplayName: "Lower Reference",
			Description: "Lower bound of the reference range",
			IsOptional:  true,
		},
		{
			Key:         "upper_reference",
			Type:        FieldTypeNumber,
			DisplayName: "Upper Reference",
			Description: "Upper bound of the reference range",
			IsOptional:  true,
		},
		{
			Key:         "general_reference",
			Type:        FieldTypeText,
			DisplayName: "General Reference",
			Description: "General reference range description",
			IsOptional:  true,
		},
		{
			Key:         "description",
			Type:        FieldTypeText,
			DisplayName: "Description",
			Description: "Description of what this marker measures",
			IsOptional:  true,
		},
		{
			Key:         "category",
			Type:        FieldTypeText,
			DisplayName: "Category",
			Description: "Category or group this marker belongs to",
			IsOptional:  true,
		},
		{
			Key:         "optimal_low",
			Type:        FieldTypeNumber,
			DisplayName: "Optimal Low",
			Description: "Lower bound of the optimal range",
			IsOptional:  true,
		},
		{
			Key:         "optimal_high",
			Type:        FieldTypeNumber,
			DisplayName: "Optimal High",
			Description: "Upper bound of the optimal range",
			IsOptional:  true,
		},
		{
			Key:         "optimal_general",
			Type:        FieldTypeText,
			DisplayName: "Optimal General",
			Description: "General optimal range description",
			IsOptional:  true,
		},
	}
}