import { LineConfig } from "@/components/charts/charts";
import CustomLineChart from "@/components/charts/line-chart";
import ReusableCard from "@/components/reusable/reusable-card";
import { Progress } from "@/components/ui/progress";
import { OngoingIndicator } from "@/components/experiments/ongoing-indicator";
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
  const generateCompletionChartData = () => {
    if (!experiment || dailyLogs.length === 0) return [];

    const logsByDate = dailyLogs.reduce((acc: Record<string, any[]>, log) => {
      const dateStr = format(new Date(log.date), "yyyy-MM-dd");
      if (!acc[dateStr]) acc[dateStr] = [];
      acc[dateStr].push(log);
      return acc;
    }, {});

    return Object.keys(logsByDate)
      .sort()
      .map((dateStr) => {
        const logs = logsByDate[dateStr];

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

        const [year, monthPlus1, day] = dateStr.split("-");

        return {
          date: dateStr,
          displayDate: format(
            new Date(Number(year), Number(monthPlus1) - 1, Number(day)),
            "MMM d"
          ),
          completionRate,
          logCount: logs.length,
        };
      });
  };

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
      <ReusableCard
        showHeader
        title="Overall Completion"
        content={
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <h3 className="font-medium">Metric Completion</h3>
                <span className="text-2xl font-bold">
                  {Math.round(progressData.overall)}%
                </span>
              </div>
              <Progress value={progressData.overall} className="h-2" />
              <p className="text-sm text-muted-foreground">
                Based on {progressData.daysElapsed} days of tracking
                {experiment.end_date &&
                  ` out of ${progressData.totalDays} total days`}
              </p>
            </div>

            {experiment.end_date ? (
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
                      ? (progressData.daysElapsed / progressData.totalDays) *
                        100
                      : 0
                  }
                  className="h-2"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <h3 className="font-medium">Experiment Progress</h3>
                <OngoingIndicator daysElapsed={progressData.daysElapsed} />
              </div>
            )}

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
