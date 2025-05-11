// frontend/src/features/field-definitions/field-definitions-store.ts
// Updated to include experiment-related datasets and People CRM

import { FieldDefinition, FieldDefinitionsState } from "@/types/types";
import { Store } from "@tanstack/react-store";
import { DEXA_FIELD_DEFINITIONS } from "./dexa-definitions";
import {
  BLOOD_MARKERS_FIELD_DEFINITIONS,
  BLOOD_RESULTS_FIELD_DEFINITIONS,
  BLOODWORK_FIELD_DEFINITIONS,
} from "./bloodwork-definitions";
import {
  EXPERIMENT_FIELD_DEFINITIONS,
  METRIC_FIELD_DEFINITIONS,
  DAILY_LOG_FIELD_DEFINITIONS,
  METRIC_CATEGORY_FIELD_DEFINITIONS,
  EXPERIMENT_METRIC_FIELD_DEFINITIONS,
} from "./experiment-definitions";
import {
  AFFIRMATION_FIELD_DEFINITIONS,
  CREATIVITY_JOURNAL_FIELD_DEFINITIONS,
  GRATITUDE_JOURNAL_FIELD_DEFINITIONS,
  QUESTION_JOURNAL_FIELD_DEFINITIONS,
} from "./journaling-definitions";
import {
  TIME_CATEGORIES_FIELD_DEFINITIONS,
  TIME_ENTRIES_FIELD_DEFINITIONS,
} from "./time-tracking-definitions";
import { TODO_FIELD_DEFINITIONS } from "./todo-definitions";
import {
  PEOPLE_FIELD_DEFINITIONS,
  MEETINGS_FIELD_DEFINITIONS,
  PERSON_ATTRIBUTES_FIELD_DEFINITIONS,
  PERSON_NOTES_FIELD_DEFINITIONS,
  PERSON_CHATS_FIELD_DEFINITIONS,
  BIRTHDAY_REMINDERS_FIELD_DEFINITIONS,
  PERSON_RELATIONSHIPS_FIELD_DEFINITIONS,
} from "./people-crm-definitions";

// Initial dataset definitions
const initialState: FieldDefinitionsState = {
  datasets: {
    dexa: DEXA_FIELD_DEFINITIONS,
    bloodwork: BLOODWORK_FIELD_DEFINITIONS,
    blood_markers: BLOOD_MARKERS_FIELD_DEFINITIONS,
    blood_results: BLOOD_RESULTS_FIELD_DEFINITIONS,
    experiments: EXPERIMENT_FIELD_DEFINITIONS,
    metrics: METRIC_FIELD_DEFINITIONS,
    daily_logs: DAILY_LOG_FIELD_DEFINITIONS,
    metric_categories: METRIC_CATEGORY_FIELD_DEFINITIONS,
    experiment_metrics: EXPERIMENT_METRIC_FIELD_DEFINITIONS,
    gratitude_journal: GRATITUDE_JOURNAL_FIELD_DEFINITIONS,
    question_journal: QUESTION_JOURNAL_FIELD_DEFINITIONS,
    creativity_journal: CREATIVITY_JOURNAL_FIELD_DEFINITIONS,
    affirmation: AFFIRMATION_FIELD_DEFINITIONS,
    time_entries: TIME_ENTRIES_FIELD_DEFINITIONS,
    time_categories: TIME_CATEGORIES_FIELD_DEFINITIONS,
    todos: TODO_FIELD_DEFINITIONS,
    // People CRM datasets
    people: PEOPLE_FIELD_DEFINITIONS,
    meetings: MEETINGS_FIELD_DEFINITIONS,
    person_attributes: PERSON_ATTRIBUTES_FIELD_DEFINITIONS,
    person_notes: PERSON_NOTES_FIELD_DEFINITIONS,
    person_chats: PERSON_CHATS_FIELD_DEFINITIONS,
    birthday_reminders: BIRTHDAY_REMINDERS_FIELD_DEFINITIONS,
    person_relationships: PERSON_RELATIONSHIPS_FIELD_DEFINITIONS,
  },
};

// Create the store
export const fieldDefinitionsStore = new Store<FieldDefinitionsState>(
  initialState
);

// Add helper functions to work with the store
export const FieldDefinitionsManager = {
  // Get field definitions for a dataset
  getDatasetFields: (datasetId: string): FieldDefinition[] => {
    return fieldDefinitionsStore.state.datasets[datasetId]?.fields || [];
  },

  // Get dataset details
  getDataset: (datasetId: string) => {
    return fieldDefinitionsStore.state.datasets[datasetId];
  },

  // Get all available datasets
  getAllDatasets: () => {
    return Object.values(fieldDefinitionsStore.state.datasets);
  },

  // Add a new field to a dataset
  addField: (datasetId: string, field: FieldDefinition) => {
    fieldDefinitionsStore.setState((state) => {
      if (!state.datasets[datasetId]) {
        return state;
      }

      return {
        ...state,
        datasets: {
          ...state.datasets,
          [datasetId]: {
            ...state.datasets[datasetId],
            fields: [...state.datasets[datasetId].fields, field],
          },
        },
      };
    });
  },

  // Update an existing field
  updateField: (
    datasetId: string,
    fieldKey: string,
    updatedField: Partial<FieldDefinition>
  ) => {
    fieldDefinitionsStore.setState((state) => {
      if (!state.datasets[datasetId]) {
        return state;
      }

      return {
        ...state,
        datasets: {
          ...state.datasets,
          [datasetId]: {
            ...state.datasets[datasetId],
            fields: state.datasets[datasetId].fields.map((field) =>
              field.key === fieldKey ? { ...field, ...updatedField } : field
            ),
          },
        },
      };
    });
  },

  // Remove a field
  removeField: (datasetId: string, fieldKey: string) => {
    fieldDefinitionsStore.setState((state) => {
      if (!state.datasets[datasetId]) {
        return state;
      }

      return {
        ...state,
        datasets: {
          ...state.datasets,
          [datasetId]: {
            ...state.datasets[datasetId],
            fields: state.datasets[datasetId].fields.filter(
              (field) => field.key !== fieldKey
            ),
          },
        },
      };
    });
  },

  // Create a new dataset
  createDataset: (dataset: {
    id: string;
    name: string;
    description?: string;
    fields: FieldDefinition[];
  }) => {
    fieldDefinitionsStore.setState((state) => ({
      ...state,
      datasets: {
        ...state.datasets,
        [dataset.id]: dataset,
      },
    }));
  },
};

// Create a hook to use the field definitions store
export function useFieldDefinitions() {
  return {
    store: fieldDefinitionsStore,
    ...FieldDefinitionsManager,
  };
}
