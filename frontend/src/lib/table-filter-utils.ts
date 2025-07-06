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

export const allFieldsFilter: FilterFn<any> = (row, _, filterValue) => {
  if (!filterValue || filterValue === "") return true;
  
  const searchTerm = String(filterValue).toLowerCase();
  
  // Get all values from the row and search through them
  const rowValues = row.getAllCells();
  
  for (const cell of rowValues) {
    const column = cell.column;
    const fieldDef = column.columnDef.meta?.field as FieldDefinition;
    
    // Only search searchable fields
    if (!fieldDef?.isSearchable) continue;
    
    const value = cell.getValue();
    
    if (fieldDef?.isRelation) {
      // Use relation filter logic
      const relatedDataKey = `${column.id}_data`;
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
            
            if (stringValue.toLowerCase().includes(searchTerm)) {
              return true;
            }
          }
        }
      }
    } else {
      // Use text filter logic
      if (value !== null && value !== undefined) {
        const stringValue = String(value).toLowerCase();
        if (stringValue.includes(searchTerm)) {
          return true;
        }
      }
    }
  }
  
  return false;
};

export const getFilterFunctionForField = (
  field: FieldDefinition
): FilterFn<any> => {
  if (field.isRelation) {
    return relationFilter;
  }

  return textFilter;
};
