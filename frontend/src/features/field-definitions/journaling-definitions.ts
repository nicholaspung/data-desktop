// frontend/src/features/field-definitions/gratitude-journal-definitions.ts
import { FieldDefinitionsDataset } from "@/types/types";

export const GRATITUDE_JOURNAL_FIELD_DEFINITIONS: FieldDefinitionsDataset = {
  id: "gratitude_journal",
  name: "Gratitude Journal",
  description: "Record things you are grateful for",
  fields: [
    {
      key: "date",
      type: "date",
      displayName: "Date",
      description: "Date of the journal entry",
      isSearchable: true,
    },
    {
      key: "entry",
      type: "markdown",
      displayName: "Journal Entry",
      description: "What are you grateful for today?",
    },
  ],
};

export const CREATIVITY_JOURNAL_FIELD_DEFINITIONS: FieldDefinitionsDataset = {
  id: "creativity_journal",
  name: "Creativity Journal",
  description: "Record your creative thoughts",
  fields: [
    {
      key: "date",
      type: "date",
      displayName: "Date",
      description: "Date of the journal entry",
      isSearchable: true,
    },
    {
      key: "entry",
      type: "markdown",
      displayName: "Journal Entry",
      description: "What creative ideas do you have today?",
    },
  ],
};

export const QUESTION_JOURNAL_FIELD_DEFINITIONS: FieldDefinitionsDataset = {
  id: "question_journal",
  name: "Question Journal",
  description: "Record your answers to questions",
  fields: [
    {
      key: "date",
      type: "date",
      displayName: "Date",
      description: "Date of the journal entry",
      isSearchable: true,
    },
    {
      key: "entry",
      type: "markdown",
      displayName: "Journal Entry",
      description: "What answer to the questions do you have today?",
    },
  ],
};

export const AFFIRMATION_FIELD_DEFINITIONS: FieldDefinitionsDataset = {
  id: "affirmation",
  name: "Affirmation",
  description: "Write down the affirmation you want to repeat today",
  fields: [
    {
      key: "date",
      type: "date",
      displayName: "Date",
      description: "Date of the updated affirmation",
      isSearchable: true,
    },
    {
      key: "affirmation",
      type: "markdown",
      displayName: "Affirmation",
      description: "What affirmation do you want to repeat today?",
    },
  ],
};
