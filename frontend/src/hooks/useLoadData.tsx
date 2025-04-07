import { ApiService } from "@/services/api";
import { DataStoreName, loadState } from "@/store/data-store";
import { setLoadingState } from "@/store/loading-store";
import { FieldDefinition } from "@/types/types";
import { useEffect } from "react";
import { toast } from "sonner";

export default function useLoadData({
  fields,
  datasetId,
  title,
}: {
  fields: FieldDefinition[]; // Replace with actual type for fields
  datasetId: DataStoreName;
  title: string;
}) {
  // Load data when the component mounts
  useEffect(() => {
    loadData();
  }, [datasetId]);

  const loadData = async () => {
    setLoadingState(true, datasetId);
    try {
      // Check if this dataset has relation fields
      const hasRelations = fields.some((field) => field.isRelation);

      // Use the appropriate API method
      const records = hasRelations
        ? await ApiService.getRecordsWithRelations(datasetId)
        : await ApiService.getRecords(datasetId);

      // Process dates to ensure they're Date objects
      const processedRecords = records.map((record) => {
        const processed = { ...record };

        // Convert dates
        fields.forEach((field) => {
          if (field.type === "date" && processed[field.key]) {
            processed[field.key] = new Date(processed[field.key]);
          }
        });

        return processed;
      });

      loadState(processedRecords, datasetId);
    } catch (error) {
      console.error(`Error loading ${datasetId} data:`, error);
      toast.error(`Failed to load ${title} data`);
    } finally {
      setLoadingState(false, datasetId);
    }
  };

  return { loadData };
}
