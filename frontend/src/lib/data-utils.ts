import { ApiService } from "@/services/api";
import { DataStoreName } from "@/store/data-store";
import { FieldDefinition } from "@/types/types";

export const getProcessedRecords = async (
  datasetId: DataStoreName,
  fields: FieldDefinition[],
  fetchRelations: boolean = true
) => {
  const records = fetchRelations 
    ? await ApiService.getRecordsWithRelations(datasetId)
    : await ApiService.getRecords(datasetId);

  const sortedRecords = [...records].sort(
    (a, b) =>
      new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime()
  );

  const processedRecords = sortedRecords.map((record) => {
    const processed = { ...record };

    fields.forEach((field) => {
      if (field.type === "date" && processed[field.key]) {
        processed[field.key] = new Date(processed[field.key]);
      }
    });
    return processed;
  });
  return processedRecords;
};
