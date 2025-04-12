// src/features/experiments/experiment-dashboard.tsx
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { format, differenceInDays, isBefore, isAfter } from "date-fns";
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
import { LineConfig, PieConfig } from "@/components/charts/charts";
import CustomPieChart from "@/components/charts/pie-chart";
import CustomLineChart from "@/components/charts/line-chart";
import { getStatusBadge } from "./experiments-utils";
import ReusableCard from "@/components/reusable/reusable-card";

const ExperimentDashboard = ({ experimentId }: { experimentId: string }) => {
  // State
  const [experiment, setExperiment] = useState<any>(null);
  const [metrics, setMetrics] = useState<any[]>([]);
  const [experimentMetrics, setExperimentMetrics] = useState<any[]>([]);
  const [dailyLogs, setDailyLogs] = useState<any[]>([]);
  const [progressData, setProgressData] = useState<{
    overall: number;
    byMetric: Record<string, number>;
    completionRate: Record<string, number>;
  }>({
    overall: 0,
    byMetric: {},
    completionRate: {},
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
    if (!experiment || expMetrics.length === 0) {
      setProgressData({
        overall: 0,
        byMetric: {},
        completionRate: {},
      });
      return;
    }

    // Initialize progress tracking
    const metricProgress: Record<string, number> = {};
    const completionRate: Record<string, number> = {};
    let totalImportance = 0;
    let weightedProgress = 0;

    // Process each metric
    expMetrics.forEach((expMetric) => {
      const metric = allMetrics.find((m) => m.id === expMetric.metric_id);
      if (!metric) return;

      // Get logs for this metric
      const metricLogs = logs.filter(
        (log) => log.metric_id === expMetric.metric_id
      );

      // Calculate progress based on metric type and target
      let metricProgressValue = 0;

      if (metricLogs.length > 0) {
        // For boolean metrics (completion rate)
        if (metric.type === "boolean") {
          const totalDaysInRange = calculateExperimentDays(experiment);
          const completedDays = metricLogs.filter((log) => {
            try {
              return JSON.parse(log.value) === true;
            } catch (e: any) {
              console.error(e);
              return log.value === "true";
            }
          }).length;

          // Calculate completion rate
          const rate =
            totalDaysInRange > 0 ? (completedDays / totalDaysInRange) * 100 : 0;
          completionRate[expMetric.metric_id] = rate;

          // Calculate progress toward target (if target is true, we want high completion rate)
          try {
            const targetValue = JSON.parse(expMetric.target);
            if (targetValue === true) {
              metricProgressValue = Math.min(100, rate);
            } else {
              // If target is false (skip), then lower completion is better
              metricProgressValue = Math.min(100, 100 - rate);
            }
          } catch (e: any) {
            console.error(e);
            metricProgressValue = Math.min(100, rate);
          }
        }
        // For numeric metrics (average vs target)
        else if (
          metric.type === "number" ||
          metric.type === "percentage" ||
          metric.type === "time"
        ) {
          // Calculate average value
          const values = metricLogs.map((log) => {
            try {
              return parseFloat(JSON.parse(log.value));
            } catch (e: any) {
              console.error(e);
              return parseFloat(log.value) || 0;
            }
          });

          const average =
            values.reduce((sum, val) => sum + val, 0) / values.length;

          // Compare to target
          try {
            const targetValue = parseFloat(JSON.parse(expMetric.target));

            // Progress increases as we get closer to target
            const difference = Math.abs(average - targetValue);
            const maxDiff = Math.max(targetValue, 100); // Use a reasonable max difference
            switch (expMetric.target_type) {
              case "atleast":
                // Progress increases as we approach/exceed target
                metricProgressValue = Math.min(
                  100,
                  (average / targetValue) * 100
                );
                break;
              case "atmost":
                // Progress increases as we stay below target
                metricProgressValue = Math.min(
                  100,
                  average <= targetValue ? 100 : (targetValue / average) * 100
                );
                break;
              case "exactly":
                metricProgressValue = Math.min(
                  100,
                  100 - (difference / maxDiff) * 100
                );
                break;
              default:
                metricProgressValue = 50; // Default to 50% if unknown target type
            }
          } catch (e: any) {
            console.error(e);
            metricProgressValue = 0;
          }
        }
      }

      // Store progress for this metric
      metricProgress[expMetric.metric_id] = Math.max(0, metricProgressValue);

      // Add to weighted progress calculation
      totalImportance += expMetric.importance;
      weightedProgress += metricProgressValue * expMetric.importance;
    });

    // Calculate overall progress (weighted by importance)
    const overall =
      totalImportance > 0 ? weightedProgress / totalImportance : 0;

    setProgressData({
      overall,
      byMetric: metricProgress,
      completionRate,
    });
  };

  // Calculate days in experiment (total or elapsed)
  const calculateExperimentDays = (experiment: any) => {
    if (!experiment || !experiment.start_date) return 0;

    const startDate = new Date(experiment.start_date);
    let endDate;

    if (experiment.end_date) {
      endDate = new Date(experiment.end_date);
    } else {
      // If no end date, use today
      endDate = new Date();
    }

    // If experiment hasn't started yet, return 0
    if (isAfter(startDate, new Date())) {
      return 0;
    }

    // Return days elapsed so far
    return differenceInDays(endDate, startDate) + 1; // +1 to include both start and end days
  };

  // Calculate days remaining in experiment
  const calculateRemainingDays = (experiment: any) => {
    if (!experiment || !experiment.end_date) return null;

    const endDate = new Date(experiment.end_date);
    const today = new Date();

    if (isBefore(endDate, today)) {
      return 0; // Experiment has ended
    }

    return differenceInDays(endDate, today);
  };

  // Generate chart data for completion trends
  const generateCompletionChartData = () => {
    if (!experiment || dailyLogs.length === 0) return [];

    // Group logs by date
    const logsByDate = dailyLogs.reduce((acc: Record<string, any[]>, log) => {
      const dateStr = format(new Date(log.date), "yyyy-MM-dd");
      if (!acc[dateStr]) acc[dateStr] = [];
      acc[dateStr].push(log);
      return acc;
    }, {});

    // Generate data points
    return Object.keys(logsByDate)
      .sort()
      .map((dateStr) => {
        const logs = logsByDate[dateStr];
        const dateObj = new Date(dateStr);

        // Calculate completion rate for boolean metrics on this date
        const booleanMetrics = experimentMetrics
          .filter((em) => {
            const metric = metrics.find((m) => m.id === em.metric_id);
            return metric && metric.type === "boolean";
          })
          .map((em) => em.metric_id);

        const completedCount = logs.filter((log) => {
          if (!booleanMetrics.includes(log.metric_id)) return false;

          try {
            return JSON.parse(log.value) === true;
          } catch (e: any) {
            console.error(e);
            return log.value === "true";
          }
        }).length;

        const completionRate =
          booleanMetrics.length > 0
            ? (completedCount / booleanMetrics.length) * 100
            : 0;

        return {
          date: dateStr,
          displayDate: format(dateObj, "MMM d"),
          completionRate,
          logCount: logs.length,
        };
      });
  };

  // Generate data for pie chart
  const generatePieChartData = () => {
    if (!experiment || experimentMetrics.length === 0) return [];

    return experimentMetrics.map((expMetric) => {
      const metric = metrics.find((m) => m.id === expMetric.metric_id);
      const progress = progressData.byMetric[expMetric.metric_id] || 0;

      return {
        name: metric?.name || "Unknown Metric",
        value: progress,
        color:
          progress >= 75 ? "#4ade80" : progress >= 50 ? "#facc15" : "#f87171",
      };
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
      <ReusableCard
        contentClassName="p-8 text-center"
        content={<p className="text-muted-foreground">Experiment not found</p>}
      />
    );
  }

  // Prepare chart configurations
  const completionChartData = generateCompletionChartData();
  const pieChartData = generatePieChartData();

  const lineConfig: LineConfig[] = [
    {
      dataKey: "completionRate",
      name: "Daily Completion %",
      color: "#4ade80",
      strokeWidth: 2,
      type: "monotone",
    },
  ];

  const pieConfig: PieConfig = {
    dataKey: "value",
    nameKey: "name",
    innerRadius: 60,
    outerRadius: 90,
    cornerRadius: 4,
    paddingAngle: 2,
  };

  return (
    <div className="space-y-6">
      {/* Experiment Header */}
      <ReusableCard
        contentClassName="p-6"
        showHeader={false}
        content={
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold">{experiment.name}</h2>
              <p className="text-muted-foreground mt-1">
                {experiment.description}
              </p>

              <div className="flex items-center gap-2 mt-2">
                {experiment
                  ? getStatusBadge(
                      experiment.status,
                      experiment.status.charAt(0).toUpperCase() +
                        experiment.status.slice(1)
                    )
                  : null}

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
                <div className="text-sm text-muted-foreground">Progress</div>
                <div className="text-2xl font-bold">
                  {Math.round(progressData.overall)}%
                </div>
              </div>

              <Progress value={progressData.overall} className="w-32 h-2" />

              {calculateRemainingDays(experiment) !== null && (
                <div className="text-sm">
                  {calculateRemainingDays(experiment) === 0
                    ? "Experiment complete"
                    : `${calculateRemainingDays(experiment)} days remaining`}
                </div>
              )}
            </div>
          </div>
        }
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
          {/* Progress Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Overall Progress Card */}
            <CustomPieChart
              data={pieChartData}
              pieConfig={pieConfig}
              title="Overall Progress"
            />

            {/* Completion Rate Trend */}
            {completionChartData.length === 0 ? (
              <ReusableCard
                title="Daily Completion Trend"
                showHeader
                content={
                  <div className="flex items-center justify-center p-8">
                    <p className="text-muted-foreground">
                      No data available yet
                    </p>
                  </div>
                }
              />
            ) : (
              <CustomLineChart
                data={completionChartData}
                lines={lineConfig}
                xAxisKey="displayDate"
                title="Daily Completion Trend"
                height={300}
              />
            )}
          </div>
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
