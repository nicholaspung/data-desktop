import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  HeartPulse,
  PieChart,
  RefreshCcw,
  Power,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useStore } from "@tanstack/react-store";
import { ApiService } from "@/services/api";
import { DatasetSummary, FieldDefinition } from "@/types/types";
import { DataStoreName, loadState } from "@/store/data-store";
import { getProcessedRecords } from "@/lib/data-utils";
import ReusableCard from "@/components/reusable/reusable-card";
import DEXADashboardSummary from "@/features/dashboard/dexa-dashboard-summary";
import { Separator } from "@/components/ui/separator";
import BloodworkDashboardSummary from "@/features/dashboard/bloodwork-dashboard-summary";
import ExperimentDashboardSummary from "@/features/dashboard/experiment-dashboard-summary";
import { Link } from "@tanstack/react-router";
import DailyTrackingDashboardSummary from "@/features/dashboard/daily-tracking-dashboard-summary";
import QuickMetricLoggerDashboardSummary from "@/features/dashboard/quick-metric-logger-dashboard-summary";
import JournalingDashboardSummary from "@/features/dashboard/journaling-dashboard-summary";
import appStateStore from "@/store/app-state-store";
import TimeTrackerDashboardSummary from "@/features/dashboard/time-tracker-dashboard-summary";
import settingsStore from "@/store/settings-store";
import TodoDashboardSummary from "@/features/todos/todo-dashboard-summary";
import PeopleCRMDashboardSummary from "@/features/dashboard/people-crm-dashboard-summary";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const [summaries, setSummaries] = useState<DatasetSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const dashboardDataLoaded = useStore(
    appStateStore,
    (state) => state.dashboardDataLoaded
  );
  const setDashboardDataLoaded = appStateStore.state.setDashboardDataLoaded;
  const visibleRoutes = useStore(settingsStore, (state) => state.visibleRoutes);

  useEffect(() => {
    if (!dashboardDataLoaded) {
      loadSummaries();
    } else {
      setIsLoading(false);
    }
  }, [dashboardDataLoaded]);

  const loadSummaries = async () => {
    setIsLoading(true);
    try {
      const datasets = await ApiService.getDatasets();

      if (!datasets || datasets.length === 0) {
        setSummaries([]);
        setIsLoading(false);
        return;
      }

      const countPromises = datasets.map(async (dataset) => {
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
            href: `/dataset`,
          };
        } catch (error) {
          console.error(`Error getting records for ${dataset.id}:`, error);
          return {
            id: dataset.id,
            name: dataset.name,
            count: 0,
            lastUpdated: null,
            icon: getDatasetIcon(dataset.type),
            href: dataset.id.includes("blood")
              ? "/bloodwork"
              : `/${dataset.id}`,
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
  };

  const getDatasetIcon = (type: string) => {
    switch (type) {
      case "dexa":
        return <PieChart className="h-5 w-5" />;
      case "bloodwork":
        return <HeartPulse className="h-5 w-5" />;
      default:
        return <BarChart className="h-5 w-5" />;
    }
  };

  const handleRefresh = () => {
    setDashboardDataLoaded(false);
    loadSummaries();
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
        <Button
          variant="outline"
          size="sm"
          disabled={isLoading}
          onClick={handleRefresh}
        >
          <RefreshCcw className="h-4 w-4" />
        </Button>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {visibleRoutes["/calendar"] && <DailyTrackingDashboardSummary />}
        {visibleRoutes["/todos"] && <TodoDashboardSummary />}
        {visibleRoutes["/time-tracker"] && <TimeTrackerDashboardSummary />}
        {visibleRoutes["/experiments"] && <ExperimentDashboardSummary />}
        {visibleRoutes["/metric"] && <QuickMetricLoggerDashboardSummary />}
        {visibleRoutes["/journaling"] && <JournalingDashboardSummary />}
        {visibleRoutes["/people-crm"] && <PeopleCRMDashboardSummary />}
        {visibleRoutes["/dexa"] && <DEXADashboardSummary />}
        {visibleRoutes["/bloodwork"] && <BloodworkDashboardSummary />}
      </div>

      <div className="flex flex-col space-y-2">
        <h4 className="text-l font-bold">Dataset summary information</h4>
        <Separator />
        {summaries.length > 0 ? (
          summaries.map((summary) => (
            <Link
              to={summary.href}
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
                        <span className="ml-2 font-bold">{summary.name}</span>
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
                  It looks like the application disconnected. Please reload to
                  reconnect to your data.
                </div>
                <Button
                  variant="default"
                  size="default"
                  onClick={() => window.location.reload()}
                  className="flex items-center gap-2"
                >
                  <Power className="h-4 w-4" />
                  Reload Application
                </Button>
              </div>
            }
          />
        )}
      </div>
    </div>
  );
}
