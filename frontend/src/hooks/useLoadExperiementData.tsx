// src/hooks/useLoadExperimentData.ts
import { useState, useEffect } from "react";
import { DataStoreName } from "@/store/data-store";
import { setLoadingState } from "@/store/loading-store";
import { getProcessedRecords } from "@/lib/data-utils";
import { FieldDefinition } from "@/types/types";
import { useFieldDefinitions } from "@/features/field-definitions/field-definitions-store";
import { toast } from "sonner";

interface UseLoadExperimentDataParams {
  // Option to load only certain datasets
  loadExperiments?: boolean;
  loadMetrics?: boolean;
  loadCategories?: boolean;
  loadDailyLogs?: boolean;
  loadExperimentMetrics?: boolean;
  // Callback when all data is loaded
  onDataLoaded?: () => void;
}

export default function useLoadExperimentData({
  loadExperiments = true,
  loadMetrics = true,
  loadCategories = true,
  loadDailyLogs = true,
  loadExperimentMetrics = true,
  onDataLoaded,
}: UseLoadExperimentDataParams = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { getDatasetFields } = useFieldDefinitions();

  // Function to load all experiment-related data
  const loadAllData = async () => {
    setIsLoading(true);
    setError(null);
    let hasError = false;

    try {
      // Define the datasets to load
      const datasetsToLoad: {
        datasetId: DataStoreName;
        fields: FieldDefinition[];
        load: boolean;
      }[] = [
        {
          datasetId: "experiments",
          fields: getDatasetFields("experiments"),
          load: loadExperiments,
        },
        {
          datasetId: "metrics",
          fields: getDatasetFields("metrics"),
          load: loadMetrics,
        },
        {
          datasetId: "metric_categories",
          fields: getDatasetFields("metric_categories"),
          load: loadCategories,
        },
        {
          datasetId: "daily_logs",
          fields: getDatasetFields("daily_logs"),
          load: loadDailyLogs,
        },
        {
          datasetId: "experiment_metrics",
          fields: getDatasetFields("experiment_metrics"),
          load: loadExperimentMetrics,
        },
      ];

      // Load each dataset in parallel
      await Promise.all(
        datasetsToLoad
          .filter((dataset) => dataset.load)
          .map(async ({ datasetId, fields }) => {
            try {
              setLoadingState(datasetId, true);
              const processedRecords = await getProcessedRecords(
                datasetId,
                fields
              );
              return { datasetId, processedRecords };
            } catch (err) {
              console.error(`Error loading ${datasetId}:`, err);
              hasError = true;
              return { datasetId, error: err };
            } finally {
              setLoadingState(datasetId, false);
            }
          })
      );

      if (hasError) {
        throw new Error("One or more datasets failed to load");
      }

      // Call callback if provided
      if (onDataLoaded) {
        onDataLoaded();
      }
    } catch (err) {
      console.error("Error loading experiment data:", err);
      setError(err instanceof Error ? err : new Error(String(err)));
      toast.error("Error loading experiment data");
    } finally {
      setIsLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    loadAllData();
  }, []);

  return {
    isLoading,
    error,
    reload: loadAllData,
  };
}
