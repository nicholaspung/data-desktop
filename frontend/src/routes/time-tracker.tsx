// src/routes/time-tracker.tsx
import { createFileRoute } from "@tanstack/react-router";
import TimeTracker from "@/features/time-tracker/time-tracker";

export const Route = createFileRoute("/time-tracker")({
  component: TimeTrackerPage,
});

function TimeTrackerPage() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Time Tracker</h1>
      <TimeTracker />
    </div>
  );
}
