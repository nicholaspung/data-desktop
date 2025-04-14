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
      case "select-single":
        // For select fields, check if a non-default option was selected
        // If it has options and the first option is not selected (assuming first is default)
        if (field.options && field.options.length > 0) {
          const defaultValue = field.options[0].id;
          if (value && value !== defaultValue) return true;
        }
        // If there's a value but no options defined (should be rare)
        else if (value && value.trim() !== "") {
          return true;
        }
        break;
      case "select-multiple":
        // For multi-select fields, check if the array has any items
        if (Array.isArray(value) && value.length > 0) {
          return true;
        }
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
      case "select-single":
        // For select, use the first option's value as default, or empty string if no options
        freshDefaults[field.key] =
          field.options && field.options.length > 0 ? field.options[0].id : "";
        break;
      case "select-multiple":
        // For select-multiple, always initialize with an empty array
        freshDefaults[field.key] = [];
        break;
    }
  });

  return freshDefaults;
};
