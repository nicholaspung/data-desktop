// src/components/data-page/dataset-selector.tsx
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import GenericDataPage from "@/components/data-page/generic-data-page";
import ReusableSelect from "../reusable/reusable-select";
import { DatasetConfig } from "./data-page";

export function DatasetSelector({
  datasets,
  defaultDatasetId,
  title = "Select Dataset",
}: {
  datasets: DatasetConfig[];
  defaultDatasetId?: string;
  title?: string;
}) {
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>(
    defaultDatasetId || (datasets.length > 0 ? datasets[0].id : "")
  );

  const selectedDataset = datasets.find((d) => d.id === selectedDatasetId);

  if (datasets.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            No datasets configured
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <ReusableSelect
            options={datasets}
            value={selectedDatasetId}
            onChange={setSelectedDatasetId}
            renderItem={(option) => (
              <div className="flex items-center gap-2">
                {option.icon}
                <span>{option.title}</span>
              </div>
            )}
            placeholder={"Select a dataset"}
            triggerClassName="w-full md:w-[300px]"
          />
        </CardContent>
      </Card>

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
