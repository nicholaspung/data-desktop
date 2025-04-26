import { useState, useEffect } from "react";
import { Beaker, Calendar } from "lucide-react";
import { isSameDay } from "date-fns";
import { useStore } from "@tanstack/react-store";
import dataStore, { addEntry, updateEntry } from "@/store/data-store";
import loadingStore from "@/store/loading-store";
import DailyTrackerNavigation from "./daily-tracker-navigation";
import DailyTrackerViewCard from "./daily-tracker-view-card";
import { parseMetricValue } from "../experiments/experiments-utils";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ApiService } from "@/services/api";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import DailyTrackerCalendarGrid from "./daily-tracker-calendar-grid";
import { isMetricScheduledForDate, parseScheduleDays } from "./schedule-utils";
import { DailyLog, MetricWithLog } from "@/store/experiment-definitions";
import AddMetricModal from "./add-metric-modal";
import AddCategoryDialog from "./add-category-dialog";
import ReusableTabs from "@/components/reusable/reusable-tabs";

interface MetricWithLogWithChange extends MetricWithLog {
  isScheduledForToday: boolean;
}

export default function DailyTrackerCalendarView() {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [metricsWithLogs, setMetricsWithLogs] = useState<
    MetricWithLogWithChange[]
  >([]);
  const [selectedTab, setSelectedTab] = useState("all");
  const [showNotes, setShowNotes] = useState(false);
  const [showUnscheduled, setShowUnscheduled] = useState(false);

  const metricsData = useStore(dataStore, (state) => state.metrics) || [];
  const experimentMetricsData =
    useStore(dataStore, (state) => state.experiment_metrics) || [];
  const experimentsData = useStore(dataStore, (state) => state.experiments);
  const dailyLogsData = useStore(dataStore, (state) => state.daily_logs) || [];

  const metricsLoading =
    useStore(loadingStore, (state) => state.metrics) || false;
  const dailyLogsLoading =
    useStore(loadingStore, (state) => state.daily_logs) || false;

  useEffect(() => {
    if (metricsData.length > 0) {
      processLogsForSelectedDate(selectedDate, dailyLogsData);
    }
  }, [dailyLogsData, selectedDate, metricsData, showUnscheduled]);

  const processLogsForSelectedDate = (
    date: Date,
    logs: DailyLog[] = dailyLogsData
  ) => {
    const logsForDate = logs.filter((log) => {
      const logDate = new Date(log.date);
      return isSameDay(logDate, date);
    });

    const metricsWithLogsArray = metricsData
      .filter((metric) => metric.active)
      .map((metric) => {
        const scheduleDays = parseScheduleDays(metric.schedule_days);
        const doNotShow = metric.schedule_days
          ? Boolean(metric.schedule_days.find((el) => el === -1))
          : false;

        const metricWithParsedSchedule = {
          ...metric,
          schedule_days: scheduleDays,
        };

        const isScheduledForToday = isMetricScheduledForDate(
          metricWithParsedSchedule,
          date
        );

        const log = logsForDate.find((log) => log.metric_id === metric.id);

        return {
          ...metric,
          schedule_days: scheduleDays,
          log: log || null,
          value: log
            ? parseMetricValue(log.value, metric.type)
            : parseMetricValue(metric.default_value, metric.type),
          notes: log?.notes || "",
          hasChanged: false,
          isScheduledForToday: doNotShow ? false : isScheduledForToday,
        };
      })
      .filter((metric) => showUnscheduled || metric.isScheduledForToday);

    metricsWithLogsArray.sort((a, b) => {
      const catA = a.category_id_data?.name || "";
      const catB = b.category_id_data?.name || "";
      if (catA !== catB) return catA.localeCompare(catB);

      return a.name.localeCompare(b.name);
    });

    setMetricsWithLogs(metricsWithLogsArray);
  };

  const saveChanges = async (
    metricId: string,
    key: "value" | "notes",
    value: any
  ) => {
    try {
      const metricWithLogs = metricsWithLogs.find((el) => el.id === metricId);
      if (metricWithLogs) {
        const relatedExperimentMetrics = experimentMetricsData.filter(
          (el: any) => el.metric_id === metricId
        );

        let experimentId = null;
        if (relatedExperimentMetrics.length > 0) {
          const activeExperiments = experimentsData.filter(
            (exp: any) => exp.status === "active"
          );

          const activeExperimentIds = activeExperiments.map(
            (exp: any) => exp.id
          );

          const activeExperimentMetric = relatedExperimentMetrics.find(
            (em: any) => activeExperimentIds.includes(em.experiment_id)
          );

          if (activeExperimentMetric) {
            experimentId = activeExperimentMetric.experiment_id;
          } else if (relatedExperimentMetrics.length > 0) {
            experimentId = relatedExperimentMetrics[0].experiment_id;
          }
        }

        if (metricWithLogs.log) {
          const response = await ApiService.updateRecord(
            metricWithLogs.log.id,
            {
              ...metricWithLogs.log,
              value:
                key === "value"
                  ? JSON.stringify(value)
                  : metricWithLogs.log.value,
              notes: key === "notes" ? value : metricWithLogs.log.notes,
              experiment_id: experimentId,
            }
          );

          if (response) {
            updateEntry(metricWithLogs.log.id, response, "daily_logs");
            processLogsForSelectedDate(selectedDate);
            toast.success("Log updated successfully");
          }
        } else {
          const newLog = {
            date: selectedDate,
            metric_id: metricId,
            experiment_id: experimentId,
            value:
              key === "value"
                ? JSON.stringify(value)
                : JSON.stringify(metricWithLogs.value),
            notes: key === "notes" ? value : metricWithLogs.notes,
          };

          const response = await ApiService.addRecord("daily_logs", newLog);
          if (response) {
            processLogsForSelectedDate(selectedDate);
            addEntry(response, "daily_logs");
            toast.success("Log created successfully");
          }
        }
      }
    } catch (error) {
      console.error("Error saving daily log:", error);
      toast.error("Failed to save daily log");
    }
  };

  const categories = [
    ...new Set(
      metricsWithLogs.map((m) => m.category_id_data?.name || "Uncategorized")
    ),
  ];

  const filteredMetrics = metricsWithLogs.filter((metric) => {
    if (selectedTab === "all") return true;
    return (
      metric.category_id_data?.name?.toLowerCase() === selectedTab.toLowerCase()
    );
  });

  return (
    <div className="space-y-6">
      <div>
        {metricsLoading || dailyLogsLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-4">
            <DailyTrackerNavigation
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              currentMonth={currentMonth}
              setCurrentMonth={setCurrentMonth}
            />
            <DailyTrackerCalendarGrid
              currentMonth={currentMonth}
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
            />
            <div className="flex flex-row justify-between">
              <div className="flex gap-4 text-sm text-muted-foreground pt-2">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-primary/10 border border-primary rounded-sm mr-1"></div>
                  <span>Today</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 border border-primary/50 rounded-sm mr-1"></div>
                  <span>Has Logs</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 border flex items-center justify-center rounded-sm mr-1">
                    <Beaker className="h-2 w-2" />
                  </div>
                  <span>Active Experiment</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-50/30 dark:bg-blue-950/30 rounded-sm mr-1"></div>
                  <span>Scheduled Metrics</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 border flex items-center justify-center rounded-sm mr-1">
                    <Calendar className="h-2 w-2" />
                  </div>
                  <span>Has Scheduled Metrics</span>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={showNotes}
                    onCheckedChange={(checked) => setShowNotes(!!checked)}
                  />
                  <Label>Show notes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={showUnscheduled}
                    onCheckedChange={(checked) => setShowUnscheduled(!!checked)}
                  />
                  <Label>Show unscheduled metrics</Label>
                </div>
              </div>
            </div>
            <Separator />
            <div className="space-y-4">
              <ReusableTabs
                tabs={[
                  {
                    id: "all",
                    label: <span className="rounded-full">All</span>,
                    content: (
                      <div className="space-y-8">
                        {categories.map((category) => (
                          <div key={category} className="space-y-4">
                            <h3 className="text-lg font-semibold">
                              {category}
                            </h3>
                            <Separator />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {filteredMetrics
                                .filter(
                                  (m) =>
                                    (m.category_id_data?.name ||
                                      "Uncategorized") === category
                                )
                                .map((metric) => (
                                  <DailyTrackerViewCard
                                    key={metric.id}
                                    metric={metric}
                                    showNotes={showNotes}
                                    saveChanges={saveChanges}
                                    isScheduled={metric.isScheduledForToday}
                                  />
                                ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ),
                  },
                  ...categories.map((category) => ({
                    id: category,
                    label: <span className="rounded-full">{category}</span>,
                    content: (
                      <div className="space-y-8">
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {filteredMetrics
                              .filter(
                                (m) =>
                                  (m.category_id_data?.name ||
                                    "Uncategorized") === category
                              )
                              .map((metric) => (
                                <DailyTrackerViewCard
                                  key={metric.id}
                                  metric={metric}
                                  showNotes={showNotes}
                                  saveChanges={saveChanges}
                                  isScheduled={metric.isScheduledForToday}
                                />
                              ))}
                          </div>
                        </div>
                      </div>
                    ),
                  })),
                ]}
                defaultTabId={selectedTab}
                onChange={setSelectedTab}
                tabsListClassName="mb-4 flex flex-wrap h-auto"
                tabsContentClassName="mt-0"
              />
            </div>
            {!metricsData.length && (
              <div className="space-y-2 text-center flex flex-col items-center">
                <p className="text-muted-foreground py-8 text-center">
                  No metrics found. Add your first metric.
                </p>
                <div className="flex items-center space-x-2">
                  <AddMetricModal buttonLabel="Add Metric" />
                  <AddCategoryDialog />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
