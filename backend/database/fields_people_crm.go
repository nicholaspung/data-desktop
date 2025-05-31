package database

func GetPeopleFields() []FieldDefinition {
	return []FieldDefinition{
		{
			Key:          "name",
			Type:         FieldTypeText,
			DisplayName:  "Name",
			Description:  "Full name of the person",
			IsSearchable: true,
		},
		{
			Key:          "birthday",
			Type:         FieldTypeDate,
			DisplayName:  "Birthday",
			Description:  "Birthday of the person",
			IsSearchable: true,
			IsOptional:   true,
		},
		{
			Key:         "address",
			Type:        FieldTypeText,
			DisplayName: "Address",
			Description: "Home address of the person",
			IsOptional:  true,
		},
		{
			Key:         "employment_history",
			Type:        FieldTypeMarkdown,
			DisplayName: "Employment History",
			Description: "Employment history and career information",
			IsOptional:  true,
		},
		{
			Key:         "tags",
			Type:        FieldTypeText,
			DisplayName: "Tags",
			Description: "Comma-separated tags for categorization",
			IsOptional:  true,
		},
		{
			Key:         "first_met_date",
			Type:        FieldTypeDate,
			DisplayName: "First Met Date",
			Description: "Date when you first met this person",
			IsOptional:  true,
		},
		{
			Key:         "private",
			Type:        FieldTypeBoolean,
			DisplayName: "Private",
			Description: "Is this person's information private?",
		},
	}
}

func GetMeetingsFields() []FieldDefinition {
	return []FieldDefinition{
		{
			Key:            "person_id",
			Type:           FieldTypeText,
			DisplayName:    "Person",
			Description:    "Reference to the person this meeting is with",
			IsRelation:     true,
			RelatedDataset: "people",
			RelatedField:   "id",
		},
		{
			Key:          "meeting_date",
			Type:         FieldTypeDate,
			DisplayName:  "Meeting Date",
			Description:  "Date and time of the meeting",
			IsSearchable: true,
		},
		{
			Key:         "location",
			Type:        FieldTypeText,
			DisplayName: "Location",
			Description: "Where the meeting took place",
			IsOptional:  true,
		},
		{
			Key:         "location_type",
			Type:        FieldTypeText,
			DisplayName: "Location Type",
			Description: "Type of location (in-person, video call, phone, etc.)",
			IsOptional:  true,
		},
		{
			Key:         "duration_minutes",
			Type:        FieldTypeNumber,
			DisplayName: "Duration (Minutes)",
			Description: "Duration of the meeting in minutes",
			Unit:        "minutes",
			IsOptional:  true,
		},
		{
			Key:         "participants",
			Type:        FieldTypeText,
			DisplayName: "Other Participants",
			Description: "Other people who participated in the meeting",
			IsOptional:  true,
		},
		{
			Key:         "description",
			Type:        FieldTypeMarkdown,
			DisplayName: "Description",
			Description: "Description of what was discussed or what happened",
			IsOptional:  true,
		},
		{
			Key:         "tags",
			Type:        FieldTypeText,
			DisplayName: "Tags",
			Description: "Comma-separated tags for categorization",
			IsOptional:  true,
		},
		{
			Key:         "feelings",
			Type:        FieldTypeText,
			DisplayName: "Feelings",
			Description: "How you felt about the meeting",
			IsOptional:  true,
		},
		{
			Key:         "follow_up_needed",
			Type:        FieldTypeBoolean,
			DisplayName: "Follow-up Needed",
			Description: "Whether follow-up is needed after this meeting",
		},
		{
			Key:         "follow_up_date",
			Type:        FieldTypeDate,
			DisplayName: "Follow-up Date",
			Description: "When to follow up",
			IsOptional:  true,
		},
		{
			Key:         "private",
			Type:        FieldTypeBoolean,
			DisplayName: "Private",
			Description: "Is this meeting private?",
		},
	}
}

