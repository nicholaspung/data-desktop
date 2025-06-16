import { createFileRoute } from "@tanstack/react-router";
import { useStore } from "@tanstack/react-store";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  FeatureHeader,
  FeatureLayout,
} from "@/components/layout/feature-layout";
import { LayoutDashboard, ChevronUp, ChevronDown } from "lucide-react";
import { InfoPanel } from "@/components/reusable/info-panel";
import settingsStore from "@/store/settings-store";
import { Button } from "@/components/ui/button";
import ReusableCard from "@/components/reusable/reusable-card";
import { FEATURE_ICONS } from "@/lib/icons";
import { useMemo } from "react";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

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
    path: "/todos",
    name: "Todos",
    description: "Tasks with deadlines and progress tracking",
    icon: <FEATURE_ICONS.TODOS className="h-4 w-4 mr-2" />,
  },
  {
    path: "/people-crm",
    name: "People CRM",
    description: "Manage your contacts and relationships",
    icon: <FEATURE_ICONS.PEOPLE_CRM className="h-4 w-4 mr-2" />,
  },
  {
    path: "/body-measurements",
    name: "Body Measurements",
    description: "Track body measurements and physical progress",
    icon: <FEATURE_ICONS.BODY_MEASUREMENTS className="h-4 w-4 mr-2" />,
  },
  {
    path: "/wealth",
    name: "Wealth",
    description: "Track finances, income, expenses, and financial documents",
    icon: <FEATURE_ICONS.WEALTH className="h-4 w-4 mr-2" />,
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
  const routeConfigs = useStore(settingsStore, (state) => state.routeConfigs);
  const setVisibleRoute = useStore(
    settingsStore,
    (state) => state.setVisibleRoute
  );

  const orderedRoutes = useMemo(() => {
    return routes
      .filter(
        (route) =>
          route.path !== "/" &&
          route.path !== "/dataset" &&
          route.path !== "/settings"
      )
      .map((route) => ({
        ...route,
        config: routeConfigs[route.path] || {
          href: route.path,
          order: 999,
          visible: true,
        },
      }))
      .sort((a, b) => a.config.order - b.config.order);
  }, [routeConfigs]);

  const handleRouteToggle = (route: string, checked: boolean) => {
    setVisibleRoute(route, checked);
  };

  const handleMoveUp = (currentIndex: number) => {
    if (currentIndex > 0) {
      const currentRoute = orderedRoutes[currentIndex];
      const targetRoute = orderedRoutes[currentIndex - 1];

      settingsStore.setState((state) => {
        const newConfigs = { ...state.routeConfigs };
        const currentOrder = currentRoute.config.order;
        const targetOrder = targetRoute.config.order;

        newConfigs[currentRoute.path] = {
          ...currentRoute.config,
          order: targetOrder,
        };
        newConfigs[targetRoute.path] = {
          ...targetRoute.config,
          order: currentOrder,
        };

        const newState = { ...state, routeConfigs: newConfigs };

        try {
          localStorage.setItem(
            "app-settings",
            JSON.stringify({
              visibleRoutes: newState.visibleRoutes,
              routeConfigs: newState.routeConfigs,
              defaultDatasetView: newState.defaultDatasetView,
              enabledDatasets: newState.enabledDatasets,
              dashboardSummaryConfigs: newState.dashboardSummaryConfigs,
            })
          );
        } catch (error) {
          console.error("Failed to save settings to localStorage:", error);
        }
        return newState;
      });
    }
  };

  const handleMoveDown = (currentIndex: number) => {
    if (currentIndex < orderedRoutes.length - 1) {
      const currentRoute = orderedRoutes[currentIndex];
      const targetRoute = orderedRoutes[currentIndex + 1];

      settingsStore.setState((state) => {
        const newConfigs = { ...state.routeConfigs };
        const currentOrder = currentRoute.config.order;
        const targetOrder = targetRoute.config.order;

        newConfigs[currentRoute.path] = {
          ...currentRoute.config,
          order: targetOrder,
        };
        newConfigs[targetRoute.path] = {
          ...targetRoute.config,
          order: currentOrder,
        };

        const newState = { ...state, routeConfigs: newConfigs };

        try {
          localStorage.setItem(
            "app-settings",
            JSON.stringify({
              visibleRoutes: newState.visibleRoutes,
              routeConfigs: newState.routeConfigs,
              defaultDatasetView: newState.defaultDatasetView,
              enabledDatasets: newState.enabledDatasets,
              dashboardSummaryConfigs: newState.dashboardSummaryConfigs,
            })
          );
        } catch (error) {
          console.error("Failed to save settings to localStorage:", error);
        }
        return newState;
      });
    }
  };

  const handleResetSettings = () => {
    if (confirm("Are you sure you want to reset all settings to defaults?")) {
      localStorage.removeItem("app-settings");
      window.location.reload();
    }
  };

  const navigationContent = (
    <div className="space-y-4">
      {orderedRoutes.map((route, index) => (
        <div
          key={route.path}
          className="flex items-center justify-between gap-4 p-2 border rounded-lg"
        >
          <div className="flex flex-col">
            <Label
              htmlFor={`route-${route.path}`}
              className="flex items-center cursor-pointer"
            >
              {route.icon}
              {route.name}
            </Label>
            <p className="text-sm text-muted-foreground ml-6">
              {route.description}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex flex-col gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => handleMoveUp(index)}
                disabled={index === 0}
                title="Move up"
              >
                <ChevronUp className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => handleMoveDown(index)}
                disabled={index === orderedRoutes.length - 1}
                title="Move down"
              >
                <ChevronDown className="h-3 w-3" />
              </Button>
            </div>
            <Switch
              id={`route-${route.path}`}
              checked={visibleRoutes[route.path] ?? true}
              onCheckedChange={(checked) =>
                handleRouteToggle(route.path, checked)
              }
            />
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
            <li>Reorder navigation items using the up/down arrows</li>
            <li>Enable or disable navigation items in the sidebar</li>
            <li>Dashboard, Datasets, and Settings are always available</li>
            <li>Manage which datasets are loaded in the application</li>
            <li>Configure default view preferences</li>
            <li>All settings are stored locally in your browser</li>
          </ul>
        </InfoPanel>

        <ReusableCard
          title={
            <div className="flex items-center gap-2">
              <LayoutDashboard className="h-5 w-5" />
              Navigation Settings
            </div>
          }
          description="Reorder and manage visibility of navigation items in the sidebar"
          content={navigationContent}
        />
      </div>
    </FeatureLayout>
  );
}
