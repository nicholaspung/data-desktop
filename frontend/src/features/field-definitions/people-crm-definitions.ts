import {
  FieldDefinitionsDataset,
  DATASET_REFERENCES,
  createRelationField,
} from "@/types/types";

export const PEOPLE_FIELD_DEFINITIONS: FieldDefinitionsDataset = {
  id: "people",
  name: "People",
  description: "Contacts and people in your network",
  fields: [
    {
      key: "name",
      type: "text",
      displayName: "Name",
      description: "Full name of the person",
      isSearchable: true,
    },
    {
      key: "birthday",
      type: "date",
      displayName: "Birthday",
      description: "Birthday date",
      isOptional: true,
    },
    {
      key: "address",
      type: "text",
      displayName: "Address",
      description: "Physical address",
      isOptional: true,
    },
    {
      key: "employment_history",
      type: "markdown",
      displayName: "Employment History",
      description: "List of previous occupations and companies",
      isOptional: true,
    },
    {
      key: "tags",
      type: "text",
      displayName: "Tags",
      description: "Comma-separated tags",
      isOptional: true,
      isSearchable: true,
    },
    {
      key: "first_met_date",
      type: "date",
      displayName: "First Met",
      description: "When you first met this person",
      isOptional: true,
    },
    {
      key: "private",
      type: "boolean",
      displayName: "Private",
      description: "Is this contact private?",
    },
  ],
};

export const MEETINGS_FIELD_DEFINITIONS: FieldDefinitionsDataset = {
  id: "meetings",
  name: "Meetings",
  description: "Track meetings and interactions with people",
  fields: [
    createRelationField(
      "person_id",
      "Person",
      DATASET_REFERENCES.PEOPLE,
      {
        description: "Who did you meet with?",
        deleteBehavior: "cascadeDeleteIfReferenced",
        displayField: "name",
        displayFieldType: "text",
      }
    ),
    {
      key: "meeting_date",
      type: "date",
      displayName: "Meeting Date",
      description: "When did the meeting occur?",
      isSearchable: true,
    },
    {
      key: "location",
      type: "text",
      displayName: "Location",
      description: "Where did the meeting take place?",
      isSearchable: true,
    },
    {
      key: "location_type",
      type: "text",
      displayName: "Location Type",
      description: "Type of location (autocomplete)",
      isOptional: true,
    },
    {
      key: "duration_minutes",
      type: "number",
      displayName: "Duration (minutes)",
      description: "How long was the meeting?",
      isOptional: true,
    },
    {
      key: "participants",
      type: "text",
      displayName: "Other Participants",
      description: "Other people who attended",
      isOptional: true,
    },
    {
      key: "description",
      type: "markdown",
      displayName: "Description",
      description: "What was discussed?",
      isOptional: true,
    },
    {
      key: "tags",
      type: "text",
      displayName: "Tags",
      description: "Comma-separated tags",
      isOptional: true,
      isSearchable: true,
    },
    {
      key: "feelings",
      type: "text",
      displayName: "How did it feel?",
      description: "Your impressions of the meeting",
      isOptional: true,
    },
    {
      key: "follow_up_needed",
      type: "boolean",
      displayName: "Follow-up Needed",
      description: "Does this meeting require follow-up?",
    },
    {
      key: "follow_up_date",
      type: "date",
      displayName: "Follow-up Date",
      description: "When to follow up",
      isOptional: true,
    },
    {
      key: "private",
      type: "boolean",
      displayName: "Private",
      description: "Is this meeting private?",
    },
  ],
};

export const PERSON_ATTRIBUTES_FIELD_DEFINITIONS: FieldDefinitionsDataset = {
  id: "person_attributes",
  name: "Person Attributes",
  description: "Track random facts and attributes about people",
  fields: [
    createRelationField(
      "person_id",
      "Person",
      DATASET_REFERENCES.PEOPLE,
      {
        description: "Who is this attribute about?",
        deleteBehavior: "cascadeDeleteIfReferenced",
        displayField: "name",
        displayFieldType: "text",
      }
    ),
    {
      key: "attribute_name",
      type: "text",
      displayName: "Attribute Name",
      description: "What is the attribute?",
      isSearchable: true,
    },
    {
      key: "attribute_value",
      type: "text",
      displayName: "Attribute Value",
      description: "Value or description of the attribute",
    },
    {
      key: "category",
      type: "select-single",
      displayName: "Category",
      description: "Category of attribute",
      isOptional: true,
      options: [
        { id: "preferences", label: "Preferences" },
        { id: "hobbies", label: "Hobbies" },
        { id: "facts", label: "Facts" },
        { id: "skills", label: "Skills" },
        { id: "allergies", label: "Allergies" },
        { id: "dietary", label: "Dietary" },
        { id: "other", label: "Other" },
      ],
    },
    {
      key: "learned_date",
      type: "date",
      displayName: "Date Learned",
      description: "When did you learn this?",
      isOptional: true,
    },
    {
      key: "notes",
      type: "text",
      displayName: "Notes",
      description: "Additional notes about this attribute",
      isOptional: true,
    },
    {
      key: "source",
      type: "text",
      displayName: "Source",
      description: "How did you learn this?",
      isOptional: true,
    },
    {
      key: "private",
      type: "boolean",
      displayName: "Private",
      description: "Is this attribute private?",
    },
  ],
};

