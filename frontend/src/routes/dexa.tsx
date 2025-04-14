// src/routes/dexa.tsx
import { createFileRoute } from "@tanstack/react-router";
import DexaVisualization from "@/features/dexa/dexa-visualization";

export const Route = createFileRoute("/dexa")({
  component: DexaPage,
});

export default function DexaPage() {
  return <DexaVisualization datasetId="dexa" />;
}
