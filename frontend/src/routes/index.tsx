import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { FEATURE_ICONS } from "@/lib/icons";
import { useState, useEffect, useCallback } from "react";
import { useStore } from "@tanstack/react-store";
import { ApiService } from "@/services/api";
import { DatasetSummary, FieldDefinition } from "@/types/types";
import { DataStoreName, loadState } from "@/store/data-store";
import { getProcessedRecords } from "@/lib/data-utils";
import ReusableCard from "@/components/reusable/reusable-card";
import { Separator } from "@/components/ui/separator";
import { Link } from "@tanstack/react-router";
import appStateStore from "@/store/app-state-store";
import settingsStore, { getRouteDatasetMapping } from "@/store/settings-store";
import PrivateToggleButton from "@/components/reusable/private-toggle-button";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import CustomizableDashboardSummary from "@/components/reusable/customizable-dashboard-summary";
import { dashboardRegistry } from "@/lib/dashboard-registry";

import "@/features/dashboard/dexa-dashboard-summary";
import "@/features/dashboard/bloodwork-dashboard-summary";
import "@/features/dashboard/experiment-dashboard-summary";
import "@/features/dashboard/daily-tracking-dashboard-summary";
import "@/features/dashboard/metric-logger-dashboard-summary";
import "@/features/dashboard/journaling-dashboard-summary";
import "@/features/dashboard/time-tracker-dashboard-summary";
import "@/features/todos/todo-dashboard-summary";
import "@/features/dashboard/people-crm-dashboard-summary";
import "@/features/dashboard/wealth-dashboard-summary";
import "@/features/dashboard/body-measurements-dashboard-summary";

