// src/features/experiments/experiment-dashboard.tsx
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { format, differenceInDays, isAfter } from "date-fns";
import { useStore } from "@tanstack/react-store";
import dataStore from "@/store/data-store";
import {
  Loader2,
  CalendarDays,
  Target,
  ChevronRight,
  BarChart,
  ListChecks,
  ListTodo,
} from "lucide-react";
import ExperimentMetrics from "./experiment-metrics";
import { getStatusBadge } from "./experiments-utils";
import ExperimentDashboardProgress from "./experiment-dashboard-progress";

interface ExperimentDashboardProps {
  experimentId: string;
}

const ExperimentDashboard: React.FC<ExperimentDashboardProps> = ({
  experimentId,
}) => {
  // State
  const [experiment, setExperiment] = useState<any>(null);
  const [metrics, setMetrics] = useState<any[]>([]);
  const [experimentMetrics, setExperimentMetrics] = useState<any[]>([]);
  const [dailyLogs, setDailyLogs] = useState<any[]>([]);
  const [progressData, setProgressData] = useState<{
    overall: number;
    byMetric: Record<string, number>;
    completionRate: Record<string, number>;
    daysElapsed: number;
    totalDays: number;
    daysRemaining: number;
  }>({
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
      {/* Experiment Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold">{experiment.name}</h2>
              <p className="text-muted-foreground mt-1">
                {experiment.description}
              </p>

              <div className="flex items-center gap-2 mt-2">
                {experiment &&
                  getStatusBadge(
                    experiment.status,
                    experiment.status.charAt(0).toUpperCase() +
                      experiment.status.slice(1)
                  )}

                <div className="flex items-center text-sm">
                  <CalendarDays className="h-4 w-4 mr-1 text-muted-foreground" />
                  <span>
                    {format(new Date(experiment.start_date), "MMM d, yyyy")}
                    {experiment.end_date && (
                      <>
                        {" "}
                        - {format(new Date(experiment.end_date), "MMM d, yyyy")}
                      </>
                    )}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end gap-2">
              <div className="text-right">
                <div className="text-sm text-muted-foreground">
                  Time Progress
                </div>
                <div className="text-2xl font-bold">
                  {progressData.totalDays > 0
                    ? Math.round(
                        (progressData.daysElapsed / progressData.totalDays) *
                          100
                      )
                    : 0}
                  %
                </div>
              </div>

              <Progress
                value={
                  progressData.totalDays > 0
                    ? (progressData.daysElapsed / progressData.totalDays) * 100
                    : 0
                }
                className="w-32 h-2"
              />

              <div className="text-sm">
                {progressData.daysRemaining === 0
                  ? "Experiment complete"
                  : `${progressData.daysRemaining} days remaining`}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium">Goal</h3>
              <p className="text-muted-foreground">
                {experiment.goal || "No goal specified"}
              </p>
            </div>

            <div className="md:col-span-2">
              <h3 className="font-medium">Description</h3>
              <p className="text-muted-foreground">
                {experiment.description || "No description provided"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

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
          {/* Recent Logs */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Daily Logs</CardTitle>
            </CardHeader>
            <CardContent>
              {dailyLogs.length === 0 ? (
                <div className="text-center p-8">
                  <p className="text-muted-foreground">No logs recorded yet</p>
                  <Button variant="outline" className="mt-4" asChild>
                    <a href="/experiments?tab=daily_logs">
                      <ListTodo className="h-4 w-4 mr-2" />
                      Go to Daily Tracker
                    </a>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Group logs by date */}
                  {Object.entries(
                    dailyLogs.reduce((acc: Record<string, any[]>, log) => {
                      const dateStr = format(new Date(log.date), "yyyy-MM-dd");
                      if (!acc[dateStr]) acc[dateStr] = [];
                      acc[dateStr].push(log);
                      return acc;
                    }, {})
                  )
                    .sort(
                      (a, b) =>
                        new Date(b[0]).getTime() - new Date(a[0]).getTime()
                    )
                    .slice(0, 7) // Show most recent 7 days
                    .map(([dateStr, logs]) => (
                      <div key={dateStr} className="space-y-2">
                        <h3 className="font-medium">
                          {format(new Date(dateStr), "EEEE, MMMM d, yyyy")}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {logs.map((log) => {
                            const metric = metrics.find(
                              (m) => m.id === log.metric_id
                            );
                            if (!metric) return null;

                            let displayValue;
                            try {
                              const value = JSON.parse(log.value);
                              if (metric.type === "boolean") {
                                displayValue = value
                                  ? "Completed"
                                  : "Not Completed";
                              } else {
                                displayValue = `${value}${metric.unit ? ` ${metric.unit}` : ""}`;
                              }
                            } catch (e: any) {
                              console.error(e);
                              displayValue = log.value;
                            }

                            return (
                              <Card key={log.id} className="bg-accent/10">
                                <CardContent className="p-3">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <div className="font-medium">
                                        {metric.name}
                                      </div>
                                      <div className="text-sm">
                                        {displayValue}
                                      </div>
                                      {log.notes && (
                                        <div className="text-xs text-muted-foreground mt-1">
                                          {log.notes}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>
                      </div>
                    ))}

                  <div className="flex justify-center mt-4">
                    <Button variant="outline" asChild>
                      <a href="/experiments?tab=daily_logs">
                        View All Logs
                        <ChevronRight className="h-4 w-4 ml-2" />
                      </a>
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ExperimentDashboard;
