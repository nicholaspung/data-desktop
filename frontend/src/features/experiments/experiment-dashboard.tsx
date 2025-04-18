// src/features/experiments/experiment-dashboard.tsx
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { differenceInDays, isAfter } from "date-fns";
import { useStore } from "@tanstack/react-store";
import dataStore from "@/store/data-store";
import { Loader2, Target, BarChart, ListChecks } from "lucide-react";
import ExperimentMetrics from "./experiment-metrics";
import ExperimentDashboardProgress from "./experiment-dashboard-progress";
import ExperimentDashboardHeader from "./experiment-dashboard-header";
import {
  DailyLog,
  Experiment,
  ExperimentMetric,
  Metric,
} from "@/store/experiment-definitions";
import ExperimentDashboardLogs from "./experiment-dashboard-logs";

export interface ProgressDataType {
  overall: number;
  byMetric: Record<string, number>;
  completionRate: Record<string, number>;
  daysElapsed: number;
  totalDays: number;
  daysRemaining: number;
}

const ExperimentDashboard = ({ experimentId }: { experimentId: string }) => {
  // State
  const [experiment, setExperiment] = useState<Experiment | null>(null);
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [experimentMetrics, setExperimentMetrics] = useState<
    ExperimentMetric[]
  >([]);
  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>([]);
  const [progressData, setProgressData] = useState<ProgressDataType>({
    overall: 0,
    byMetric: {},
    completionRate: {},
    daysElapsed: 0,
    totalDays: 0,
    daysRemaining: 0,
  });
  const [loading, setLoading] = useState(true);

  // Access data from store
  const experimentsData =
    useStore(dataStore, (state) => state.experiments) || [];
  const metricsData = useStore(dataStore, (state) => state.metrics) || [];
  const experimentMetricsData =
    useStore(dataStore, (state) => state.experiment_metrics) || [];
  const dailyLogsData = useStore(dataStore, (state) => state.daily_logs) || [];

  // Load and process data
  useEffect(() => {
    if (experimentId) {
      processData();
    }
  }, [
    experimentId,
    experimentsData,
    metricsData,
    experimentMetricsData,
    dailyLogsData,
  ]);

  // Process all data
  const processData = () => {
    setLoading(true);

    try {
      // Get experiment details
      const experimentData = experimentsData.find(
        (exp: any) => exp.id === experimentId
      );
      if (!experimentData) {
        setLoading(false);
        return;
      }

      setExperiment(experimentData);

      // Get metrics for this experiment
      const expMetrics = experimentMetricsData.filter(
        (m: any) => m.experiment_id === experimentId
      );
      setExperimentMetrics(expMetrics);

      // Get all metrics
      const allMetrics = metricsData.filter((m: any) =>
        expMetrics.some((em: any) => em.metric_id === m.id)
      );
      setMetrics(allMetrics);

      // Filter logs for this experiment
      const experimentLogs = dailyLogsData.filter(
        (log: any) => log.experiment_id === experimentId
      );
      setDailyLogs(experimentLogs);

      // Calculate progress
      calculateProgress(experimentData, expMetrics, experimentLogs, allMetrics);
    } catch (error) {
      console.error("Error processing experiment data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate progress for the experiment
  const calculateProgress = (
    experiment: any,
    expMetrics: any[],
    logs: any[],
    allMetrics: any[]
  ) => {
    if (!experiment || !experiment.start_date) {
      setProgressData({
        overall: 0,
        byMetric: {},
        completionRate: {},
        daysElapsed: 0,
        totalDays: 0,
        daysRemaining: 0,
      });
      return;
    }

    // Calculate days statistics
    const startDate = new Date(experiment.start_date);
    const today = new Date();
    const endDate = experiment.end_date ? new Date(experiment.end_date) : today;

    // Days calculation
    const totalDays = differenceInDays(endDate, startDate) + 1;
    const daysElapsed = isAfter(today, startDate)
      ? Math.min(differenceInDays(today, startDate) + 1, totalDays)
      : 0;
    const daysRemaining = Math.max(0, totalDays - daysElapsed);

    // Initialize metric tracking
    const metricProgress: Record<string, number> = {};
    const completionRate: Record<string, number> = {};

    // Get all boolean metrics (completable items)
    const booleanMetrics = expMetrics.filter((metric) => {
      const metricInfo = allMetrics.find((m) => m.id === metric.metric_id);
      return metricInfo && metricInfo.type === "boolean";
    });

    // Process each metric
    booleanMetrics.forEach((expMetric) => {
      const metric = allMetrics.find((m) => m.id === expMetric.metric_id);
      if (!metric || metric.type !== "boolean") return;

      // Get logs for this metric
      const metricLogs = logs.filter(
        (log) => log.metric_id === expMetric.metric_id
      );

      // Calculate expected logs so far (one per day since start or experiment creation)
      const expectedCompletions = daysElapsed;

      // Count actual completions
      const completedCount = metricLogs.filter((log) => {
        try {
          return JSON.parse(log.value) === true;
        } catch (e) {
          console.error(e);
          return log.value === "true";
        }
      }).length;

      // Calculate completion rate
      const rate =
        expectedCompletions > 0
          ? (completedCount / expectedCompletions) * 100
          : 0;

      completionRate[expMetric.metric_id] = rate;
      metricProgress[expMetric.metric_id] = rate;
    });

    // Calculate overall metric completion rate (weighted by importance)
    let totalImportance = 0;
    let weightedProgress = 0;

    booleanMetrics.forEach((expMetric) => {
      const progress = metricProgress[expMetric.metric_id] || 0;
      totalImportance += expMetric.importance;
      weightedProgress += progress * expMetric.importance;
    });

    const overallCompletion =
      totalImportance > 0 ? weightedProgress / totalImportance : 0;

    // Set progress data
    setProgressData({
      overall: overallCompletion,
      byMetric: metricProgress,
      completionRate,
      daysElapsed,
      totalDays,
      daysRemaining,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!experiment) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">Experiment not found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <ExperimentDashboardHeader
        experiment={experiment}
        progressData={progressData}
      />

      {/* Tabs for different views */}
      <Tabs defaultValue="progress">
        <TabsList>
          <TabsTrigger value="progress">
            <BarChart className="h-4 w-4 mr-2" />
            Progress
          </TabsTrigger>
          <TabsTrigger value="metrics">
            <Target className="h-4 w-4 mr-2" />
            Metrics & Goals
          </TabsTrigger>
          <TabsTrigger value="logs">
            <ListChecks className="h-4 w-4 mr-2" />
            Daily Logs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="progress" className="space-y-6 mt-6">
          <ExperimentDashboardProgress
            experiment={experiment}
            dailyLogs={dailyLogs}
            experimentMetrics={experimentMetrics}
            metrics={metrics}
            progressData={progressData}
          />
        </TabsContent>

        <TabsContent value="metrics" className="mt-6">
          <ExperimentMetrics experimentId={experimentId} />
        </TabsContent>

        <TabsContent value="logs" className="mt-6">
          <ExperimentDashboardLogs dailyLogs={dailyLogs} metrics={metrics} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ExperimentDashboard;
