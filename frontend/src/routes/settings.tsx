// src/routes/settings.tsx
import { createFileRoute } from "@tanstack/react-router";
import { useStore } from "@tanstack/react-store";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  FeatureHeader,
  FeatureLayout,
} from "@/components/layout/feature-layout";
import { LayoutDashboard, Database } from "lucide-react";
import { InfoPanel } from "@/components/reusable/info-panel";
import settingsStore from "@/store/settings-store";
import { Separator } from "@/components/ui/separator";
import { useFieldDefinitions } from "@/features/field-definitions/field-definitions-store";
import { Button } from "@/components/ui/button";
import ReusableTabs from "@/components/reusable/reusable-tabs";
import ReusableCard from "@/components/reusable/reusable-card";
import { FEATURE_ICONS } from "@/lib/icons";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

// Define the dataset groups for better organization
const datasetGroups = {
  "Body Composition": ["dexa"],
  "Health Metrics": ["bloodwork", "blood_markers", "blood_results"],
  "Tracking & Habits": [
    "metrics",
    "daily_logs",
    "metric_categories",
    "experiments",
    "experiment_metrics",
  ],
  Journaling: [
    "gratitude_journal",
    "question_journal",
    "creativity_journal",
    "affirmation",
  ],
  "Time Management": ["time_entries", "time_categories"],
};

// Define routes with friendly names and icons
const routes = [
  {
    path: "/",
    name: "Dashboard",
    description: "Main application dashboard",
    icon: <FEATURE_ICONS.HOME className="h-4 w-4 mr-2" />,
  },
  {
    path: "/dexa",
    name: "DEXA Scans",
    description: "Track body composition from DEXA scans",
    icon: <FEATURE_ICONS.DEXA_SCAN className="h-4 w-4 mr-2" />,
  },
  {
    path: "/bloodwork",
    name: "Bloodwork",
    description: "Track blood test results and markers",
    icon: <FEATURE_ICONS.BLOODWORK className="h-4 w-4 mr-2" />,
  },
  {
    path: "/calendar",
    name: "Daily Tracker",
    description: "Track daily habits and metrics",
    icon: <FEATURE_ICONS.DAILY_TRACkER className="h-4 w-4 mr-2" />,
  },
  {
    path: "/experiments",
    name: "Experiments",
    description: "Create and manage self-experiments",
    icon: <FEATURE_ICONS.EXPERIMENTS className="h-4 w-4 mr-2" />,
  },
  {
    path: "/metric",
    name: "Quick Metric Logger",
    description: "Log metrics on-demand",
    icon: <FEATURE_ICONS.QUICK_METRIC_LOGGER className="h-4 w-4 mr-2" />,
  },
  {
    path: "/time-tracker",
    name: "Time Tracker",
    description: "Track how you spend your time",
    icon: <FEATURE_ICONS.TIME_TRACKER className="h-4 w-4 mr-2" />,
  },
  {
    path: "/journaling",
    name: "Journaling",
    description: "Journal thoughts, gratitude, and affirmations",
    icon: <FEATURE_ICONS.JOURNALING className="h-4 w-4 mr-2" />,
  },
  {
    path: "/metric-calendar",
    name: "Metric Calendar",
    description: "View metrics in calendar format",
    icon: <FEATURE_ICONS.METRIC_CALENDAR className="h-4 w-4 mr-2" />,
  },
  {
    path: "/time-planner",
    name: "Time Planner",
    description: "Plan your weekly schedule",
    icon: <FEATURE_ICONS.TIME_PLANNER className="h-4 w-4 mr-2" />,
  },
  {
    path: "/dataset",
    name: "Dataset Manager",
    description: "Manage application datasets",
    icon: <FEATURE_ICONS.DATASETS className="h-4 w-4 mr-2" />,
  },
  {
    path: "/settings",
    name: "Settings",
    description: "Application settings and configuration",
    icon: <FEATURE_ICONS.SETTINGS className="h-4 w-4 mr-2" />,
  },
];

