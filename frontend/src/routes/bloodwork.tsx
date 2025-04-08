// src/routes/bloodwork.tsx
import { createFileRoute } from "@tanstack/react-router";
import { useFieldDefinitions } from "@/features/field-definitions/field-definitions-store";
import {
  DatasetConfig,
  DatasetSelector,
} from "@/components/data-page/dataset-selector";
import { CSVImportProcessor } from "@/components/data-table/csv-import-processor";
import { Import, LineChart } from "lucide-react";
import BloodworkVisualizations from "@/features/bloodwork/bloodwork-visualization";

export const Route = createFileRoute("/bloodwork")({
  component: BloodworkPage,
});

export default function BloodworkPage() {
  const { getDatasetFields } = useFieldDefinitions();

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
      defaultTab: "visualizations",
      customTabs: [
        {
          id: "batch_import",
          label: "Batch Import",
          icon: <Import className="h-4 w-4" />,
          content: (
            <CSVImportProcessor
              datasetId="bloodwork"
              fields={bloodworkFields}
              title="Bloodwork Tests"
              chunkSize={100}
            />
          ),
          position: "after",
        },
        {
          id: "visualizations",
          label: "Visualizations",
          icon: <LineChart className="h-4 w-4" />,
          content: <BloodworkVisualizations />,
          position: "before",
        },
      ],
    },
    {
      id: "blood_markers", // Fixed ID to match backend
      title: "Bloodwork Markers",
      description: "Define blood markers and their reference ranges",
      fields: bloodMarkersFields,
      addLabel: "Add Bloodwork Marker",
      customTabs: [
        {
          id: "batch_import",
          label: "Batch Import",
          icon: <Import className="h-4 w-4" />,
          content: (
            <CSVImportProcessor
              datasetId="blood_markers"
              fields={bloodMarkersFields}
              title="Blood Markers"
              chunkSize={100}
            />
          ),
          position: "after",
        },
      ],
    },
    {
      id: "blood_results",
      title: "Bloodwork Results",
      description: "Individual test results for specific markers",
      fields: bloodResultsFields,
      addLabel: "Add Test Result",
      customTabs: [
        {
          id: "batch_import",
          label: "Batch Import",
          icon: <Import className="h-4 w-4" />,
          content: (
            <CSVImportProcessor
              datasetId="blood_results"
              fields={bloodResultsFields}
              title="Blood Results"
              chunkSize={100}
            />
          ),
          position: "after",
        },
      ],
    },
  ];

  return (
    <DatasetSelector
      datasets={datasets}
      defaultDatasetId="bloodwork"
      title="Select Category"
    />
  );
}
