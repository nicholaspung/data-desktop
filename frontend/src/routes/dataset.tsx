import { DatasetConfig } from "@/components/data-page/data-page";
import { DatasetSelector } from "@/components/data-page/dataset-selector";
import { useFieldDefinitions } from "@/features/field-definitions/field-definitions-store";
import { createFileRoute, useSearch } from "@tanstack/react-router";
import {
  Activity,
  Beaker,
  ClipboardList,
  FileDiff,
  TagIcon,
} from "lucide-react";

interface DatasetSearchParams {
  datasetId?: string;
}

export const Route = createFileRoute("/dataset")({
  validateSearch: (search: Record<string, unknown>): DatasetSearchParams => {
    return {
      datasetId: search.datasetId as string | undefined,
    };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { getDatasetFields } = useFieldDefinitions();

  // Get query parameters from the URL
  const search = useSearch({ from: "/dataset" });
  const datasetIdFromUrl = search.datasetId;

  // Get field definitions
  const dexaFields = getDatasetFields("dexa");
  const bloodworkFields = getDatasetFields("bloodwork");
  const bloodMarkersFields = getDatasetFields("blood_markers");
  const bloodResultsFields = getDatasetFields("blood_results");
  const experimentFields = getDatasetFields("experiments");
  const experimentMetricFields = getDatasetFields("experiment_metrics");
  const metricFields = getDatasetFields("metrics");
  const dailyLogFields = getDatasetFields("daily_logs");
  const categoryFields = getDatasetFields("metric_categories");

  const datasets: DatasetConfig[] = [
    {
      id: "dexa",
      title: "DEXA Scans",
      description: "Track your DEXA scan results over time.",
      fields: dexaFields,
      addLabel: "Add DEXA Scan Results",
    },
    {
      id: "bloodwork",
      title: "Bloodwork",
      description:
        "Track and analyze your blood test results over time. Monitor important biomarkers and track your progress towards optimal health.",
      fields: bloodworkFields,
      addLabel: "Add Bloodwork Results",
    },
    {
      id: "blood_markers",
      title: "Bloodwork Markers",
      description: "Define blood markers and their reference ranges",
      fields: bloodMarkersFields,
      addLabel: "Add Bloodwork Marker",
    },
    {
      id: "blood_results",
      title: "Bloodwork Results",
      description: "Individual test results for specific markers",
      fields: bloodResultsFields,
      addLabel: "Add Test Result",
    },
    {
      id: "daily_logs",
      title: "Daily Tracker",
      description:
        "Track your daily metrics and habits. Log your daily activities and monitor your progress towards your goals.",
      fields: dailyLogFields,
      icon: <Activity className="h-4 w-4" />,
      addLabel: "Add Daily Log",
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
      id: "experiment_metrics",
      title: "Experiment Metrics",
      description: "Create and manage experiments metrics.",
      fields: experimentMetricFields,
      icon: <FileDiff className="h-4 w-4" />,
      addLabel: "Create Experiment Metric",
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
      defaultDatasetId={datasetIdFromUrl || "dexa"}
      title="Select Dataset"
    />
  );
}
