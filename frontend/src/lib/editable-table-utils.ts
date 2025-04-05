// src/lib/editable-table-utils.ts
import { FieldDefinition, FieldType } from "@/types/types";
import { ApiService } from "@/services/api";
import { toast } from "sonner";

/**
 * Format a value according to its field type for display in tables
 * @param value The value to format
 * @param fieldType The type of the field
 * @param unit Optional unit for numerical values
 */
export const formatTableValue = (
  value: any,
  fieldType: FieldType,
  unit?: string
): string => {
  if (value === null || value === undefined) return "—";

  switch (fieldType) {
    case "date":
      return value instanceof Date
        ? value.toLocaleDateString()
        : new Date(value).toLocaleDateString();
    case "boolean":
      return value ? "Yes" : "No";
    case "number":
      return typeof value === "number"
        ? `${value.toLocaleString()}${unit ? ` ${unit}` : ""}`
        : String(value);
    case "percentage":
      return typeof value === "number"
        ? `${(value < 1 ? value * 100 : value).toLocaleString()}%`
        : String(value);
    case "text":
    default:
      return String(value);
  }
};

/**
 * Validate a value against its field definition
 * @param value The value to validate
 * @param field The field definition
 */
export const validateFieldValue = (
  value: any,
  field: FieldDefinition
): { isValid: boolean; message?: string } => {
  // Handle null/undefined checks
  if (value === null || value === undefined) {
    return { isValid: false, message: `${field.displayName} is required` };
  }

  switch (field.type) {
    case "number":
    case "percentage":
      if (typeof value !== "number") {
        return {
          isValid: false,
          message: `${field.displayName} must be a number`,
        };
      }
      if (value < 0) {
        return {
          isValid: false,
          message: `${field.displayName} must be positive`,
        };
      }
      if (field.type === "percentage" && value > 100) {
        return {
          isValid: false,
          message: `${field.displayName} cannot exceed 100%`,
        };
      }
      break;
    case "date":
      if (!(value instanceof Date) && isNaN(new Date(value).getTime())) {
        return {
          isValid: false,
          message: `${field.displayName} must be a valid date`,
        };
      }
      break;
    case "text":
      if (typeof value !== "string") {
        return {
          isValid: false,
          message: `${field.displayName} must be text`,
        };
      }
      break;
  }

  return { isValid: true };
};

/**
 * Parse a raw input value according to its field type
 * @param value The raw input value
 * @param fieldType The type of the field
 */
export const parseFieldValue = (value: any, fieldType: FieldType): any => {
  switch (fieldType) {
    case "number":
    case "percentage":
      // Handle empty string
      if (value === "" || value === null || value === undefined) {
        return 0;
      }
      return typeof value === "number" ? value : parseFloat(value);
    case "boolean":
      return Boolean(value);
    case "date":
      if (value instanceof Date) {
        return value;
      }
      if (typeof value === "string" || typeof value === "number") {
        return new Date(value);
      }
      return new Date();
    case "text":
      return String(value || "");
    default:
      return value;
  }
};

/**
 * Save an edited record to the backend
 * @param recordId The ID of the record to update
 * @param data The updated data
 * @param fields The field definitions for validation
 */
export const saveEditedRecord = async (
  recordId: string,
  data: Record<string, any>,
  fields: FieldDefinition[]
): Promise<boolean> => {
  // Validate all fields
  for (const field of fields) {
    const validation = validateFieldValue(data[field.key], field);
    if (!validation.isValid) {
      toast.error(validation.message);
      return false;
    }

    // Parse the value to ensure correct type
    data[field.key] = parseFieldValue(data[field.key], field.type);
  }

  try {
    await ApiService.updateRecord(recordId, data);
    toast.success("Record updated successfully");
    return true;
  } catch (error) {
    console.error("Error updating record:", error);
    toast.error("Failed to update record");
    return false;
  }
};
