import { FieldDefinition } from "@/types/types";

// Helper function to check if form has meaningful data
export const hasNonEmptyValues = (
  values: Record<string, any>,
  fields: FieldDefinition[]
) => {
  // Check each field to see if it's been modified from default
  for (const field of fields) {
    const value = values[field.key];

    switch (field.type) {
      case "text":
        if (value && value.trim() !== "") return true;
        break;
      case "number":
      case "percentage":
        // If the value is significantly different from 0, it's been changed
        if (value !== 0 && value !== null && value !== undefined) return true;
        break;
      case "boolean":
        // If boolean is true, it's been changed from default false
        if (value === true) return true;
        break;
      case "date":
        // Skip date fields for determining meaningful changes
        break;
    }
  }

  return false;
};

// Utility function to create fresh default values
export const createFreshDefaultValues = (fields: FieldDefinition[]) => {
  const freshDefaults: Record<string, any> = {};

  // Set initial values for each field type
  fields.forEach((field) => {
    switch (field.type) {
      case "date":
        freshDefaults[field.key] = new Date();
        break;
      case "boolean":
        freshDefaults[field.key] = false;
        break;
      case "number":
      case "percentage":
        freshDefaults[field.key] = 0;
        break;
      case "text":
        freshDefaults[field.key] = "";
        break;
    }
  });

  return freshDefaults;
};

// Group fields by type for consistent organization
export const getFieldsByType = (fields: FieldDefinition[]) => ({
  date: fields.filter((field) => field.type === "date"),
  boolean: fields.filter((field) => field.type === "boolean"),
  numeric: fields.filter(
    (field) => field.type === "number" || field.type === "percentage"
  ),
  text: fields.filter((field) => field.type === "text"),
});
