// src/features/field-definitions/field-definitions-store.ts
import { FieldDefinition } from "@/types";
import { Store } from "@tanstack/react-store";

// Interface for the store state
interface FieldDefinitionsState {
  datasets: {
    [key: string]: {
      id: string;
      name: string;
      description?: string;
      fields: FieldDefinition[];
    };
  };
}

// Initial dataset definitions
const initialState: FieldDefinitionsState = {
  datasets: {
    dexa: {
      id: "dexa",
      name: "DEXA Scan",
      description: "Body composition measurements from DEXA scans",
      fields: [
        {
          key: "date",
          type: "date",
          displayName: "Date",
          description: "Date of the DEXA scan",
          isSearchable: true,
        },
        {
          key: "fasted",
          type: "boolean",
          displayName: "Fasted",
          description: "Whether the scan was taken in a fasted state",
        },
        {
          key: "total_body_fat_percentage",
          type: "percentage",
          displayName: "Body Fat %",
          description: "Total body fat percentage",
        },
        {
          key: "total_mass_lbs",
          type: "number",
          displayName: "Total Mass",
          unit: "lbs",
          description: "Total body mass",
        },
        {
          key: "fat_tissue_lbs",
          type: "number",
          displayName: "Fat Tissue",
          unit: "lbs",
          description: "Total fat tissue mass",
        },
        {
          key: "lean_tissue_lbs",
          type: "number",
          displayName: "Lean Tissue",
          unit: "lbs",
          description: "Total lean tissue mass",
        },
        {
          key: "bone_mineral_content",
          type: "number",
          displayName: "BMC",
          description: "Bone Mineral Content",
        },
        // Add more fields as needed
      ],
    },
    bloodwork: {
      id: "bloodwork",
      name: "Bloodwork",
      description: "Blood test results and markers",
      fields: [
        {
          key: "date",
          type: "date",
          displayName: "Date",
          description: "Date of the blood test",
          isSearchable: true,
        },
        {
          key: "fasted",
          type: "boolean",
          displayName: "Fasted",
          description: "Whether the blood was drawn in a fasted state",
        },
        // Add blood work specific fields here
      ],
    },
    paycheck: {
      id: "paycheck",
      name: "Paycheck",
      description: "Paycheck and income information",
      fields: [
        {
          key: "date",
          type: "date",
          displayName: "Date",
          description: "Paycheck date",
          isSearchable: true,
        },
        {
          key: "gross_income",
          type: "number",
          displayName: "Gross Income",
          unit: "$",
          description: "Gross income before any deductions",
        },
        // Add paycheck specific fields here
      ],
    },
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
