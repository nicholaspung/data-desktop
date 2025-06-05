import { FieldDefinitionsDataset } from "@/types/types";

export const BODY_MEASUREMENTS_FIELD_DEFINITIONS: FieldDefinitionsDataset = {
  id: "body_measurements",
  name: "Body Measurements",
  description: "Body measurements tracking for physical progress monitoring",
  fields: [
    {
      key: "date",
      type: "date",
      displayName: "Date",
      description: "Date of the measurement",
      isSearchable: true,
    },
    {
      key: "time",
      type: "text",
      displayName: "Time",
      description: "Time of day when measurement was taken (optional)",
      isSearchable: false,
      isOptional: true,
    },
    {
      key: "measurement",
      type: "autocomplete",
      displayName: "Measurement",
      description: "Type of measurement (e.g., weight, waist, chest, etc.)",
      isSearchable: true,
    },
    {
      key: "value",
      type: "number",
      displayName: "Value",
      description: "Numerical value of the measurement",
    },
    {
      key: "unit",
      type: "autocomplete",
      displayName: "Unit",
      description: "Unit of measurement (e.g., lbs, kg, inches, cm)",
      isSearchable: true,
    },
    {
      key: "private",
      type: "boolean",
      displayName: "Private",
      description: "Mark this measurement as private (requires PIN to view)",
      isOptional: true,
    },
  ],
};