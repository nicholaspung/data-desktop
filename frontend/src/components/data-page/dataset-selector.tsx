import { useState, useEffect } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { DatasetConfig } from "./data-page";
import { useStore } from "@tanstack/react-store";
import GenericDataPage from "./generic-data-page";
import ReusableSelect from "@/components/reusable/reusable-select";
import ReusableCard from "@/components/reusable/reusable-card";
import { Separator } from "../ui/separator";
import settingsStore from "@/store/settings-store";

export function DatasetSelector({
  datasets,
  defaultDatasetId,
  title = "Datasets",
}: {
  datasets: DatasetConfig[];
  defaultDatasetId?: string;
  title?: string;
}) {
  const navigate = useNavigate();
  const search = useSearch({ from: "/dataset" });
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>(
    search.datasetId || defaultDatasetId || ""
  );

  const enabledDatasets = useStore(
    settingsStore,
    (state) => state.enabledDatasets
  );

  const filteredDatasets = datasets.filter(
    (dataset) => enabledDatasets[dataset.id] !== false
  );

  const selectOptions = filteredDatasets.map((dataset) => ({
    id: dataset.id,
    label: dataset.title,
    description: dataset.description,
    icon: dataset.icon,
  }));

  const selectedDataset = datasets.find(
    (dataset) => dataset.id === selectedDatasetId
  );

  useEffect(() => {
    if (search.datasetId) {
      setSelectedDatasetId(search.datasetId);
    }
  }, [search.datasetId]);

  useEffect(() => {
    if (
      selectedDatasetId &&
      filteredDatasets.length > 0 &&
      !filteredDatasets.some((dataset) => dataset.id === selectedDatasetId)
    ) {
      handleDatasetChange(filteredDatasets[0].id);
    } else if (!selectedDatasetId && filteredDatasets.length > 0) {
      handleDatasetChange(filteredDatasets[0].id);
    }
  }, [selectedDatasetId, filteredDatasets]);

  const handleDatasetChange = (datasetId: string) => {
    setSelectedDatasetId(datasetId);
    navigate({
      to: "/dataset",
      search: {
        datasetId,
      },
    });
  };

  if (filteredDatasets.length === 0) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6">{title}</h1>
        <ReusableCard
          title="No Datasets Available"
          contentClassName="text-center"
          content={
            <p className="text-muted-foreground mb-4">
              There are no enabled datasets in the application.
            </p>
          }
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">{title}</h1>

      <div className="mb-8">
        <ReusableSelect
          options={selectOptions}
          value={selectedDatasetId}
          onChange={handleDatasetChange}
          placeholder="Select a dataset to view"
          triggerClassName="w-full"
          title="Dataset"
        />
      </div>

      <Separator className="mb-4" />

      {selectedDataset && (
        <GenericDataPage
          key={selectedDataset.id}
          datasetId={selectedDataset.id}
          fields={selectedDataset.fields}
          title={selectedDataset.title}
          description={selectedDataset.description}
          addLabel={selectedDataset.addLabel}
          customTabs={selectedDataset.customTabs}
          disableBatchEntry={selectedDataset.disableBatchEntry}
          disableTableView={selectedDataset.disableTableView}
          disableAddForm={selectedDataset.disableAddForm}
          defaultTab={selectedDataset.defaultTab}
        />
      )}
    </div>
  );
}
