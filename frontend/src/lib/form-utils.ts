import { FieldDefinition } from "@/types/types";

export const hasNonEmptyValues = (
  values: Record<string, any>,
  fields: FieldDefinition[]
) => {
  for (const field of fields) {
    const value = values[field.key];

    switch (field.type) {
      case "text":
      case "markdown":
        if (value && value.trim() !== "") return true;
        break;
      case "number":
      case "percentage":
        if (value !== 0 && value !== null && value !== undefined) return true;
        break;
      case "boolean":
        if (value === true) return true;
        break;
      case "image":
        if (value && value !== "") return true;
        break;
      case "select-single":
        if (field.options && field.options.length > 0) {
          const defaultValue = field.options[0].id;
          if (value && value !== defaultValue) return true;
        } else if (value && value.trim() !== "") {
          return true;
        }
        break;
      case "select-multiple":
        if (Array.isArray(value) && value.length > 0) {
          return true;
        }
        break;
      case "date":
        break;
    }
  }

  return false;
};

export const createFreshDefaultValues = (fields: FieldDefinition[]) => {
  const freshDefaults: Record<string, any> = {};

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
      case "markdown":
        freshDefaults[field.key] = "";
        break;
      case "image":
        freshDefaults[field.key] = "";
        break;
      case "select-single":
        freshDefaults[field.key] =
          field.options && field.options.length > 0 ? field.options[0].id : "";
        break;
      case "select-multiple":
        freshDefaults[field.key] = [];
        break;
    }
  });

  return freshDefaults;
};
