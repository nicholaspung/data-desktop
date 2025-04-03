// src/routes/habits.tsx
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useFieldDefinitions } from "@/features/field-definitions/field-definitions-store";
import { BarChart, Calendar } from "lucide-react";
import GenericDataPage from "@/components/data-page/generic-data-page";
import HabitCalendarView from "@/features/habits/habit-calendar-view";
import HabitStreaksView from "@/features/habits/habit-streaks-view";

export const Route = createFileRoute("/habits")({
  component: HabitsPage,
});

export default function HabitsPage() {
  const { getDatasetFields } = useFieldDefinitions();
  const habitFields = getDatasetFields("habit") || []; // Handle potential undefined
  const [refreshKey, setRefreshKey] = useState(0);

  // Function to refresh data when changes are made
  const handleDataChange = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <GenericDataPage
      datasetId="habits"
      fields={habitFields}
      title="Habit Tracker"
      description="Track your daily habits and build consistency over time."
      addLabel="Add Habit Entry"
      defaultTab="calendar"
      onDataChange={handleDataChange}
      // This page has different requirements - we don't need the table view, just custom views
      disableTableView={true}
      disableBatchEntry={true}
      customTabs={[
        {
          id: "calendar",
          label: "Calendar View",
          icon: <Calendar className="h-4 w-4" />,
          content: <HabitCalendarView key={`calendar-${refreshKey}`} />,
          position: "before",
        },
        {
          id: "streaks",
          label: "Streaks & Stats",
          icon: <BarChart className="h-4 w-4" />,
          content: <HabitStreaksView key={`streaks-${refreshKey}`} />,
          position: "before",
        },
      ]}
    />
  );
}
