// src/features/experiments/daily-tracker-view.tsx
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Plus, Loader2, ClipboardCheck } from "lucide-react";
import { isSameDay, subDays } from "date-fns";
import { useStore } from "@tanstack/react-store";
import dataStore, { addEntry, updateEntry } from "@/store/data-store";
import loadingStore from "@/store/loading-store";
import { Metric, MetricWithLog } from "./experiments";
import { parseMetricValue } from "./experiments-utils";
import { toast } from "sonner";
import DailyTrackerNavigation from "./daily-tracker-navigation";
import { ApiService } from "@/services/api";
import DailyTrackerViewCard from "./daily-tracker-view-card";

export default function DailyTrackerView() {
  // State
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [metricsWithLogs, setMetricsWithLogs] = useState<MetricWithLog[]>([]);
  const [selectedTab, setSelectedTab] = useState("all");
  const [showNotes, setShowNotes] = useState(false);

  // Access data from the store
  const metricsData = useStore(dataStore, (state) => state.metrics) || [];
  const experimentMetricsData =
    useStore(dataStore, (state) => state.experiment_metrics) || [];
  const dailyLogsData = useStore(dataStore, (state) => state.daily_logs) || [];

  // Loading state
  const metricsLoading =
    useStore(loadingStore, (state) => state.metrics) || false;
  const dailyLogsLoading =
    useStore(loadingStore, (state) => state.daily_logs) || false;

  // Process data when it changes
  useEffect(() => {
    if (metricsData.length > 0) {
      processLogsForSelectedDate(selectedDate, dailyLogsData);
    }
  }, [dailyLogsData, selectedDate]);

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
    const metricsWithLogsArray = (metricsData as Metric[]).map((metric) => {
      const log = logsForDate.find((log) => log.metric_id === metric.id);
      return {
        ...metric,
        log: log || null,
        // Parse the value based on metric type
        value: log
          ? parseMetricValue(log.value, metric.type)
          : parseMetricValue(metric.default_value, metric.type),
        notes: log?.notes || "",
      };
    });

    // Sort by category and then by name
    metricsWithLogsArray.sort((a, b) => {
      // First sort by category
      const catA = a.category_id_data?.name || "";
      const catB = b.category_id_data?.name || "";
      if (catA !== catB) return catA.localeCompare(catB);

      // Then by metric name
      return a.name.localeCompare(b.name);
    });

    setMetricsWithLogs(metricsWithLogsArray as MetricWithLog[]);
  };

  const saveChanges = async (
    metricId: string,
    key: "value" | "notes",
    value: any
  ) => {
    try {
      const metricWithLogs = metricsWithLogs.find((el) => el.id === metricId);
      if (metricWithLogs) {
        const experimentMetric = experimentMetricsData.filter(
          (el) => el.metric_id === metricId
        );
        if (metricWithLogs.log) {
          // Update existing log
          const response = await ApiService.updateRecord(
            metricWithLogs.log.id,
            {
              ...metricWithLogs.log,
              value:
                key === "value" ? JSON.stringify(value) : metricWithLogs.value,
              notes: key === "notes" ? value : metricWithLogs.notes,
              experiment_id: experimentMetric.length
                ? experimentMetric[0].experiment_id
                : null,
            }
          );

          updateEntry(metricWithLogs.log.id, response, "daily_logs");
        } else {
          const newLog = {
            date: selectedDate,
            metric_id: metricId,
            experiment_id: experimentMetric.length
              ? experimentMetric[0].experiment_id
              : null,
            value:
              key === "value" ? JSON.stringify(value) : metricWithLogs.value,
            notes: key === "notes" ? value : metricWithLogs.notes,
          };

          const response = await ApiService.addRecord("daily_logs", newLog);
          if (response) {
            addEntry(response, "daily_logs");
          }
        }
      }

      toast.success("Daily log saved successfully");
    } catch (error) {
      console.error("Error saving daily log:", error);
      toast.error("Failed to save daily log");
    }
  };

  // Filter metrics based on selected tab
  const filteredMetrics = metricsWithLogs.filter((metric) => {
    if (selectedTab === "all") return true;
    return (
      metric.category_id_data?.name.toLowerCase() === selectedTab.toLowerCase()
    );
  });

  // Get unique categories for tabs
  const categories = [
    ...new Set(
      metricsWithLogs.map((m) => m.category_id_data?.name || "Uncategorized")
    ),
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <div className="flex flex-row justify-between">
            <span>Daily Tracking</span>
            {/* Quick Action Buttons */}
            <div className="flex gap-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={showNotes}
                  onCheckedChange={(checked) => setShowNotes(!!checked)}
                />
                <Label>Show notes</Label>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => {
                  // Mark all boolean metrics as completed
                  setMetricsWithLogs((prev) =>
                    prev.map((item) =>
                      item.type === "boolean" ? { ...item, value: true } : item
                    )
                  );
                }}
              >
                <ClipboardCheck className="h-4 w-4 mr-2" />
                Complete All
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => {
                  // Set today to use yesterday's values as starting point
                  const yesterday = subDays(selectedDate, 1);
                  const yesterdayLogs = dailyLogsData.filter((log: any) => {
                    const logDate = new Date(log.date);
                    return isSameDay(logDate, yesterday);
                  });

                  if (yesterdayLogs.length === 0) {
                    toast.info("No logs found for yesterday");
                    return;
                  }

                  // Copy yesterday's logs but mark them as changed
                  setMetricsWithLogs((prev) =>
                    prev.map((item) => {
                      const yesterdayLog: any = yesterdayLogs.find(
                        (log: any) => log.metric_id === item.id
                      );
                      if (!yesterdayLog) return item;

                      return {
                        ...item,
                        value: parseMetricValue(yesterdayLog.value, item.type),
                        notes: yesterdayLog.notes || "",
                      };
                    })
                  );
                  toast.success("Copied yesterday's values");
                }}
              >
                Copy Yesterday
              </Button>
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <DailyTrackerNavigation
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
        />
        {metricsLoading || dailyLogsLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : metricsWithLogs.length === 0 ? (
          <div className="text-center p-8">
            <p className="text-muted-foreground">No metrics defined yet.</p>
            <Button variant="outline" className="mt-4" asChild>
              <a href="/experiments?tab=metrics">
                <Plus className="h-4 w-4 mr-2" />
                Create Metrics
              </a>
            </Button>
          </div>
        ) : (
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

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                              />
                            ))}
                        </div>
                      </div>
                    ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
