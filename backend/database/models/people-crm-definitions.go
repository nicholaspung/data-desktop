// backend/database/models/people_crm_fields.go
package models

import (
	"myproject/backend/database"
)

// GetPeopleFields returns the field definitions for the People dataset
func GetPeopleFields() []database.FieldDefinition {
	return []database.FieldDefinition{
		{
			Key:          "name",
			Type:         database.FieldTypeText,
			DisplayName:  "Name",
			Description:  "Full name of the person",
			IsSearchable: true,
		},
		{
			Key:          "email",
			Type:         database.FieldTypeText,
			DisplayName:  "Email",
			Description:  "Email address",
			IsOptional:   true,
			IsSearchable: true,
		},
		{
			Key:         "phone",
			Type:        database.FieldTypeText,
			DisplayName: "Phone",
			Description: "Phone number",
			IsOptional:  true,
		},
		{
			Key:         "birthday",
			Type:        database.FieldTypeDate,
			DisplayName: "Birthday",
			Description: "Birthday date",
			IsOptional:  true,
		},
		{
			Key:         "address",
			Type:        database.FieldTypeText,
			DisplayName: "Address",
			Description: "Physical address",
			IsOptional:  true,
		},
		{
			Key:         "occupation",
			Type:        database.FieldTypeText,
			DisplayName: "Occupation",
			Description: "Job title or occupation",
			IsOptional:  true,
		},
		{
			Key:         "company",
			Type:        database.FieldTypeText,
			DisplayName: "Company",
			Description: "Company or organization",
			IsOptional:  true,
		},
		{
			Key:         "bio",
			Type:        database.FieldTypeText,
			DisplayName: "Bio",
			Description: "Brief biography or notes",
			IsOptional:  true,
		},
		{
			Key:         "photo_url",
			Type:        database.FieldTypeText,
			DisplayName: "Photo URL",
			Description: "URL to profile photo",
			IsOptional:  true,
		},
		{
			Key:          "tags",
			Type:         database.FieldTypeText,
			DisplayName:  "Tags",
			Description:  "Comma-separated tags",
			IsOptional:   true,
			IsSearchable: true,
		},
		{
			Key:         "first_met_date",
			Type:        database.FieldTypeDate,
			DisplayName: "First Met",
			Description: "When you first met this person",
			IsOptional:  true,
		},
		{
			Key:         "social_links",
			Type:        database.FieldTypeText,
			DisplayName: "Social Links",
			Description: "JSON object of social media links",
			IsOptional:  true,
		},
		{
			Key:         "private",
			Type:        database.FieldTypeBoolean,
			DisplayName: "Private",
			Description: "Is this contact private?",
		},
	}
}

// GetMeetingsFields returns the field definitions for the Meetings dataset
func GetMeetingsFields() []database.FieldDefinition {
	return []database.FieldDefinition{
		{
			Key:            "person_id",
			Type:           database.FieldTypeText,
			DisplayName:    "Person",
			Description:    "Who did you chat with?",
			IsSearchable:   true,
			IsRelation:     true,
			RelatedDataset: "people",
			RelatedField:   "id",
		},
		{
			Key:          "chat_date",
			Type:         database.FieldTypeDate,
			DisplayName:  "Chat Date",
			Description:  "When did this chat occur?",
			IsSearchable: true,
		},
		{
			Key:         "platform",
			Type:        database.FieldTypeText,
			DisplayName: "Platform",
			Description: "Where did the chat happen?",
		},
		{
			Key:         "content",
			Type:        database.FieldTypeMarkdown,
			DisplayName: "Content",
			Description: "What was discussed?",
		},
		{
			Key:         "sender",
			Type:        database.FieldTypeText,
			DisplayName: "Sender",
			Description: "Who sent this message?",
		},
		{
			Key:         "attachments",
			Type:        database.FieldTypeText,
			DisplayName: "Attachments",
			Description: "Any attachments or media shared",
			IsOptional:  true,
		},
		{
			Key:         "private",
			Type:        database.FieldTypeBoolean,
			DisplayName: "Private",
			Description: "Is this chat private?",
		},
	}
}

