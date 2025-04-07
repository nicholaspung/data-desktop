import { FieldDefinition } from "@/types/types";
import { getDisplayValue } from "./table-utils";

export const generateOptionsForLoadRelationOptions = (
  records: Record<string, any>[],
  field: FieldDefinition
) =>
  records.map((record: any) => {
    const label = getDisplayValue(field, record);

    return {
      id: record.id,
      label,
    };
  });
