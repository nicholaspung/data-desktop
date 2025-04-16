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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import DailyTrackerCalendarGrid from "./daily-tracker-calendar-grid";
import { isMetricScheduledForDate, parseScheduleDays } from "./schedule-utils";
import { MetricWithLog } from "@/store/experiment-definitions";

interface MetricWithLogWithChange extends MetricWithLog {
  isScheduledForToday: boolean;
}

export default function DailyTrackerCalendarView() {
  // State for calendar navigation
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [metricsWithLogs, setMetricsWithLogs] = useState<
    MetricWithLogWithChange[]
  >([]);
  const [selectedTab, setSelectedTab] = useState("all");
  const [showNotes, setShowNotes] = useState(false);
  const [showUnscheduled, setShowUnscheduled] = useState(false);

  // Access data from the store
  const metricsData = useStore(dataStore, (state) => state.metrics) || [];
  const experimentMetricsData =
    useStore(dataStore, (state) => state.experiment_metrics) || [];
  const experimentsData = useStore(dataStore, (state) => state.experiments);
  const dailyLogsData = useStore(dataStore, (state) => state.daily_logs) || [];

  // Loading state
  const metricsLoading =
    useStore(loadingStore, (state) => state.metrics) || false;
  const dailyLogsLoading =
    useStore(loadingStore, (state) => state.daily_logs) || false;

  // Effect to process logs for selected date
  useEffect(() => {
    if (metricsData.length > 0) {
      processLogsForSelectedDate(selectedDate, dailyLogsData);
    }
  }, [dailyLogsData, selectedDate, metricsData, showUnscheduled]);

  // Process logs for the selected date
  const processLogsForSelectedDate = (
    date: Date,
    logs: Record<string, any>[] = dailyLogsData
  ) => {
    // Filter logs for the selected date
    const logsForDate = logs.filter((log) => {
      const logDate = new Date(log.date);
      return isSameDay(logDate, date);
    });

    // Map logs to metrics
    const metricsWithLogsArray = (metricsData as any[])
      // First, filter inactive metrics
      .filter((metric) => metric.active)
      // Then, check if the metric is scheduled for this date
      .map((metric) => {
        // Parse schedule_days from string to array if needed
        const scheduleDays = parseScheduleDays(metric.schedule_days);

        // Create a copy of the metric with parsed schedule_days
        const metricWithParsedSchedule = {
          ...metric,
          schedule_days: scheduleDays,
        };

        // Check if metric is scheduled for the selected date
        const isScheduledForToday = isMetricScheduledForDate(
          metricWithParsedSchedule,
          date
        );

        // Find the log for this metric
        const log = logsForDate.find((log) => log.metric_id === metric.id);

        return {
          ...metric,
          schedule_days: scheduleDays, // Store the parsed schedule days
          log: log || null,
          // Parse the value based on metric type
          value: log
            ? parseMetricValue(log.value, metric.type)
            : parseMetricValue(metric.default_value, metric.type),
          notes: log?.notes || "",
          hasChanged: false,
          isScheduledForToday, // Add scheduling flag
        };
      })
      // Filter metrics based on scheduling (unless showUnscheduled is true)
      .filter((metric) => showUnscheduled || metric.isScheduledForToday);

    // Sort by category and then by name
    metricsWithLogsArray.sort((a, b) => {
      // First sort by category
      const catA = a.category_id_data?.name || "";
      const catB = b.category_id_data?.name || "";
      if (catA !== catB) return catA.localeCompare(catB);

      // Then by metric name
      return a.name.localeCompare(b.name);
    });

    setMetricsWithLogs(metricsWithLogsArray);
  };

  // Save changes to a metric log
  const saveChanges = async (
    metricId: string,
    key: "value" | "notes",
    value: any
  ) => {
    try {
      const metricWithLogs = metricsWithLogs.find((el) => el.id === metricId);
      if (metricWithLogs) {
        // Find all experiment metrics that use this metric
        const relatedExperimentMetrics = experimentMetricsData.filter(
          (el: any) => el.metric_id === metricId
        );

        // Prioritize experiment metrics from active experiments
        let experimentId = null;
        if (relatedExperimentMetrics.length > 0) {
          // Check if any of these metrics belong to active experiments
          const activeExperiments = experimentsData.filter(
            (exp: any) => exp.status === "active"
          );

          const activeExperimentIds = activeExperiments.map(
            (exp: any) => exp.id
          );

          // First try to find metrics from active experiments
          const activeExperimentMetric = relatedExperimentMetrics.find(
            (em: any) => activeExperimentIds.includes(em.experiment_id)
          );

          // If found, use this experiment ID
          if (activeExperimentMetric) {
            experimentId = activeExperimentMetric.experiment_id;
          } else if (relatedExperimentMetrics.length > 0) {
            // Otherwise just use the first related experiment
            experimentId = relatedExperimentMetrics[0].experiment_id;
          }
        }

        if (metricWithLogs.log) {
          // Update existing log
          const response = await ApiService.updateRecord(
            metricWithLogs.log.id,
            {
              ...metricWithLogs.log,
              value:
                key === "value"
                  ? JSON.stringify(value)
                  : metricWithLogs.log.value,
              notes: key === "notes" ? value : metricWithLogs.log.notes,
              experiment_id: experimentId, // Use the determined experiment ID
            }
          );

          // Update store with response
          if (response) {
            updateEntry(metricWithLogs.log.id, response, "daily_logs");
            processLogsForSelectedDate(selectedDate);
            toast.success("Log updated successfully");
          }
        } else {
          const newLog = {
            date: selectedDate,
            metric_id: metricId,
            experiment_id: experimentId, // Use the determined experiment ID
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

  // Get unique categories for tabs
  const categories = [
    ...new Set(
      metricsWithLogs.map((m) => m.category_id_data?.name || "Uncategorized")
    ),
  ];

  // Filter metrics based on selected tab
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
            {/* Detail view for the selected day */}
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

            {/* Legend */}
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

            {/* Group metrics by category */}
            <div className="space-y-4">
              {/* Category Tabs */}
              <Tabs
                defaultValue="all"
                value={selectedTab}
                onValueChange={setSelectedTab}
              >
                <TabsList className="mb-4 flex flex-wrap h-auto">
                  <TabsTrigger value="all" className="rounded-full">
                    All
                  </TabsTrigger>
                  {categories.map((category) => (
                    <TabsTrigger
                      key={category}
                      value={category}
                      className="rounded-full"
                    >
                      {category}
                    </TabsTrigger>
                  ))}
                </TabsList>

                <TabsContent value={selectedTab} className="mt-0">
                  <div className="space-y-8">
                    {/* Group metrics by category */}
                    {categories
                      .filter(
                        (category) =>
                          selectedTab === "all" || category === selectedTab
                      )
                      .map((category) => (
                        <div key={category} className="space-y-4">
                          {selectedTab === "all" && (
                            <>
                              <h3 className="text-lg font-semibold">
                                {category}
                              </h3>
                              <Separator />
                            </>
                          )}

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
                </TabsContent>
              </Tabs>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
