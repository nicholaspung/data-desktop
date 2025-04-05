// src/components/data-page/dataset-selector.tsx
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import GenericDataPage from "@/components/data-page/generic-data-page";
import { FieldDefinition } from "@/types";

export interface DatasetConfig {
  id: string;
  title: string;
  description?: string;
  fields: FieldDefinition[];
  icon?: React.ReactNode;
  addLabel?: string;
  customTabs?: any[]; // Using any for brevity, but you can define the full type from GenericDataPage
  disableBatchEntry?: boolean;
  disableTableView?: boolean;
  disableAddForm?: boolean;
  defaultTab?: string;
}

interface DatasetSelectorProps {
  datasets: DatasetConfig[];
  defaultDatasetId?: string;
  title?: string;
}

export function DatasetSelector({
  datasets,
  defaultDatasetId,
  title = "Select Dataset",
}: DatasetSelectorProps) {
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
          <Select
            value={selectedDatasetId}
            onValueChange={setSelectedDatasetId}
          >
            <SelectTrigger className="w-full md:w-[300px]">
              <SelectValue placeholder="Select a dataset" />
            </SelectTrigger>
            <SelectContent>
              {datasets.map((dataset) => (
                <SelectItem key={dataset.id} value={dataset.id}>
                  <div className="flex items-center gap-2">
                    {dataset.icon}
                    <span>{dataset.title}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
