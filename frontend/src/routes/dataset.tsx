import { DatasetConfig } from "@/components/data-page/data-page";
import { DatasetSelector } from "@/components/data-page/dataset-selector";
import { useFieldDefinitions } from "@/features/field-definitions/field-definitions-store";
import { createFileRoute, useSearch } from "@tanstack/react-router";
import {
  Activity,
  Beaker,
  ClipboardList,
  Clock,
  FileDiff,
  TagIcon,
  Tags,
} from "lucide-react";

interface DatasetSearchParams {
  datasetId?: string;
  mode?: string;
  page?: string;
  pageSize?: string;
  sortColumn?: string;
  sortDirection?: string;
  filterColumn?: string;
  filterValue?: string;
}

export const Route = createFileRoute("/dataset")({
  validateSearch: (search: Record<string, unknown>): DatasetSearchParams => ({
    datasetId: search.datasetId as string | undefined,

    // Add validation for table state parameters
    mode: search.mode as "view" | "edit" | "delete" | undefined,
    page: search.page ? (search.page as string) : undefined,
    pageSize: search.pageSize ? (search.pageSize as string) : undefined,
    sortColumn: search.sortColumn as string | undefined,
    sortDirection: search.sortDirection as "asc" | "desc" | undefined,
    filterColumn: search.filterColumn as string | undefined,
    filterValue: search.filterValue as string | undefined,
  }),
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
  const gratitudeJournalFields = getDatasetFields("gratitude_journal");
  const questionJournalFields = getDatasetFields("question_journal");
  const creativityJournalFields = getDatasetFields("creativity_journal");
  const affirmationFields = getDatasetFields("affirmation");
  const timeEntryFields = getDatasetFields("time_entries");
  const timeCategoryFields = getDatasetFields("time_categories");

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
    {
      id: "gratitude_journal",
      title: "Gratitude Journal",
      description: "Record things you are grateful for.",
      fields: gratitudeJournalFields,
      icon: <TagIcon className="h-4 w-4" />,
      addLabel: "Add Gratitude Journal Entry",
    },
    {
      id: "creativity_journal",
      title: "Creativity Journal",
      description: "Record your creative thoughts.",
      fields: creativityJournalFields,
      icon: <TagIcon className="h-4 w-4" />,
      addLabel: "Add Creativity Journal Entry",
    },
    {
      id: "question_journal",
      title: "Question Journal",
      description: "Record your answers to questions.",
      fields: questionJournalFields,
      icon: <TagIcon className="h-4 w-4" />,
      addLabel: "Add Question Journal Entry",
    },
    {
      id: "affirmation",
      title: "Affirmation",
      description: "Record your daily affirmations.",
      fields: affirmationFields,
      icon: <TagIcon className="h-4 w-4" />,
      addLabel: "Add Affirmation Entry",
    },
    {
      id: "time_entries",
      title: "Time Entries",
      description: "Track time spent on various activities",
      fields: timeEntryFields,
      icon: <Clock className="h-4 w-4" />,
      addLabel: "Add Time Entry",
    },
    {
      id: "time_categories",
      title: "Time Categories",
      description: "Categories for time tracking activities",
      fields: timeCategoryFields,
      icon: <Tags className="h-4 w-4" />,
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
