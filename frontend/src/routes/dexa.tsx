// src/routes/dexa.tsx
import { createFileRoute } from "@tanstack/react-router";
import DexaVisualization from "@/features/dexa/dexa-visualization";
import { InfoPanel } from "@/components/reusable/info-panel";

export const Route = createFileRoute("/dexa")({
  component: DexaPage,
});

export default function DexaPage() {
  return (
    <div className="space-y-6">
      <InfoPanel title="Getting Started with DEXA Scans" variant="info">
        DEXA scans provide detailed body composition data including: - Body fat
        percentage - Lean muscle mass - Bone density You can import your DEXA
        data using the CSV import feature, or manually enter values using the
        form.
      </InfoPanel>

      <DexaVisualization datasetId="dexa" />
    </div>
  );
}