// GetBirthdayRemindersFields returns the field definitions for the Birthday Reminders dataset
func GetBirthdayRemindersFields() []database.FieldDefinition {
	return []database.FieldDefinition{
		{
			Key:            "person_id",
			Type:           database.FieldTypeText,
			DisplayName:    "Person",
			Description:    "Whose birthday?",
			IsSearchable:   true,
			IsRelation:     true,
			RelatedDataset: "people",
			RelatedField:   "id",
		},
		{
			Key:         "reminder_date",
			Type:        database.FieldTypeDate,
			DisplayName: "Reminder Date",
			Description: "When to remind you",
		},
		{
			Key:         "advance_days",
			Type:        database.FieldTypeNumber,
			DisplayName: "Days in Advance",
			Description: "How many days before birthday",
		},
		{
			Key:         "reminder_note",
			Type:        database.FieldTypeText,
			DisplayName: "Reminder Note",
			Description: "Additional reminder note",
			IsOptional:  true,
		},
	}
}

// GetPersonRelationshipsFields returns the field definitions for the Person Relationships dataset
func GetPersonRelationshipsFields() []database.FieldDefinition {
	return []database.FieldDefinition{
		{
			Key:            "person1_id",
			Type:           database.FieldTypeText,
			DisplayName:    "Person 1",
			Description:    "First person in relationship",
			IsSearchable:   true,
			IsRelation:     true,
			RelatedDataset: "people",
			RelatedField:   "id",
		},
		{
			Key:            "person2_id",
			Type:           database.FieldTypeText,
			DisplayName:    "Person 2",
			Description:    "Second person in relationship",
			IsSearchable:   true,
			IsRelation:     true,
			RelatedDataset: "people",
			RelatedField:   "id",
		},
		{
			Key:         "relationship_type",
			Type:        database.FieldTypeText,
			DisplayName: "Relationship Type",
			Description: "How they know each other",
		},
		{
			Key:         "description",
			Type:        database.FieldTypeText,
			DisplayName: "Description",
			Description: "More details about the relationship",
			IsOptional:  true,
		},
		{
			Key:         "since_date",
			Type:        database.FieldTypeDate,
			DisplayName: "Since",
			Description: "When did they become connected?",
			IsOptional:  true,
		},
	}
}.FieldTypeText,
			DisplayName:    "Person",
			Description:    "Who did you meet with?",
			IsSearchable:   true,
			IsRelation:     true,
			RelatedDataset: "people",
			RelatedField:   "id",
		},
		{
			Key:          "meeting_date",
			Type:         database.FieldTypeDate,
			DisplayName:  "Meeting Date",
			Description:  "When did the meeting occur?",
			IsSearchable: true,
		},
		{
			Key:          "location",
			Type:         database.FieldTypeText,
			DisplayName:  "Location",
			Description:  "Where did the meeting take place?",
			IsSearchable: true,
		},
		{
			Key:         "location_type",
			Type:        database.FieldTypeText,
			DisplayName: "Location Type",
			Description: "Type of location",
		},
		{
			Key:         "duration_minutes",
			Type:        database.FieldTypeNumber,
			DisplayName: "Duration (minutes)",
			Description: "How long was the meeting?",
			IsOptional:  true,
		},
		{
			Key:         "participants",
			Type:        database.FieldTypeText,
			DisplayName: "Other Participants",
			Description: "Other people who attended",
			IsOptional:  true,
		},
		{
			Key:         "description",
			Type:        database.FieldTypeMarkdown,
			DisplayName: "Description",
			Description: "What was discussed?",
			IsOptional:  true,
		},
		{
			Key:          "tags",
			Type:         database.FieldTypeText,
			DisplayName:  "Tags",
			Description:  "Comma-separated tags",
			IsOptional:   true,
			IsSearchable: true,
		},
		{
			Key:         "feelings",
			Type:        database.FieldTypeText,
			DisplayName: "How did it feel?",
			Description: "Your impressions of the meeting",
			IsOptional:  true,
		},
		{
			Key:         "follow_up_needed",
			Type:        database.FieldTypeBoolean,
			DisplayName: "Follow-up Needed",
			Description: "Does this meeting require follow-up?",
		},
		{
			Key:         "follow_up_date",
			Type:        database.FieldTypeDate,
			DisplayName: "Follow-up Date",
			Description: "When to follow up",
			IsOptional:  true,
		},
		{
			Key:         "private",
			Type:        database.FieldTypeBoolean,
			DisplayName: "Private",
			Description: "Is this meeting private?",
		},
	}
}

