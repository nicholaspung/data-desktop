// src/pages/bloodwork.tsx
import { createFileRoute } from "@tanstack/react-router";
import { useFieldDefinitions } from "@/features/field-definitions/field-definitions-store";
import GenericDataPage from "@/components/data-page/generic-data-page";

export const Route = createFileRoute("/bloodwork")({
  component: BloodworkPage,
});

function BloodworkPage() {
  const { getDatasetFields } = useFieldDefinitions();
  const bloodworkFields = getDatasetFields("bloodwork");

  return (
    <GenericDataPage
      datasetId="bloodwork"
      fields={bloodworkFields}
      title="Bloodwork Tracking"
      description="Track and analyze your blood test results over time. Monitor important biomarkers and track your progress towards optimal health."
      addLabel="Add Bloodwork Results"
    />
  );
}
