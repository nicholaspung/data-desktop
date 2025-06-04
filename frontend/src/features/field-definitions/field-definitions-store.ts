import {
  DatasetId,
  FieldDefinition,
  FieldDefinitionsState,
  FieldDefinitionsDataset,
} from "@/types/types";
import { Store } from "@tanstack/react-store";

import {
  BLOODWORK_FIELD_DEFINITIONS,
  BLOOD_MARKERS_FIELD_DEFINITIONS,
  BLOOD_RESULTS_FIELD_DEFINITIONS,
} from "./bloodwork-definitions";
import { DEXA_FIELD_DEFINITIONS } from "./dexa-definitions";
import {
  EXPERIMENT_FIELD_DEFINITIONS,
  METRIC_FIELD_DEFINITIONS,
  DAILY_LOG_FIELD_DEFINITIONS,
  METRIC_CATEGORY_FIELD_DEFINITIONS,
  EXPERIMENT_METRIC_FIELD_DEFINITIONS,
} from "./experiment-definitions";
import {
  GRATITUDE_JOURNAL_FIELD_DEFINITIONS,
  CREATIVITY_JOURNAL_FIELD_DEFINITIONS,
  QUESTION_JOURNAL_FIELD_DEFINITIONS,
  AFFIRMATION_FIELD_DEFINITIONS,
} from "./journaling-definitions";
import {
  PEOPLE_FIELD_DEFINITIONS,
  MEETINGS_FIELD_DEFINITIONS,
  PERSON_ATTRIBUTES_FIELD_DEFINITIONS,
  PERSON_NOTES_FIELD_DEFINITIONS,
  BIRTHDAY_REMINDERS_FIELD_DEFINITIONS,
  PERSON_RELATIONSHIPS_FIELD_DEFINITIONS,
} from "./people-crm-definitions";
import {
  TIME_ENTRIES_FIELD_DEFINITIONS,
  TIME_CATEGORIES_FIELD_DEFINITIONS,
  TIME_PLANNER_CONFIGS_FIELD_DEFINITIONS,
} from "./time-tracking-definitions";
import { TODO_FIELD_DEFINITIONS } from "./todo-definitions";
import { BODY_MEASUREMENTS_FIELD_DEFINITIONS } from "./body-measurements-definitions";
import { DataStoreName } from "@/store/data-store";

const ALL_DEFINITIONS = [
  BLOODWORK_FIELD_DEFINITIONS,
  BLOOD_MARKERS_FIELD_DEFINITIONS,
  BLOOD_RESULTS_FIELD_DEFINITIONS,
  DEXA_FIELD_DEFINITIONS,
  EXPERIMENT_FIELD_DEFINITIONS,
  METRIC_FIELD_DEFINITIONS,
  DAILY_LOG_FIELD_DEFINITIONS,
  METRIC_CATEGORY_FIELD_DEFINITIONS,
  EXPERIMENT_METRIC_FIELD_DEFINITIONS,
  GRATITUDE_JOURNAL_FIELD_DEFINITIONS,
  CREATIVITY_JOURNAL_FIELD_DEFINITIONS,
  QUESTION_JOURNAL_FIELD_DEFINITIONS,
  AFFIRMATION_FIELD_DEFINITIONS,
  PEOPLE_FIELD_DEFINITIONS,
  MEETINGS_FIELD_DEFINITIONS,
  PERSON_ATTRIBUTES_FIELD_DEFINITIONS,
  PERSON_NOTES_FIELD_DEFINITIONS,
  BIRTHDAY_REMINDERS_FIELD_DEFINITIONS,
  PERSON_RELATIONSHIPS_FIELD_DEFINITIONS,
  TIME_ENTRIES_FIELD_DEFINITIONS,
  TIME_CATEGORIES_FIELD_DEFINITIONS,
  TIME_PLANNER_CONFIGS_FIELD_DEFINITIONS,
  TODO_FIELD_DEFINITIONS,
  BODY_MEASUREMENTS_FIELD_DEFINITIONS,
];

const initialState: FieldDefinitionsState = {
  datasets: ALL_DEFINITIONS.reduce(
    (acc, def) => {
      acc[def.id] = def;
      return acc;
    },
    {} as Record<DataStoreName, FieldDefinitionsDataset>
  ),
};

export const DATASET_IDS = ALL_DEFINITIONS.map((def) => def.id);

export const fieldDefinitionsStore = new Store<FieldDefinitionsState>(
  initialState
);

export const FieldDefinitionsManager = {
  getDatasetFields: (datasetId: string): FieldDefinition[] => {
    return fieldDefinitionsStore.state.datasets[datasetId]?.fields || [];
  },

  getDataset: (datasetId: string) => {
    return fieldDefinitionsStore.state.datasets[datasetId];
  },

  getAllDatasets: () => {
    return Object.values(fieldDefinitionsStore.state.datasets);
  },

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

  createDataset: (dataset: {
    id: DatasetId;
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

export function useFieldDefinitions() {
  return {
    store: fieldDefinitionsStore,
    ...FieldDefinitionsManager,
  };
}
