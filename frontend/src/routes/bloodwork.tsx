// src/routes/bloodwork.tsx
import { createFileRoute } from "@tanstack/react-router";
import { useFieldDefinitions } from "@/features/field-definitions/field-definitions-store";
import {
  DatasetConfig,
  DatasetSelector,
} from "@/components/data-page/dataset-selector";

export const Route = createFileRoute("/bloodwork")({
  component: BloodworkPage,
});

export default function BloodworkPage() {
  const { getDatasetFields } = useFieldDefinitions();
  const bloodworkFields = getDatasetFields("bloodwork");
  const bloodmarkersFields = getDatasetFields("bloodmarkers");
  const bloodresultsFields = getDatasetFields("bloodresults");

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
      id: "bloodmarkers",
      title: "Bloodwork Markers",
      fields: bloodmarkersFields,
      addLabel: "Add Bloodwork Markers",
    },
    {
      id: "bloodresults",
      title: "Bloodwork Results",
      fields: bloodresultsFields,
      addLabel: "Add Bloodwork Results",
    },
  ];

  return (
    <div className="py-10">
      <h1 className="text-3xl font-bold mb-6">Bloodwork Tracking</h1>

      <DatasetSelector
        datasets={datasets}
        defaultDatasetId="bloodwork"
        title="Select Category"
      />
    </div>
  );
}
