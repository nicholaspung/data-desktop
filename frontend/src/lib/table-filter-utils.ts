// src/lib/table-filter-utils.ts
import { FieldDefinition } from "@/types/types";
import { FilterFn } from "@tanstack/react-table";

/**
 * Custom filter function for relation fields - looks at display values instead of just IDs
 */
export const relationFilter: FilterFn<any> = (row, columnId, filterValue) => {
  // Get the value from the row
  const value = row.getValue(columnId) as string;

  // If there's no filter value, return true to include the row
  if (!filterValue || filterValue === "") return true;

  // Check if we have a related data object
  const relatedDataKey = `${columnId}_data`;
  const relatedData = row.original[relatedDataKey];

  // If we have related data, search in relevant display fields
  if (relatedData) {
    // Get typical display fields to search in
    const possibleFields = [
      "name",
      "title",
      "displayName",
      "label",
      "date",
      "description",
      "code",
      "id",
    ];

    // Search in all the possible display fields
    for (const field of possibleFields) {
      if (relatedData[field]) {
        const fieldValue = relatedData[field];
        const stringValue =
          typeof fieldValue === "string"
            ? fieldValue
            : fieldValue instanceof Date
              ? fieldValue.toLocaleDateString()
              : String(fieldValue);

        // Case-insensitive search
        if (
          stringValue.toLowerCase().includes(String(filterValue).toLowerCase())
        ) {
          return true;
        }
      }
    }

    // Return false if no match found in the related data
    return false;
  }

  // If there's no related data, fall back to checking the value itself
  // (typically just the ID)
  return String(value)
    .toLowerCase()
    .includes(String(filterValue).toLowerCase());
};

/**
 * Default text filter - simple case-insensitive text search
 */
export const textFilter: FilterFn<any> = (row, columnId, filterValue) => {
  const value = row.getValue(columnId);

  // Handle null/undefined values
  if (value === null || value === undefined) return false;

  // Convert to string and do case-insensitive search
  return String(value)
    .toLowerCase()
    .includes(String(filterValue).toLowerCase());
};

/**
 * Get the appropriate filter function based on field definition
 */
export const getFilterFunctionForField = (
  field: FieldDefinition
): FilterFn<any> => {
  if (field.isRelation) {
    return relationFilter;
  }

  // Default to the text filter for other field types
  return textFilter;
};
