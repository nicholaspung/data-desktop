// src/routes/bloodwork.tsx
import { createFileRoute } from "@tanstack/react-router";
import BloodworkVisualizations from "@/features/bloodwork/bloodwork-visualization";

export const Route = createFileRoute("/bloodwork")({
  component: BloodworkPage,
});

export default function BloodworkPage() {
  return <BloodworkVisualizations />;
}