func GetBirthdayRemindersFields() []FieldDefinition {
	return []FieldDefinition{
		{
			Key:            "person_id",
			Type:           FieldTypeText,
			DisplayName:    "Person",
			Description:    "Reference to the person this reminder is for",
			IsRelation:     true,
			RelatedDataset: "people",
			RelatedField:   "id",
		},
		{
			Key:         "reminder_date",
			Type:        FieldTypeDate,
			DisplayName: "Reminder Date",
			Description: "Date when the reminder should trigger",
		},
		{
			Key:         "advance_days",
			Type:        FieldTypeNumber,
			DisplayName: "Advance Days",
			Description: "How many days in advance to remind",
			Unit:        "days",
		},
		{
			Key:         "reminder_note",
			Type:        FieldTypeText,
			DisplayName: "Reminder Note",
			Description: "Custom note for the reminder",
			IsOptional:  true,
		},
	}
}

func GetPersonRelationshipsFields() []FieldDefinition {
	return []FieldDefinition{
		{
			Key:            "person1_id",
			Type:           FieldTypeText,
			DisplayName:    "Person 1",
			Description:    "Reference to the first person in the relationship",
			IsRelation:     true,
			RelatedDataset: "people",
			RelatedField:   "id",
		},
		{
			Key:            "person2_id",
			Type:           FieldTypeText,
			DisplayName:    "Person 2",
			Description:    "Reference to the second person in the relationship",
			IsRelation:     true,
			RelatedDataset: "people",
			RelatedField:   "id",
		},
		{
			Key:         "relationship_type",
			Type:        FieldTypeText,
			DisplayName: "Relationship Type",
			Description: "Type of relationship (family, friend, colleague, etc.)",
		},
		{
			Key:         "description",
			Type:        FieldTypeText,
			DisplayName: "Description",
			Description: "Description of the relationship",
			IsOptional:  true,
		},
		{
			Key:         "since_date",
			Type:        FieldTypeDate,
			DisplayName: "Since Date",
			Description: "When this relationship started",
			IsOptional:  true,
		},
	}
}

func GetPersonAttributesFields() []FieldDefinition {
	return []FieldDefinition{
		{
			Key:            "person_id",
			Type:           FieldTypeText,
			DisplayName:    "Person",
			Description:    "Reference to the person this attribute belongs to",
			IsRelation:     true,
			RelatedDataset: "people",
			RelatedField:   "id",
		},
		{
			Key:          "attribute_name",
			Type:         FieldTypeText,
			DisplayName:  "Attribute Name",
			Description:  "Name of the attribute",
			IsSearchable: true,
		},
		{
			Key:         "attribute_value",
			Type:        FieldTypeText,
			DisplayName: "Attribute Value",
			Description: "Value of the attribute",
		},
		{
			Key:         "category",
			Type:        FieldTypeText,
			DisplayName: "Category",
			Description: "Category this attribute belongs to",
			IsOptional:  true,
		},
		{
			Key:         "learned_date",
			Type:        FieldTypeDate,
			DisplayName: "Learned Date",
			Description: "When you learned about this attribute",
			IsOptional:  true,
		},
		{
			Key:         "notes",
			Type:        FieldTypeText,
			DisplayName: "Notes",
			Description: "Additional notes about this attribute",
			IsOptional:  true,
		},
		{
			Key:         "source",
			Type:        FieldTypeText,
			DisplayName: "Source",
			Description: "Where you learned this information",
			IsOptional:  true,
		},
		{
			Key:         "private",
			Type:        FieldTypeBoolean,
			DisplayName: "Private",
			Description: "Is this attribute private?",
		},
	}
}

func GetPersonNotesFields() []FieldDefinition {
	return []FieldDefinition{
		{
			Key:            "person_id",
			Type:           FieldTypeText,
			DisplayName:    "Person",
			Description:    "Reference to the person this note is about",
			IsRelation:     true,
			RelatedDataset: "people",
			RelatedField:   "id",
		},
		{
			Key:          "note_date",
			Type:         FieldTypeDate,
			DisplayName:  "Note Date",
			Description:  "Date of the note",
			IsSearchable: true,
		},
		{
			Key:         "content",
			Type:        FieldTypeMarkdown,
			DisplayName: "Content",
			Description: "Content of the note",
		},
		{
			Key:         "category",
			Type:        FieldTypeText,
			DisplayName: "Category",
			Description: "Category of the note",
			IsOptional:  true,
		},
		{
			Key:         "tags",
			Type:        FieldTypeText,
			DisplayName: "Tags",
			Description: "Comma-separated tags for categorization",
			IsOptional:  true,
		},
		{
			Key:         "private",
			Type:        FieldTypeBoolean,
			DisplayName: "Private",
			Description: "Is this note private?",
		},
	}
}