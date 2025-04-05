// src/features/field-definitions/field-definitions-store.ts
import { FieldDefinition, FieldDefinitionsState } from "@/types";
import { Store } from "@tanstack/react-store";
import { DEXA_FIELD_DEFINITIONS } from "./dexa-definitions";
import {
  BLOOD_MARKERS_FIELD_DEFINITIONS,
  BLOOD_RESULTS_FIELD_DEFINITIONS,
  BLOODWORK_FIELD_DEFINITIONS,
} from "./bloodwork-definitions";

// Initial dataset definitions
const initialState: FieldDefinitionsState = {
  datasets: {
    dexa: DEXA_FIELD_DEFINITIONS,
    bloodwork: BLOODWORK_FIELD_DEFINITIONS,
    bloodmarkers: BLOOD_MARKERS_FIELD_DEFINITIONS,
    bloodresults: BLOOD_RESULTS_FIELD_DEFINITIONS,
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
