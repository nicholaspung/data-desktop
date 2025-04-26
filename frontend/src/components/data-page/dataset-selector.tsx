import { useState } from "react";
import GenericDataPage from "@/components/data-page/generic-data-page";
import ReusableSelect from "../reusable/reusable-select";
import { DatasetConfig } from "./data-page";
import ReusableCard from "../reusable/reusable-card";

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
      <ReusableCard
        showHeader={false}
        content={
          <p className="text-center text-muted-foreground pt-6">
            No datasets configured
          </p>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <ReusableCard
        title={title}
        content={
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
        }
      />
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