function SettingsPage() {
  const visibleRoutes = useStore(settingsStore, (state) => state.visibleRoutes);
  const setVisibleRoute = useStore(
    settingsStore,
    (state) => state.setVisibleRoute
  );
  const enabledDatasets = useStore(
    settingsStore,
    (state) => state.enabledDatasets
  );
  const setEnabledDataset = useStore(
    settingsStore,
    (state) => state.setEnabledDataset
  );

  const { getAllDatasets } = useFieldDefinitions();
  const allDatasets = getAllDatasets();

  // Handle route visibility toggle
  const handleRouteToggle = (route: string, checked: boolean) => {
    setVisibleRoute(route, checked);
  };

  // Handle dataset enable/disable toggle
  const handleDatasetToggle = (dataset: string, checked: boolean) => {
    setEnabledDataset(dataset, checked);
  };

  // Reset all settings to defaults
  const handleResetSettings = () => {
    if (confirm("Are you sure you want to reset all settings to defaults?")) {
      localStorage.removeItem("app-settings");
      window.location.reload();
    }
  };

  // Navigation Settings Content
  const navigationContent = (
    <div className="space-y-4">
      {routes.map((route) => (
        <div key={route.path} className="flex items-center justify-between">
          <div className="flex flex-col">
            <Label
              htmlFor={`route-${route.path}`}
              className="flex items-center"
            >
              {route.icon}
              {route.name}
            </Label>
            <p className="text-sm text-muted-foreground ml-6">
              {route.description}
            </p>
          </div>
          <Switch
            id={`route-${route.path}`}
            checked={visibleRoutes[route.path] ?? true}
            onCheckedChange={(checked) =>
              handleRouteToggle(route.path, checked)
            }
            disabled={route.path === "/settings" || route.path === "/dataset"} // Can't disable settings page
          />
        </div>
      ))}
    </div>
  );

  // Datasets Settings Content
  const datasetsContent = (
    <div className="space-y-6">
      {Object.entries(datasetGroups).map(([group, datasetIds]) => (
        <div key={group} className="space-y-2">
          <h3 className="font-medium text-lg">{group}</h3>
          <Separator className="my-2" />
          <div className="space-y-4">
            {datasetIds.map((datasetId) => {
              // Find the dataset details
              const dataset = allDatasets.find((d) => d.id === datasetId) || {
                id: datasetId,
                name: datasetId
                  .replace(/_/g, " ")
                  .replace(/\b\w/g, (l) => l.toUpperCase()),
                description: "Dataset description",
              };

              return (
                <div
                  key={datasetId}
                  className="flex items-center justify-between"
                >
                  <div className="flex flex-col">
                    <Label
                      htmlFor={`dataset-${datasetId}`}
                      className="flex items-center"
                    >
                      {dataset.name}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {dataset.description || "No description available"}
                    </p>
                  </div>
                  <Switch
                    id={`dataset-${datasetId}`}
                    checked={enabledDatasets[datasetId] ?? false}
                    onCheckedChange={(checked) =>
                      handleDatasetToggle(datasetId, checked)
                    }
                  />
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <FeatureLayout
      header={
        <FeatureHeader
          title="Settings"
          description="Configure application settings and manage datasets"
          storageKey="settings-page"
        >
          <Button
            variant="destructive"
            onClick={handleResetSettings}
            className="mt-2"
          >
            Reset All Settings
          </Button>
        </FeatureHeader>
      }
    >
      <div className="space-y-6">
        <InfoPanel
          title="Settings Information"
          variant="info"
          storageKey="settings-info"
        >
          <p className="mb-2">
            Use this page to customize your application experience:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Enable or disable navigation items in the sidebar</li>
            <li>Manage which datasets are loaded in the application</li>
            <li>Configure default view preferences</li>
            <li>All settings are stored locally in your browser</li>
          </ul>
        </InfoPanel>

        <ReusableTabs
          tabs={[
            {
              id: "navigation",
              label: "Navigation",
              content: (
                <ReusableCard
                  title={
                    <div className="flex items-center gap-2">
                      <LayoutDashboard className="h-5 w-5" />
                      Navigation Visibility
                    </div>
                  }
                  description="Enable or disable navigation items in the sidebar"
                  content={navigationContent}
                />
              ),
            },
            {
              id: "datasets",
              label: "Datasets",
              content: (
                <ReusableCard
                  title={
                    <div className="flex items-center gap-2">
                      <Database className="h-5 w-5" />
                      Dataset Management
                    </div>
                  }
                  description="Enable or disable datasets in the application"
                  content={datasetsContent}
                />
              ),
            },
          ]}
          defaultTabId="navigation"
          className="w-full"
        />
      </div>
    </FeatureLayout>
  );
}
