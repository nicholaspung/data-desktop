// src/components/data-page/dataset-selector.tsx
import { useState, useEffect } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { DatasetConfig } from "./data-page";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useStore } from "@tanstack/react-store";
import settingsStore from "@/store/settings-store";
import GenericDataPage from "./generic-data-page";

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

  const selectedDataset = datasets.find(
    (dataset) => dataset.id === selectedDatasetId
  );

  // Update selected dataset when URL changes
  useEffect(() => {
    if (search.datasetId) {
      setSelectedDatasetId(search.datasetId);
    }
  }, [search.datasetId]);

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

  // Render the dataset selector
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">{title}</h1>

      <Tabs defaultValue="cards" className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="cards">Cards</TabsTrigger>
            <TabsTrigger value="table">Table</TabsTrigger>
          </TabsList>
        </div>

        <div className="border rounded-md p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDatasets.map((dataset) => (
              <Button
                key={dataset.id}
                variant={
                  selectedDatasetId === dataset.id ? "default" : "outline"
                }
                className="h-auto py-4 flex flex-col items-start justify-start"
                onClick={() => handleDatasetChange(dataset.id)}
              >
                <div className="flex items-center mb-2 w-full">
                  {dataset.icon && <div className="mr-2">{dataset.icon}</div>}
                  <span className="font-medium">{dataset.title}</span>
                </div>
                {dataset.description && (
                  <p className="text-sm text-muted-foreground text-left">
                    {dataset.description}
                  </p>
                )}
              </Button>
            ))}
          </div>
        </div>
      </Tabs>

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
