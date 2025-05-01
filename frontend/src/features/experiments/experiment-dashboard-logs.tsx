// src/features/experiments/experiment-dashboard-logs.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import CalendarView from "@/features/daily-tracker/calendar-view";
import { Experiment } from "@/store/experiment-definitions";
import { useStore } from "@tanstack/react-store";
import dataStore from "@/store/data-store";
import { Calendar } from "lucide-react";

export default function ExperimentDashboardLogs({
  experiment,
}: {
  experiment: Experiment;
}) {
  const experimentMetrics = useStore(
    dataStore,
    (state) => state.experiment_metrics
  );

  // Filter metrics for this experiment
  const experimentMetricIds = experimentMetrics
    .filter((em: any) => em.experiment_id === experiment.id)
    .map((em: any) => em.metric_id);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Calendar className="h-5 w-5 mr-2" />
          Daily Logs Calendar
        </CardTitle>
      </CardHeader>
      <CardContent>
        {experimentMetricIds.length === 0 ? (
          <div className="text-center p-8">
            <p className="text-muted-foreground">
              No metrics have been added to this experiment yet.
            </p>
          </div>
        ) : (
          <CalendarView selectedMetrics={experimentMetricIds} />
        )}
      </CardContent>
    </Card>
  );
}
