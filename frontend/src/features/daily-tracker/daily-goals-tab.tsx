import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { MetricWithLog } from "@/store/experiment-definitions";
import { cn } from "@/lib/utils";
import { Target } from "lucide-react";
import { getCompletedGoalsCount, getMetricsWithGoals } from "./goal-utils";
import DailyTrackerViewCard from "./daily-tracker-view-card";

interface DailyGoalsTabProps {
  metricsWithLogs: MetricWithLog[];
  showNotes: boolean;
  saveChanges: (
    metricId: string,
    key: "value" | "notes",
    value: any
  ) => Promise<void>;
}

export default function DailyGoalsTab({
  metricsWithLogs,
  showNotes,
  saveChanges,
}: DailyGoalsTabProps) {
  const metricsWithGoals = getMetricsWithGoals(metricsWithLogs);

  const completedGoalsCount = getCompletedGoalsCount(metricsWithLogs);

  const totalGoals = metricsWithGoals.length;
  const overallProgress =
    totalGoals > 0 ? Math.round((completedGoalsCount / totalGoals) * 100) : 0;

  if (metricsWithGoals.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Goals Set</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            No goals have been set for today. Goals can be set by configuring
            metrics in experiments and enabling the "Apply as Daily Goal"
            option.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="h-5 w-5 mr-2 text-primary" />
            Daily Goals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="font-medium">Overall Progress</span>
                <span>
                  {completedGoalsCount} of {totalGoals} goals completed (
                  {overallProgress}%)
                </span>
              </div>
              <Progress
                value={overallProgress}
                className="h-2"
                indicatorClassName={cn(
                  overallProgress === 100
                    ? "bg-green-500"
                    : overallProgress >= 66
                      ? "bg-amber-500"
                      : "bg-red-500"
                )}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Goals List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {metricsWithGoals.map((metric) => (
          <DailyTrackerViewCard
            key={metric.id}
            metric={metric}
            showNotes={showNotes}
            saveChanges={saveChanges}
            isScheduled={true}
          />
        ))}
      </div>
    </div>
  );
}