// GetPersonAttributesFields returns the field definitions for the Person Attributes dataset
func GetPersonAttributesFields() []database.FieldDefinition {
	return []database.FieldDefinition{
		{
			Key:            "person_id",
			Type:           database.FieldTypeText,
			DisplayName:    "Person",
			Description:    "Who is this attribute about?",
			IsSearchable:   true,
			IsRelation:     true,
			RelatedDataset: "people",
			RelatedField:   "id",
		},
		{
			Key:          "attribute_name",
			Type:         database.FieldTypeText,
			DisplayName:  "Attribute Name",
			Description:  "What is the attribute?",
			IsSearchable: true,
		},
		{
			Key:         "attribute_value",
			Type:        database.FieldTypeText,
			DisplayName: "Attribute Value",
			Description: "Value or description of the attribute",
		},
		{
			Key:         "category",
			Type:        database.FieldTypeText,
			DisplayName: "Category",
			Description: "Category of attribute",
			IsOptional:  true,
		},
		{
			Key:         "learned_date",
			Type:        database.FieldTypeDate,
			DisplayName: "Date Learned",
			Description: "When did you learn this?",
			IsOptional:  true,
		},
		{
			Key:         "notes",
			Type:        database.FieldTypeText,
			DisplayName: "Notes",
			Description: "Additional notes about this attribute",
			IsOptional:  true,
		},
		{
			Key:         "source",
			Type:        database.FieldTypeText,
			DisplayName: "Source",
			Description: "How did you learn this?",
			IsOptional:  true,
		},
		{
			Key:         "private",
			Type:        database.FieldTypeBoolean,
			DisplayName: "Private",
			Description: "Is this attribute private?",
		},
	}
}

// GetPersonNotesFields returns the field definitions for the Person Notes dataset
func GetPersonNotesFields() []database.FieldDefinition {
	return []database.FieldDefinition{
		{
			Key:            "person_id",
			Type:           database.FieldTypeText,
			DisplayName:    "Person",
			Description:    "Who is this note about?",
			IsSearchable:   true,
			IsRelation:     true,
			RelatedDataset: "people",
			RelatedField:   "id",
		},
		{
			Key:          "note_date",
			Type:         database.FieldTypeDate,
			DisplayName:  "Date",
			Description:  "Date of the note",
			IsSearchable: true,
		},
		{
			Key:         "content",
			Type:        database.FieldTypeMarkdown,
			DisplayName: "Note Content",
			Description: "What do you want to note?",
		},
		{
			Key:         "category",
			Type:        database.FieldTypeText,
			DisplayName: "Category",
			Description: "Type of note",
			IsOptional:  true,
		},
		{
			Key:          "tags",
			Type:         database.FieldTypeText,
			DisplayName:  "Tags",
			Description:  "Comma-separated tags",
			IsOptional:   true,
			IsSearchable: true,
		},
		{
			Key:         "private",
			Type:        database.FieldTypeBoolean,
			DisplayName: "Private",
			Description: "Is this note private?",
		},
	}
}

// GetPersonChatsFields returns the field definitions for the Person Chats dataset
func GetPersonChatsFields() []database.FieldDefinition {
	return []database.FieldDefinition{
		{
			Key:            "person_id",
			Type:           database