package database

func GetGratitudeJournalFields() []FieldDefinition {
	return []FieldDefinition{
		{
			Key:          "date",
			Type:         FieldTypeDate,
			DisplayName:  "Date",
			Description:  "Date of the gratitude journal entry",
			IsSearchable: true,
		},
		{
			Key:         "entry",
			Type:        FieldTypeMarkdown,
			DisplayName: "Entry",
			Description: "Gratitude journal entry content",
		},
	}
}

func GetAffirmationFields() []FieldDefinition {
	return []FieldDefinition{
		{
			Key:          "date",
			Type:         FieldTypeDate,
			DisplayName:  "Date",
			Description:  "Date of the affirmation",
			IsSearchable: true,
		},
		{
			Key:         "affirmation",
			Type:        FieldTypeMarkdown,
			DisplayName: "Affirmation",
			Description: "Affirmation content",
		},
	}
}

func GetCreativityJournalFields() []FieldDefinition {
	return []FieldDefinition{
		{
			Key:          "date",
			Type:         FieldTypeDate,
			DisplayName:  "Date",
			Description:  "Date of the creativity journal entry",
			IsSearchable: true,
		},
		{
			Key:         "entry",
			Type:        FieldTypeMarkdown,
			DisplayName: "Entry",
			Description: "Creativity journal entry content",
		},
	}
}

func GetQuestionJournalFields() []FieldDefinition {
	return []FieldDefinition{
		{
			Key:          "date",
			Type:         FieldTypeDate,
			DisplayName:  "Date",
			Description:  "Date of the question journal entry",
			IsSearchable: true,
		},
		{
			Key:         "entry",
			Type:        FieldTypeMarkdown,
			DisplayName: "Entry",
			Description: "Question journal entry content",
		},
	}
}