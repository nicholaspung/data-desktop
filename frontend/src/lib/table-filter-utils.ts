import { FieldDefinition } from "@/types/types";
import { FilterFn } from "@tanstack/react-table";

export const relationFilter: FilterFn<any> = (row, columnId, filterValue) => {
  const value = row.getValue(columnId) as string;

  if (!filterValue || filterValue === "") return true;

  const relatedDataKey = `${columnId}_data`;
  const relatedData = row.original[relatedDataKey];

  if (relatedData) {
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

    for (const field of possibleFields) {
      if (relatedData[field]) {
        const fieldValue = relatedData[field];
        const stringValue =
          typeof fieldValue === "string"
            ? fieldValue
            : fieldValue instanceof Date
              ? fieldValue.toLocaleDateString()
              : String(fieldValue);

        if (
          stringValue.toLowerCase().includes(String(filterValue).toLowerCase())
        ) {
          return true;
        }
      }
    }

    return false;
  }

  return String(value)
    .toLowerCase()
    .includes(String(filterValue).toLowerCase());
};

export const textFilter: FilterFn<any> = (row, columnId, filterValue) => {
  const value = row.getValue(columnId);

  if (value === null || value === undefined) return false;

  return String(value)
    .toLowerCase()
    .includes(String(filterValue).toLowerCase());
};

export const getFilterFunctionForField = (
  field: FieldDefinition
): FilterFn<any> => {
  if (field.isRelation) {
    return relationFilter;
  }

  return textFilter;
};
