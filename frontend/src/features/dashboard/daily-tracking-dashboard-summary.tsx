import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Edit, CalendarDays } from "lucide-react";
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
import ReusableSummary from "@/components/reusable/reusable-summary";
import { FEATURE_ICONS } from "@/lib/icons";
import { registerDashboardSummary } from "@/lib/dashboard-registry";

export default function DailyTrackingDashboardSummary({
  showPrivateMetrics = true,
}: {
  showPrivateMetrics?: boolean;
}) {
  const [todayLogs, setTodayLogs] = useState<Record<string, DailyLog>>({});
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [currentMetric, setCurrentMetric] = useState<Metric | null>(null);
  const [metricValue, setMetricValue] = useState<string | number>("");
  const [metricNotes, setMetricNotes] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const allMetrics = useStore(dataStore, (state) => state.metrics) || [];
  const dailyLogs = useStore(dataStore, (state) => state.daily_logs) || [];
  const experimentMetrics =
    useStore(dataStore, (state) => state.experiment_metrics) || [];
  const experiments = useStore(dataStore, (state) => state.experiments) || [];
  const today = startOfDay(new Date());

  const findExperimentForMetric = (metricId: string): string | undefined => {
    const metricExperiments = experimentMetrics.filter(
      (em) => em.metric_id === metricId
    );

    const activeExperiments = experiments.filter(
      (exp) => exp.status === "active"
    );

    const activeExperimentMetric = metricExperiments.find((em) =>
      activeExperiments.some((exp) => exp.id === em.experiment_id)
    );

    return activeExperimentMetric?.experiment_id;
  };

  useEffect(() => {
    setIsLoading(true);

    const activeMetrics = allMetrics.filter(
      (metric) =>
        metric.active &&
        !(metric.schedule_days || []).includes(-1) &&
        (!metric.private || showPrivateMetrics)
    );

    setMetrics(activeMetrics);

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
    setIsLoading(false);
  }, [allMetrics, dailyLogs, showPrivateMetrics]);

  const toggleMetric = async (metric: Metric) => {
    if (metric.type !== "boolean") {
      setCurrentMetric(metric);

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
        setMetricValue(metric.default_value || "");
        setMetricNotes("");
      }

      setModalOpen(true);
      return;
    }

    setLoading((prev) => ({ ...prev, [metric.id]: true }));

    try {
      const existingLog = todayLogs[metric.id];
      const experimentId = findExperimentForMetric(metric.id);

      if (existingLog) {
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
          experiment_id: experimentId,
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
        const newLog = {
          date: today,
          metric_id: metric.id,
          experiment_id: experimentId,
          value: "true",
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

  const saveMetricValue = async () => {
    if (!currentMetric) return;

    setLoading((prev) => ({ ...prev, [currentMetric.id]: true }));

    try {
      const existingLog = todayLogs[currentMetric.id];
      const experimentId = findExperimentForMetric(currentMetric.id);

      if (existingLog) {
        const response = await ApiService.updateRecord(existingLog.id, {
          ...existingLog,
          value: JSON.stringify(metricValue),
          notes: metricNotes,
          experiment_id: experimentId,
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
        const newLog = {
          date: today,
          metric_id: currentMetric.id,
          experiment_id: experimentId,
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

    return true;
  };

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

  const getCompletedCount = (): number => {
    return metrics.filter((metric) => isMetricCompleted(metric)).length;
  };

  const metricsList = (
    <div className="space-y-2 pt-2">
      {metrics.map((metric) => (
        <div
          key={metric.id}
          className="flex items-center justify-between py-1 hover:bg-muted/50 px-2 rounded-md transition-colors"
        >
          <div className="flex items-center gap-2">
            {metric.type === "boolean" ? (
              <Checkbox
                checked={isMetricCompleted(metric)}
                disabled={loading[metric.id]}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleMetric(metric);
                }}
              />
            ) : (
              <div
                className="w-4 h-4 flex items-center justify-center cursor-pointer hover:bg-muted/50 rounded-md transition-colors"
                onClick={() => toggleMetric(metric)}
              >
                {metric.type === "time" ? (
                  <Clock className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Edit className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            )}
            {metric.private ? (
              <ProtectedField>
                <span className="text-sm">{metric.name}</span>
              </ProtectedField>
            ) : (
              <span className="text-sm">{metric.name}</span>
            )}
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
  );

  return (
    <>
      <ReusableSummary
        title="Today's Tracking"
        titleIcon={<FEATURE_ICONS.DAILY_TRACKER className="h-5 w-5" />}
        linkTo="/calendar"
        loading={isLoading}
        emptyState={
          metrics.length === 0
            ? {
                message: "No tracking items for today",
                actionText: "Go to Daily Tracker",
                actionTo: "/calendar",
              }
            : undefined
        }
        customContent={
          <div className="flex flex-col gap-4">
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

            {metrics.length > 0 ? metricsList : null}
          </div>
        }
      />

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

registerDashboardSummary({
  route: "/calendar",
  component: DailyTrackingDashboardSummary,
  defaultConfig: {
    id: "/calendar",
    size: "small",
    height: "large",
    order: 0,
    visible: true,
  },
  datasets: ["metrics", "daily_logs", "metric_categories"],
  name: "Daily Tracker",
  description: "Track daily habits and metrics",
  icon: CalendarDays,
});
