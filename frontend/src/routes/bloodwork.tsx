// src/routes/bloodwork.tsx
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useFieldDefinitions } from "@/features/field-definitions/field-definitions-store";
import {
  DatasetConfig,
  DatasetSelector,
} from "@/components/data-page/dataset-selector";
import { CSVImportProcessor } from "@/components/data-table/csv-import-processor";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Database, Upload } from "lucide-react";

export const Route = createFileRoute("/bloodwork")({
  component: BloodworkPage,
});

export default function BloodworkPage() {
  const { getDatasetFields } = useFieldDefinitions();
  const [activeTab, setActiveTab] = useState<string>("datasets");

  // Get field definitions
  const bloodworkFields = getDatasetFields("bloodwork");
  const bloodMarkersFields = getDatasetFields("blood_markers");
  const bloodResultsFields = getDatasetFields("blood_results");

  const datasets: DatasetConfig[] = [
    {
      id: "bloodwork",
      title: "Bloodwork",
      description:
        "Track and analyze your blood test results over time. Monitor important biomarkers and track your progress towards optimal health.",
      fields: bloodworkFields,
      addLabel: "Add Bloodwork Results",
    },
    {
      id: "blood_markers", // Fixed ID to match backend
      title: "Bloodwork Markers",
      description: "Define blood markers and their reference ranges",
      fields: bloodMarkersFields,
      addLabel: "Add Bloodwork Marker",
    },
    {
      id: "blood_results",
      title: "Bloodwork Results",
      description: "Individual test results for specific markers",
      fields: bloodResultsFields,
      addLabel: "Add Test Result",
    },
  ];

  return (
    <div className="py-6">
      <h1 className="text-3xl font-bold mb-6">Bloodwork Tracking</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="datasets" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Datasets
          </TabsTrigger>
          <TabsTrigger value="import" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Bulk Import
          </TabsTrigger>
        </TabsList>

        <TabsContent value="datasets" className="mt-6">
          <DatasetSelector
            datasets={datasets}
            defaultDatasetId="bloodwork"
            title="Select Category"
          />
        </TabsContent>

        <TabsContent value="import" className="mt-6 space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* CSV importer for bloodwork */}
            <CSVImportProcessor
              datasetId="bloodwork"
              fields={bloodworkFields}
              title="Bloodwork Tests"
              chunkSize={100}
            />

            {/* CSV importer for blood markers */}
            <CSVImportProcessor
              datasetId="blood_markers"
              fields={bloodMarkersFields}
              title="Blood Markers"
              chunkSize={100}
            />

            {/* CSV importer for bloodwork test results */}
            <CSVImportProcessor
              datasetId="blood_results"
              fields={bloodResultsFields}
              title="Blood Results"
              chunkSize={100}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
