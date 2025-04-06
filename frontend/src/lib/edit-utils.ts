import { FieldDefinition } from "@/types/types";

export const generateOptionsForLoadRelationOptions = (
  records: Record<string, any>[],
  field: FieldDefinition
) =>
  records.map((record: any) => {
    let label = "";

    if (field.displayField && record[field.displayField] !== undefined) {
      label = record[field.displayField] || "";

      // Add secondary field if available
      if (
        field.secondaryDisplayField &&
        record[field.secondaryDisplayField] !== undefined &&
        record[field.secondaryDisplayField] !== ""
      ) {
        label += ` - ${record[field.secondaryDisplayField]}`;
      }
    }
    // Generic fallback
    else {
      label = record.name || record.title || `ID: ${record.id}`;
    }

    return {
      id: record.id,
      label,
    };
  });