export const PERSON_NOTES_FIELD_DEFINITIONS: FieldDefinitionsDataset = {
  id: "person_notes",
  name: "Person Notes",
  description: "Daily notes about people",
  fields: [
    createRelationField(
      "person_id",
      "Person",
      DATASET_REFERENCES.PEOPLE,
      {
        description: "Who is this note about?",
        deleteBehavior: "cascadeDeleteIfReferenced",
        displayField: "name",
        displayFieldType: "text",
      }
    ),
    {
      key: "note_date",
      type: "date",
      displayName: "Date",
      description: "Date of the note",
      isSearchable: true,
    },
    {
      key: "content",
      type: "markdown",
      displayName: "Note Content",
      description: "What do you want to note?",
    },
    {
      key: "category",
      type: "select-single",
      displayName: "Category",
      description: "Type of note",
      isOptional: true,
      options: [
        { id: "general", label: "General" },
        { id: "important", label: "Important" },
        { id: "reminder", label: "Reminder" },
        { id: "idea", label: "Idea" },
        { id: "concern", label: "Concern" },
      ],
    },
    {
      key: "tags",
      type: "text",
      displayName: "Tags",
      description: "Comma-separated tags",
      isOptional: true,
      isSearchable: true,
    },
    {
      key: "private",
      type: "boolean",
      displayName: "Private",
      description: "Is this note private?",
    },
  ],
};

export const BIRTHDAY_REMINDERS_FIELD_DEFINITIONS: FieldDefinitionsDataset = {
  id: "birthday_reminders",
  name: "Birthday Reminders",
  description: "Track birthday reminders for people",
  fields: [
    createRelationField(
      "person_id",
      "Person",
      DATASET_REFERENCES.PEOPLE,
      {
        description: "Whose birthday?",
        deleteBehavior: "cascadeDeleteIfReferenced",
        displayField: "name",
        displayFieldType: "text",
      }
    ),
    {
      key: "reminder_date",
      type: "date",
      displayName: "Reminder Date",
      description: "When to remind you",
    },
    {
      key: "advance_days",
      type: "number",
      displayName: "Days in Advance",
      description: "How many days before birthday",
    },
    {
      key: "reminder_note",
      type: "text",
      displayName: "Reminder Note",
      description: "Additional reminder note",
      isOptional: true,
    },
  ],
};

export const PERSON_RELATIONSHIPS_FIELD_DEFINITIONS: FieldDefinitionsDataset = {
  id: "person_relationships",
  name: "Person Relationships",
  description: "Track relationships between people in your network",
  fields: [
    createRelationField(
      "person1_id",
      "Person 1",
      DATASET_REFERENCES.PEOPLE,
      {
        description: "First person in relationship",
        deleteBehavior: "cascadeDeleteIfReferenced",
        displayField: "name",
        displayFieldType: "text",
      }
    ),
    createRelationField(
      "person2_id",
      "Person 2",
      DATASET_REFERENCES.PEOPLE,
      {
        description: "Second person in relationship",
        deleteBehavior: "cascadeDeleteIfReferenced",
        displayField: "name",
        displayFieldType: "text",
      }
    ),
    {
      key: "relationship_type",
      type: "select-single",
      displayName: "Relationship Type",
      description: "How they know each other",
      options: [
        { id: "colleague", label: "Colleague" },
        { id: "friend", label: "Friend" },
        { id: "family", label: "Family" },
        { id: "mentor", label: "Mentor" },
        { id: "mentee", label: "Mentee" },
        { id: "neighbor", label: "Neighbor" },
        { id: "romantic", label: "Romantic" },
        { id: "other", label: "Other" },
      ],
    },
    {
      key: "description",
      type: "text",
      displayName: "Description",
      description: "More details about the relationship",
      isOptional: true,
    },
    {
      key: "since_date",
      type: "date",
      displayName: "Since",
      description: "When did they become connected?",
      isOptional: true,
    },
  ],
};
