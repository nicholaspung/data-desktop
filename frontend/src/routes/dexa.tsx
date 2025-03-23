// src/pages/dexa.tsx
import { createFileRoute } from "@tanstack/react-router";
import { useFieldDefinitions } from "@/features/field-definitions/field-definitions-store";
import GenericDataPage from "@/components/data-page/generic-data-page";

export const Route = createFileRoute("/dexa")({
  component: DexaPage,
});

function DexaPage() {
  const { getDatasetFields } = useFieldDefinitions();
  const dexaFields = getDatasetFields("dexa");

  return (
    <GenericDataPage
      datasetId="dexa"
      fields={dexaFields}
      title="DEXA Scan Tracking"
      description="Track and visualize your DEXA scan results over time. Import your scan data using CSV files or add individual records manually."
      addLabel="Add DEXA Scan"
    />
  );
}
