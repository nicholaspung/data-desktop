import {
  FieldDefinitionsDataset,
  DATASET_REFERENCES,
  createRelationField,
} from "@/types/types";

export const BLOODWORK_FIELD_DEFINITIONS: FieldDefinitionsDataset = {
  id: "bloodwork",
  name: "Bloodwork",
  description: "Blood test results and markers",
  fields: [
    {
      key: "date",
      type: "date",
      displayName: "Test Date",
      description: "Date of the blood test",
      isSearchable: true,
    },
    {
      key: "fasted",
      type: "boolean",
      displayName: "Fasted",
      description: "Whether the blood was drawn in a fasted state",
    },
    {
      key: "lab_name",
      type: "autocomplete",
      displayName: "Lab Name",
      description: "Name of the laboratory or facility",
      isSearchable: true,
      isOptional: true,
    },
    {
      key: "notes",
      type: "text",
      displayName: "Notes",
      description: "Additional notes about this blood test",
      isOptional: true,
    },
  ],
};

export const BLOOD_MARKERS_FIELD_DEFINITIONS: FieldDefinitionsDataset = {
  id: "blood_markers",
  name: "Blood Markers",
  description: "Definitions of blood markers with reference ranges",
  fields: [
    {
      key: "name",
      type: "text",
      displayName: "Marker Name",
      description: "Name of the blood marker",
      isSearchable: true,
    },
    {
      key: "unit",
      type: "text",
      displayName: "Unit",
      description: "Measurement unit (e.g., mg/dL, mmol/L)",
      isOptional: true,
    },
    {
      key: "lower_reference",
      type: "number",
      displayName: "Lower Reference",
      description: "Lower end of normal reference range",
      isOptional: true,
    },
    {
      key: "upper_reference",
      type: "number",
      displayName: "Upper Reference",
      description: "Upper end of normal reference range",
      isOptional: true,
    },
    {
      key: "general_reference",
      type: "text",
      displayName: "General Reference",
      description: "General reference range",
      isOptional: true,
    },
    {
      key: "description",
      type: "text",
      displayName: "Description",
      description: "Information about what this marker measures",
      isOptional: true,
    },
    {
      key: "category",
      type: "autocomplete",
      displayName: "Category",
      description: "Category of marker (e.g., Lipids, Metabolic, etc.)",
      isSearchable: true,
      secondaryDisplayField: "unit",
      secondaryDisplayFieldType: "text",
    },
    {
      key: "optimal_low",
      type: "number",
      displayName: "Optimal Low",
      description: "Lower end of optimal range (may differ from reference)",
      isOptional: true,
    },
    {
      key: "optimal_high",
      type: "number",
      displayName: "Optimal High",
      description: "Upper end of optimal range (may differ from reference)",
      isOptional: true,
    },
    {
      key: "optimal_general",
      type: "text",
      displayName: "Optimal General",
      description: "General optimal range (may differ from reference)",
      isOptional: true,
    },
  ],
};

export const BLOOD_RESULTS_FIELD_DEFINITIONS: FieldDefinitionsDataset = {
  id: "blood_results",
  name: "Blood Results",
  description: "Individual blood marker results for tests",
  fields: [
    createRelationField(
      "blood_test_id",
      "Test ID",
      DATASET_REFERENCES.BLOODWORK,
      {
        description: "ID of the related blood test",
        deleteBehavior: "cascadeDeleteIfReferenced",
        displayField: "date",
        displayFieldType: "date",
      }
    ),
    createRelationField(
      "blood_marker_id",
      "Marker ID",
      DATASET_REFERENCES.BLOOD_MARKERS,
      {
        description: "ID of the related blood marker",
        deleteBehavior: "preventDeleteIfReferenced",
        displayField: "name",
        displayFieldType: "text",
        secondaryDisplayField: "unit",
        secondaryDisplayFieldType: "text",
      }
    ),
    {
      key: "value_number",
      type: "number",
      displayName: "Value (Number)",
      description: "Measured number result value",
    },
    {
      key: "value_text",
      type: "text",
      displayName: "Value (Text)",
      description: "Measured text result value",
    },
    {
      key: "notes",
      type: "text",
      displayName: "Notes",
      description: "Additional notes for this result",
      isOptional: true,
    },
  ],
};
