// backend/database/models/gratitude_journal_fields.go
package models

import (
	"myproject/backend/database"
)

// GetGratitudeJournalFields returns the field definitions for the Gratitude Journal dataset
func GetGratitudeJournalFields() []database.FieldDefinition {
	return []database.FieldDefinition{
		{
			Key:          "date",
			Type:         database.FieldTypeDate,
			DisplayName:  "Date",
			Description:  "Date of the journal entry",
			IsSearchable: true,
		},
		{
			Key:         "entry",
			Type:        database.FieldTypeMarkdown,
			DisplayName: "Journal Entry",
			Description: "What are you grateful for today?",
		},
	}
}

func GetAffirmationFields() []database.FieldDefinition {
	return []database.FieldDefinition{
		{
			Key:          "date",
			Type:         database.FieldTypeDate,
			DisplayName:  "Date",
			Description:  "Date of the affirmation update",
			IsSearchable: true,
		},
		{
			Key:         "affirmation",
			Type:        database.FieldTypeMarkdown,
			DisplayName: "Affirmation Entry",
			Description: "What affirmation do you want to repeat today?",
		},
	}
}

func GetCreativityJournalFields() []database.FieldDefinition {
	return []database.FieldDefinition{
		{
			Key:          "date",
			Type:         database.FieldTypeDate,
			DisplayName:  "Date",
			Description:  "Date of the journal entry",
			IsSearchable: true,
		},
		{
			Key:         "entry",
			Type:        database.FieldTypeMarkdown,
			DisplayName: "Creativity Entry",
			Description: "Today's creative thoughts or ideas",
		},
	}
}

func GetQuestionJournalFields() []database.FieldDefinition {
	return []database.FieldDefinition{
		{
			Key:          "date",
			Type:         database.FieldTypeDate,
			DisplayName:  "Date",
			Description:  "Date of the journal entry",
			IsSearchable: true,
		},
		{
			Key:         "entry",
			Type:        database.FieldTypeMarkdown,
			DisplayName: "Question Journal Entry",
			Description: "What question do you want to explore today?",
		},
	}
}
