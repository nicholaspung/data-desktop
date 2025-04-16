import QuickMetricLogger from "@/features/daily-tracker/quick-metric-logger";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/metric")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <>
      <QuickMetricLogger />
    </>
  );
}
