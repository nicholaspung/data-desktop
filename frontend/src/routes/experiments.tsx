// src/routes/experiments.tsx
import { createFileRoute } from "@tanstack/react-router";
import { useFieldDefinitions } from "@/features/field-definitions/field-definitions-store";
import {
  DatasetConfig,
  DatasetSelector,
} from "@/components/data-page/dataset-selector";
import {
  Activity,
  Beaker,
  ClipboardList,
  ListChecks,
  TagIcon,
} from "lucide-react";
import DailyTrackerView from "@/features/experiments/daily-tracker-view";

export const Route = createFileRoute("/experiments")({
  component: ExperimentsPage,
});

export default function ExperimentsPage() {
  const { getDatasetFields } = useFieldDefinitions();

  // Get field definitions
  const experimentFields = getDatasetFields("experiments");
  const metricFields = getDatasetFields("metrics");
  const dailyLogFields = getDatasetFields("daily_logs");
  const categoryFields = getDatasetFields("metric_categories");

  const datasets: DatasetConfig[] = [
    {
      id: "daily_logs",
      title: "Daily Tracker",
      description:
        "Track your daily metrics and habits. Log your daily activities and monitor your progress towards your goals.",
      fields: dailyLogFields,
      icon: <Activity className="h-4 w-4" />,
      addLabel: "Add Daily Log",
      defaultTab: "tracker",
      disableBatchEntry: true,
      customTabs: [
        {
          id: "tracker",
          label: "Daily Tracker",
          icon: <ListChecks className="h-4 w-4" />,
          content: <DailyTrackerView />,
          position: "before",
        },
      ],
    },
    {
      id: "experiments",
      title: "Experiments",
      description:
        "Create and manage experiments with specific goals and metrics to track.",
      fields: experimentFields,
      icon: <Beaker className="h-4 w-4" />,
      addLabel: "Create Experiment",
    },
    {
      id: "metrics",
      title: "Metrics",
      description:
        "Define metrics and habits to track in your daily logs and experiments.",
      fields: metricFields,
      icon: <ClipboardList className="h-4 w-4" />,
      addLabel: "Add Metric",
    },
    {
      id: "metric_categories",
      title: "Categories",
      description: "Create categories to organize your metrics and habits.",
      fields: categoryFields,
      icon: <TagIcon className="h-4 w-4" />,
      addLabel: "Add Category",
    },
  ];

  return (
    <DatasetSelector
      datasets={datasets}
      defaultDatasetId="daily_logs"
      title="Experiment & Habit Tracking"
    />
  );
}
