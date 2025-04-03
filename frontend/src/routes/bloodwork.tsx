// src/routes/bloodwork.tsx
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useFieldDefinitions } from "@/features/field-definitions/field-definitions-store";
import { HeartPulse } from "lucide-react";
import GenericDataPage from "@/components/data-page/generic-data-page";
import BloodworkVisualization from "@/features/bloodwork/bloodwork-visualization";

export const Route = createFileRoute("/bloodwork")({
  component: BloodworkPage,
});

export default function BloodworkPage() {
  const { getDatasetFields } = useFieldDefinitions();
  const bloodworkFields = getDatasetFields("bloodwork");
  const [refreshKey, setRefreshKey] = useState(0);

  // Function to refresh data when changes are made
  const handleDataChange = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <GenericDataPage
      datasetId="bloodwork"
      fields={bloodworkFields}
      title="Bloodwork"
      description="Track and analyze your blood test results over time. Monitor important biomarkers and track your progress towards optimal health."
      addLabel="Add Bloodwork Results"
      defaultTab="visualization"
      onDataChange={handleDataChange}
      customTabs={[
        {
          id: "visualization",
          label: "Visualization",
          icon: <HeartPulse className="h-4 w-4" />,
          content: <BloodworkVisualization key={`viz-${refreshKey}`} />,
          position: "before",
        },
      ]}
    />
  );
}
