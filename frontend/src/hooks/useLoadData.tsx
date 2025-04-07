import { getProcessedRecords } from "@/lib/data-utils";
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
      const processedRecords = getProcessedRecords(datasetId, fields);

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
