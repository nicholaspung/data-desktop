// src/features/dashboard/daily-tracking-dashboard-summary.tsx
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarCheck, Clock, Edit } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useStore } from "@tanstack/react-store";
import dataStore, { addEntry, updateEntry } from "@/store/data-store";
import { Metric, DailyLog } from "@/store/experiment-definitions";
import { format, isSameDay, startOfDay } from "date-fns";
import { toast } from "sonner";
import { ApiService } from "@/services/api";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ProtectedField } from "@/components/security/protected-content";
import { Separator } from "@/components/ui/separator";

export default function DailyTrackingDashboardSummary() {
  const [todayLogs, setTodayLogs] = useState<Record<string, DailyLog>>({});
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [currentMetric, setCurrentMetric] = useState<Metric | null>(null);
  const [metricValue, setMetricValue] = useState<string | number>("");
  const [metricNotes, setMetricNotes] = useState("");

  // Get data from store
  const allMetrics = useStore(dataStore, (state) => state.metrics) || [];
  const dailyLogs = useStore(dataStore, (state) => state.daily_logs) || [];
  const experimentMetrics =
    useStore(dataStore, (state) => state.experiment_metrics) || [];
  const experiments = useStore(dataStore, (state) => state.experiments) || [];
  const today = startOfDay(new Date());

  // Helper function to find the experiment ID for a given metric
  const findExperimentForMetric = (metricId: string): string | undefined => {
    // Find all experiment metrics for this metric
    const metricExperiments = experimentMetrics.filter(
      (em) => em.metric_id === metricId
    );

    // Get the active experiments
    const activeExperiments = experiments.filter(
      (exp) => exp.status === "active"
    );

    // Find the first active experiment that includes this metric
    const activeExperimentMetric = metricExperiments.find((em) =>
      activeExperiments.some((exp) => exp.id === em.experiment_id)
    );

    return activeExperimentMetric?.experiment_id;
  };

  // Load metrics and today's logs
  useEffect(() => {
    // Get active metrics that are scheduled for today
    const activeMetrics = allMetrics
      .filter(
        (metric) => metric.active && !(metric.schedule_days || []).includes(-1)
      )
      .slice(0, 4); // Just get first 4 for dashboard

    setMetrics(activeMetrics);

    // Get logs for today
    const logsMap: Record<string, DailyLog> = {};

    dailyLogs.forEach((log) => {
      const logDate = new Date(log.date);
      if (
        isSameDay(logDate, today) &&
        activeMetrics.some((m) => m.id === log.metric_id)
      ) {
        logsMap[log.metric_id] = log;
      }
    });

    setTodayLogs(logsMap);
  }, [allMetrics, dailyLogs]);

  // Toggle boolean metric completion
  const toggleMetric = async (metric: Metric) => {
    if (metric.type !== "boolean") {
      // For non-boolean metrics, open the modal
      setCurrentMetric(metric);

      // Set initial values if there's an existing log
      const existingLog = todayLogs[metric.id];
      if (existingLog) {
        try {
          setMetricValue(JSON.parse(existingLog.value));
          setMetricNotes(existingLog.notes || "");
        } catch {
          setMetricValue(existingLog.value || "");
          setMetricNotes(existingLog.notes || "");
        }
      } else {
        // Set default value for new log
        setMetricValue(metric.default_value || "");
        setMetricNotes("");
      }

      setModalOpen(true);
      return;
    }

    // For boolean metrics, toggle completion
    setLoading((prev) => ({ ...prev, [metric.id]: true }));

    try {
      const existingLog = todayLogs[metric.id];
      const experimentId = findExperimentForMetric(metric.id);

      if (existingLog) {
        // Toggle existing log
        let currentValue;
        try {
          currentValue = JSON.parse(existingLog.value);
        } catch {
          currentValue = existingLog.value === "true";
        }

        const newValue = !currentValue;

        const response = await ApiService.updateRecord(existingLog.id, {
          ...existingLog,
          value: JSON.stringify(newValue),
          experiment_id: experimentId, // Attach experiment ID
        });

        if (response) {
          updateEntry(existingLog.id, response, "daily_logs");
          setTodayLogs((prev) => ({
            ...prev,
            [metric.id]: response as DailyLog,
          }));

          toast.success(
            `${metric.private ? "Metric" : metric.name} ${newValue ? "completed" : "uncompleted"}`
          );
        }
      } else {
        // Create new log
        const newLog = {
          date: today,
          metric_id: metric.id,
          experiment_id: experimentId, // Attach experiment ID
          value: "true", // JSON.stringify(true)
          notes: "",
        };

        const response = await ApiService.addRecord("daily_logs", newLog);

        if (response) {
          addEntry(response, "daily_logs");
          setTodayLogs((prev) => ({
            ...prev,
            [metric.id]: response as DailyLog,
          }));

          toast.success(`${metric.private ? "Metric" : metric.name} completed`);
        }
      }
    } catch (error) {
      console.error("Error updating metric:", error);
      toast.error("Failed to update metric");
    } finally {
      setLoading((prev) => ({ ...prev, [metric.id]: false }));
    }
  };

  // Save non-boolean metric value
  const saveMetricValue = async () => {
    if (!currentMetric) return;

    setLoading((prev) => ({ ...prev, [currentMetric.id]: true }));

    try {
      const existingLog = todayLogs[currentMetric.id];
      const experimentId = findExperimentForMetric(currentMetric.id);

      if (existingLog) {
        // Update existing log
        const response = await ApiService.updateRecord(existingLog.id, {
          ...existingLog,
          value: JSON.stringify(metricValue),
          notes: metricNotes,
          experiment_id: experimentId, // Attach experiment ID
        });

        if (response) {
          updateEntry(existingLog.id, response, "daily_logs");
          setTodayLogs((prev) => ({
            ...prev,
            [currentMetric.id]: response as DailyLog,
          }));

          toast.success(
            `${currentMetric.private ? "Metric" : currentMetric.name} updated`
          );
        }
      } else {
        // Create new log
        const newLog = {
          date: today,
          metric_id: currentMetric.id,
          experiment_id: experimentId, // Attach experiment ID
          value: JSON.stringify(metricValue),
          notes: metricNotes,
        };

        const response = await ApiService.addRecord("daily_logs", newLog);

        if (response) {
          addEntry(response, "daily_logs");
          setTodayLogs((prev) => ({
            ...prev,
            [currentMetric.id]: response as DailyLog,
          }));

          toast.success(
            `${currentMetric.private ? "Metric" : currentMetric.name} logged`
          );
        }
      }
    } catch (error) {
      console.error("Error updating metric:", error);
      toast.error("Failed to update metric");
    } finally {
      setLoading((prev) => ({ ...prev, [currentMetric.id]: false }));
      setModalOpen(false);
      setCurrentMetric(null);
    }
  };

  // Check if a boolean metric is completed
  const isMetricCompleted = (metric: Metric): boolean => {
    const log = todayLogs[metric.id];
    if (!log) return false;

    if (metric.type === "boolean") {
      try {
        return JSON.parse(log.value) === true;
      } catch {
        return log.value === "true";
      }
    }

    // For non-boolean metrics, consider it completed if a log exists
    return true;
  };

  // Get display value for a non-boolean metric
  const getMetricDisplayValue = (metric: Metric): string => {
    const log = todayLogs[metric.id];
    if (!log) return "-";

    try {
      const value = JSON.parse(log.value);
      return `${value}${metric.unit ? ` ${metric.unit}` : ""}`;
    } catch {
      return `${log.value}${metric.unit ? ` ${metric.unit}` : ""}`;
    }
  };

  // Get completion count
  const getCompletedCount = (): number => {
    return metrics.filter((metric) => isMetricCompleted(metric)).length;
  };

  return (
    <>
      <Card className="col-span-1 row-span-1">
        <CardHeader>
          <CardTitle className="text-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarCheck className="h-5 w-5" />
              Today's Tracking
            </div>
            <Link
              to="/calendar"
              className="text-sm text-primary hover:underline"
            >
              View All
            </Link>
          </CardTitle>
        </CardHeader>

        <Separator />

        <CardContent>
          <div className="flex flex-col gap-4 pt-4">
            {/* Summary count */}
            <div className="flex items-end justify-between">
              <div>
                <div className="text-2xl font-bold">
                  {getCompletedCount()}/{metrics.length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Items completed for {format(today, "MMM d")}
                </p>
              </div>
            </div>

            {/* Metrics list */}
            {metrics.length === 0 ? (
              <div className="text-center text-muted-foreground py-2">
                <p className="text-sm">No tracking items for today</p>
              </div>
            ) : (
              <div className="space-y-2 pt-2">
                {metrics.map((metric) => (
                  <div
                    key={metric.id}
                    className="flex items-center justify-between py-1 cursor-pointer hover:bg-muted/50 px-2 rounded-md transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      {metric.type === "boolean" ? (
                        <Checkbox
                          checked={isMetricCompleted(metric)}
                          disabled={loading[metric.id]}
                          onClick={() => toggleMetric(metric)}
                        />
                      ) : (
                        <div className="w-4 h-4 flex items-center justify-center">
                          {metric.type === "time" ? (
                            <Clock className="h-3 w-3 text-muted-foreground" />
                          ) : (
                            <Edit className="h-3 w-3 text-muted-foreground" />
                          )}
                        </div>
                      )}
                      <span className="text-sm">
                        {metric.private ? (
                          <ProtectedField>{metric.name}</ProtectedField>
                        ) : (
                          metric.name
                        )}
                      </span>
                    </div>
                    <div className="flex items-center">
                      {metric.type === "boolean" ? (
                        isMetricCompleted(metric) ? (
                          <Badge className="text-xs bg-green-500 hover:bg-green-600">
                            Done
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">
                            To Do
                          </Badge>
                        )
                      ) : (
                        <span className="text-xs font-medium">
                          {getMetricDisplayValue(metric)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modal for non-boolean metrics */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {currentMetric?.private ? (
                <ProtectedField>{currentMetric?.name}</ProtectedField>
              ) : (
                currentMetric?.name
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="value">
                Value{currentMetric?.unit ? ` (${currentMetric.unit})` : ""}
              </Label>
              {currentMetric?.type === "number" ||
              currentMetric?.type === "percentage" ||
              currentMetric?.type === "time" ? (
                <Input
                  id="value"
                  type="number"
                  value={metricValue}
                  onChange={(e) =>
                    setMetricValue(parseFloat(e.target.value) || 0)
                  }
                />
              ) : (
                <Input
                  id="value"
                  value={metricValue}
                  onChange={(e) => setMetricValue(e.target.value)}
                />
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Input
                id="notes"
                value={metricNotes}
                onChange={(e) => setMetricNotes(e.target.value)}
                placeholder="Add notes..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setModalOpen(false)}
              disabled={loading[currentMetric?.id || ""]}
            >
              Cancel
            </Button>
            <Button
              onClick={saveMetricValue}
              disabled={loading[currentMetric?.id || ""]}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
