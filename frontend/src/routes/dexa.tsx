// src/routes/dexa.tsx
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useFieldDefinitions } from "@/features/field-definitions/field-definitions-store";
import { BarChart } from "lucide-react";
import DexaVisualization from "@/features/dexa/dexa-visualization";
import GenericDataPage from "@/components/data-page/generic-data-page";

export const Route = createFileRoute("/dexa")({
  component: DexaPage,
});

export default function DexaPage() {
  const { getDatasetFields } = useFieldDefinitions();
  const dexaFields = getDatasetFields("dexa");
  const [refreshKey, setRefreshKey] = useState(0);

  // Function to refresh data when changes are made
  const handleDataChange = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <GenericDataPage
      datasetId="dexa"
      fields={dexaFields}
      title="DEXA Scans"
      description="Track and visualize your DEXA scan results over time."
      addLabel="Add DEXA Scan"
      defaultTab="visualization"
      onDataChange={handleDataChange}
      customTabs={[
        {
          id: "visualization",
          label: "Visualization",
          icon: <BarChart className="h-4 w-4" />,
          content: (
            <DexaVisualization key={`viz-${refreshKey}`} datasetId="dexa" />
          ),
          position: "before",
        },
      ]}
    />
  );
}
