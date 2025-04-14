import DailyTrackerCalendarView from "@/features/daily-tracker/daily-tracker-calendar-view";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/calendar")({
  component: RouteComponent,
});

function RouteComponent() {
  return <DailyTrackerCalendarView />;
}
