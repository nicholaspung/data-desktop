import { LineConfig } from "@/components/charts/charts";
import CustomLineChart from "@/components/charts/line-chart";
import ReusableCard from "@/components/reusable/reusable-card";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";

export default function ExperimentDashboardProgress({
  experiment,
  dailyLogs,
  experimentMetrics,
  metrics,
  progressData,
}: {
  experiment: any;
  dailyLogs: any[];
  experimentMetrics: any[];
  metrics: any[];
  progressData: {
    overall: number;
    byMetric: Record<string, number>;
    completionRate: Record<string, number>;
    daysElapsed: number;
    totalDays: number;
    daysRemaining: number;
  };
}) {
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

  // Prepare chart configurations
  const completionChartData = generateCompletionChartData();

  const lineConfig: LineConfig[] = [
    {
      dataKey: "completionRate",
      name: "Daily Completion %",
      color: "#4ade80",
      strokeWidth: 2,
      type: "monotone",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Overall Progress Card - Replaced Pie Chart with Completion Stats */}
      <ReusableCard
        showHeader
        title="Overall Completion"
        content={
          <div className="space-y-6">
            {/* Overall metric completion percentage */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <h3 className="font-medium">Metric Completion</h3>
                <span className="text-2xl font-bold">
                  {Math.round(progressData.overall)}%
                </span>
              </div>
              <Progress value={progressData.overall} className="h-2" />
              <p className="text-sm text-muted-foreground">
                Based on {progressData.daysElapsed} days of tracking out of{" "}
                {progressData.totalDays} total days
              </p>
            </div>

            {/* Time progress section */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <h3 className="font-medium">Time Progress</h3>
                <span className="text-lg">
                  {progressData.daysElapsed} of {progressData.totalDays} days
                </span>
              </div>
              <Progress
                value={
                  progressData.totalDays > 0
                    ? (progressData.daysElapsed / progressData.totalDays) * 100
                    : 0
                }
                className="h-2"
              />
            </div>

            {/* Per-metric completion rates */}
            <div className="mt-4">
              <h3 className="font-medium mb-2">Metric Completion Rates</h3>
              <div className="space-y-4">
                {experimentMetrics
                  .filter((expMetric) => {
                    const metric = metrics.find(
                      (m) => m.id === expMetric.metric_id
                    );
                    return metric && metric.type === "boolean";
                  })
                  .map((expMetric) => {
                    const metric = metrics.find(
                      (m) => m.id === expMetric.metric_id
                    );
                    const progress =
                      progressData.completionRate[expMetric.metric_id] || 0;

                    return (
                      <div key={expMetric.id} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>{metric?.name || "Unknown"}</span>
                          <span>{Math.round(progress)}%</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        }
      />

      {/* Completion Rate Trend */}
      {completionChartData.length === 0 ? (
        <ReusableCard
          title="Daily Completion Trend"
          showHeader
          content={
            <div className="flex items-center justify-center p-8">
              <p className="text-muted-foreground">No data available yet</p>
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
  );
}
