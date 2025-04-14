// src/routes/experiments.tsx
import ExperimentList from "@/features/experiments/experiment-list";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/experiments")({
  component: ExperimentsPage,
});

export default function ExperimentsPage() {
  return <ExperimentList />;
}
