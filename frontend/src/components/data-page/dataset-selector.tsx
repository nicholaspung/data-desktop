// src/components/data-page/dataset-selector.tsx
import { useState, useEffect } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { DatasetConfig } from "./data-page";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useStore } from "@tanstack/react-store";
import settingsStore from "@/store/settings-store";
import GenericDataPage from "./generic-data-page";
import ReusableSelect from "@/components/reusable/reusable-select";
import { Separator } from "../ui/separator";

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

  // Get enabled datasets from settings
  const enabledDatasets = useStore(
    settingsStore,
    (state) => state.enabledDatasets
  );

  // Filter datasets based on enabled datasets in settings
  const filteredDatasets = datasets.filter(
    (dataset) => enabledDatasets[dataset.id] !== false
  );

  // Format datasets for the select component
  const selectOptions = filteredDatasets.map((dataset) => ({
    id: dataset.id,
    label: dataset.title,
    description: dataset.description,
    icon: dataset.icon,
  }));

  const selectedDataset = datasets.find(
    (dataset) => dataset.id === selectedDatasetId
  );

  // Update selected dataset when URL changes
  useEffect(() => {
    if (search.datasetId) {
      setSelectedDatasetId(search.datasetId);
    }
  }, [search.datasetId]);

  // If selected dataset is no longer enabled, choose the first available
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

  // Handle dataset selection change
  const handleDatasetChange = (datasetId: string) => {
    setSelectedDatasetId(datasetId);
    navigate({
      to: "/dataset",
      search: {
        datasetId,
      },
    });
  };

  // If no datasets are available
  if (filteredDatasets.length === 0) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6">{title}</h1>
        <Card className="p-8 text-center">
          <h2 className="text-xl font-medium mb-2">No Datasets Available</h2>
          <p className="text-muted-foreground mb-4">
            There are no enabled datasets in the application.
          </p>
          <Button onClick={() => navigate({ to: "/settings" })}>
            Go to Settings
          </Button>
        </Card>
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
