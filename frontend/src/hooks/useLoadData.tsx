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
  fetchDataNow = false,
}: {
  fields: FieldDefinition[]; // Replace with actual type for fields
  datasetId: DataStoreName;
  title: string;
  fetchDataNow?: boolean;
}) {
  // Load data when the component mounts
  useEffect(() => {
    if (fetchDataNow) {
      loadData();
    }
  }, [datasetId]);

  const loadData = async () => {
    setLoadingState(datasetId, true);
    try {
      const processedRecords = await getProcessedRecords(datasetId, fields);

      loadState(processedRecords, datasetId);
    } catch (error) {
      console.error(`Error loading ${datasetId} data:`, error);
      toast.error(`Failed to load ${title} data`);
    } finally {
      setLoadingState(datasetId, false);
    }
  };

  return { loadData };
}