const sizeClasses = {
  small: "col-span-1",
  medium: "col-span-1 sm:col-span-2 lg:col-span-2",
  large: "col-span-1 sm:col-span-2 lg:col-span-3",
};

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const [summaries, setSummaries] = useState<DatasetSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showPrivateMetrics, setShowPrivateMetrics] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showDatasetSummaries, setShowDatasetSummaries] = useState(true);

  const dashboardDataLoaded = useStore(
    appStateStore,
    (state) => state.dashboardDataLoaded
  );
  const setDashboardDataLoaded = appStateStore.state.setDashboardDataLoaded;
  const visibleRoutes = useStore(settingsStore, (state) => state.visibleRoutes);
  const dashboardSummaryConfigs = useStore(
    settingsStore,
    (state) => state.dashboardSummaryConfigs
  );
  const setDashboardSummaryConfig =
    settingsStore.state.setDashboardSummaryConfig;
  const reorderDashboardSummaries =
    settingsStore.state.reorderDashboardSummaries;

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const loadSummariesCallback = useCallback(async () => {
    setIsLoading(true);
    try {
      const allDatasets = await ApiService.getDatasets();

      if (!allDatasets || allDatasets.length === 0) {
        setSummaries([]);
        setIsLoading(false);
        return;
      }

      const routeDatasetMapping = getRouteDatasetMapping();
      const filteredDatasets = allDatasets.filter((dataset) => {
        for (const [route, datasets] of Object.entries(routeDatasetMapping)) {
          if (datasets.includes(dataset.id) && visibleRoutes[route]) {
            return true;
          }
        }

        const route = getDatasetRoute(dataset.id);
        return visibleRoutes[route];
      });

      const countPromises = filteredDatasets.map(async (dataset) => {
        try {
          const processedRecords =
            (await getProcessedRecords(
              dataset.id as DataStoreName,
              dataset.fields as FieldDefinition[]
            )) || [];

          loadState(processedRecords, dataset.id as DataStoreName);

          return {
            id: dataset.id,
            name: dataset.name,
            count: processedRecords.length,
            lastUpdated: processedRecords[0]
              ? processedRecords[0].lastModified
              : null,
            icon: getDatasetIcon(dataset.type),
            href: getDatasetRoute(dataset.id),
          };
        } catch (error) {
          console.error(`Error getting records for ${dataset.id}:`, error);
          return {
            id: dataset.id,
            name: dataset.name,
            count: 0,
            lastUpdated: null,
            icon: getDatasetIcon(dataset.type),
            href: getDatasetRoute(dataset.id),
          };
        }
      });

      const results = await Promise.all(countPromises);
      setSummaries(results);

      setDashboardDataLoaded(true);
    } catch (error) {
      console.error("Error loading dataset summaries:", error);
      setSummaries([]);
    } finally {
      setIsLoading(false);
    }
  }, [visibleRoutes, setDashboardDataLoaded]);

  useEffect(() => {
    if (!dashboardDataLoaded) {
      loadSummariesCallback();
    } else {
      setIsLoading(false);
    }
  }, [visibleRoutes, dashboardDataLoaded, loadSummariesCallback]);

  const getDatasetRoute = (datasetId: string): string => {
    if (datasetId.includes("blood") || datasetId === "dexa") {
      return `/${datasetId.split("_")[0]}`;
    }
    if (datasetId === "experiments" || datasetId === "experiment_metrics") {
      return "/experiments";
    }
    if (
      datasetId === "metrics" ||
      datasetId === "daily_logs" ||
      datasetId === "metric_categories"
    ) {
      return "/calendar";
    }
    if (datasetId.includes("journal") || datasetId === "affirmation") {
      return "/journaling";
    }
    if (datasetId.includes("time_") || datasetId === "time_planner_configs") {
      return "/time-tracker";
    }
    if (datasetId === "todos") {
      return "/todos";
    }
    if (
      datasetId.includes("person") ||
      datasetId === "people" ||
      datasetId === "meetings" ||
      datasetId === "birthday_reminders"
    ) {
      return "/people-crm";
    }
    return "/dataset";
  };

  const getDatasetIcon = (type: string) => {
    switch (type) {
      case "dexa":
        return <FEATURE_ICONS.DEXA_SCAN className="h-5 w-5" />;
      case "bloodwork":
        return <FEATURE_ICONS.BLOODWORK className="h-5 w-5" />;
      default:
        return <FEATURE_ICONS.BAR_CHART className="h-5 w-5" />;
    }
  };

  const handleRefresh = () => {
    setDashboardDataLoaded(false);
    loadSummariesCallback();
  };

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const orderedSummaries = getOrderedDashboardSummaries();
      const oldIndex = orderedSummaries.findIndex(
        (item) => item.route === active.id
      );
      const newIndex = orderedSummaries.findIndex(
        (item) => item.route === over?.id
      );

      if (oldIndex !== -1 && newIndex !== -1) {
        reorderDashboardSummaries(oldIndex, newIndex);
      }
    }

    setActiveId(null);
  }

  const getOrderedDashboardSummaries = () => {
    const configs = dashboardSummaryConfigs || {};
    const dashboardRoutes = dashboardRegistry.getAllRoutes();

    const summariesWithConfigs = dashboardRoutes
      .filter((route) => visibleRoutes[route])
      .map((route) => {
        const registryDefinition = dashboardRegistry.get(route);
        const defaultConfig = registryDefinition?.defaultConfig || {
          id: route,
          size: "small" as const,
          height: "large" as const,
          order: dashboardRoutes.indexOf(route),
          visible: true,
        };
        const config = configs[route] || defaultConfig;

        return {
          route,
          config,
        };
      });

    return summariesWithConfigs
      .filter((item) => item.config.visible || isEditMode)
      .sort((a, b) => a.config.order - b.config.order);
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background/80 z-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-sm text-muted-foreground">Loading data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="flex items-center gap-2">
          <PrivateToggleButton
            showPrivate={showPrivateMetrics}
            onToggle={setShowPrivateMetrics}
          />
          <Button
            onClick={() => setIsEditMode(!isEditMode)}
            size="sm"
            variant={isEditMode ? "default" : "outline"}
          >
            <FEATURE_ICONS.SETTINGS className="h-4 w-4 mr-2" />
            Customize
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={isLoading}
            onClick={handleRefresh}
          >
            <FEATURE_ICONS.REFRESH className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="mt-8">
        {isEditMode && (
          <div className="mb-4 p-3 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">
              🎨 <strong>Customize Mode:</strong> Drag dashboard cards to
              reorder, use the controls to resize or hide them
            </p>
          </div>
        )}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={getOrderedDashboardSummaries().map((item) => item.route)}
            strategy={verticalListSortingStrategy}
          >
            <div
              className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
              style={{ minHeight: "200px", padding: "8px" }}
            >
              {getOrderedDashboardSummaries().map((item) => {
                const { route, config } = item;

                const renderSummary = () => {
                  const summaryDefinition = dashboardRegistry.get(route);
                  if (!summaryDefinition) {
                    return null;
                  }

                  const Component = summaryDefinition.component;

                  const props =
                    route === "/wealth" ? {} : { showPrivateMetrics };
                  return <Component {...props} />;
                };

                return (
                  <CustomizableDashboardSummary
                    key={route}
                    id={route}
                    config={config}
                    isEditMode={isEditMode}
                    onConfigChange={setDashboardSummaryConfig}
                  >
                    {renderSummary()}
                  </CustomizableDashboardSummary>
                );
              })}
            </div>
          </SortableContext>
          <DragOverlay>
            {activeId ? (
              <div className="opacity-95 rotate-3 shadow-2xl">
                {(() => {
                  const activeItem = getOrderedDashboardSummaries().find(
                    (item) => item.route === activeId
                  );
                  if (!activeItem) return null;

                  const { route, config } = activeItem;
                  const renderSummary = () => {
                    const summaryDefinition = dashboardRegistry.get(route);
                    if (!summaryDefinition) {
                      return null;
                    }

                    const Component = summaryDefinition.component;

                    const props =
                      route === "/wealth" ? {} : { showPrivateMetrics };
                    return <Component {...props} />;
                  };

                  return (
                    <div className={sizeClasses[config.size]}>
                      <CustomizableDashboardSummary
                        id={route}
                        config={config}
                        isEditMode={false}
                        onConfigChange={() => {}}
                      >
                        {renderSummary()}
                      </CustomizableDashboardSummary>
                    </div>
                  );
                })()}
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
      <div className="flex flex-col space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-l font-bold">Dataset summary information</h4>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDatasetSummaries(!showDatasetSummaries)}
            className="h-8 w-8 p-0"
          >
            {showDatasetSummaries ? (
              <FEATURE_ICONS.CHEVRON_UP className="h-4 w-4" />
            ) : (
              <FEATURE_ICONS.CHEVRON_DOWN className="h-4 w-4" />
            )}
          </Button>
        </div>
        <Separator />
        {showDatasetSummaries && (
          <>
            {summaries.length > 0 ? (
              summaries.map((summary) => (
                <Link
                  to="/dataset"
                  search={{ datasetId: summary.id }}
                  key={summary.id}
                >
                  <ReusableCard
                    key={summary.id}
                    showHeader={false}
                    cardClassName="hover:bg-accent/20 transition-colors"
                    contentClassName="pt-6"
                    content={
                      <div className="flex flex-row justify-between">
                        <div className="flex flex-col">
                          <div className="flex items-center">
                            {summary.icon}
                            <span className="ml-2 font-bold">
                              {summary.name}
                            </span>
                          </div>
                          <span>
                            {summary.lastUpdated
                              ? `Last updated: ${new Date(
                                  summary.lastUpdated
                                ).toLocaleDateString()}`
                              : "No data yet"}
                          </span>
                        </div>
                        <div>
                          <p className="text-2xl font-bold">{summary.count}</p>
                          <p className="text-sm text-muted-foreground">
                            total records
                          </p>
                        </div>
                      </div>
                    }
                  />
                </Link>
              ))
            ) : (
              <ReusableCard
                showHeader={false}
                cardClassName="border-dashed"
                contentClassName="py-8"
                content={
                  <div className="flex flex-col items-center justify-center text-center">
                    <div className="text-muted-foreground mb-4">
                      It looks like the application disconnected. Please reload
                      to reconnect to your data.
                    </div>
                    <Button
                      variant="default"
                      size="default"
                      onClick={() => window.location.reload()}
                      className="flex items-center gap-2"
                    >
                      <FEATURE_ICONS.POWER className="h-4 w-4" />
                      Reload Application
                    </Button>
                  </div>
                }
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
