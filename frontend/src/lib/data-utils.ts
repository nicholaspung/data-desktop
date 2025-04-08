import { ApiService } from "@/services/api";
import { DataStoreName } from "@/store/data-store";
import { FieldDefinition } from "@/types/types";

export const getProcessedRecords = async (
  datasetId: DataStoreName,
  fields: FieldDefinition[]
) => {
  // Use the appropriate API method
  const records = await ApiService.getRecordsWithRelations(datasetId);

  const sortedRecords = [...records].sort(
    (a, b) =>
      new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime()
  );

  // Process dates to ensure they're Date objects
  const processedRecords = sortedRecords.map((record) => {
    const processed = { ...record };

    // Convert dates
    fields.forEach((field) => {
      if (field.type === "date" && processed[field.key]) {
        processed[field.key] = new Date(processed[field.key]);
      }
    });
    return processed;
  });
  return processedRecords;
};
