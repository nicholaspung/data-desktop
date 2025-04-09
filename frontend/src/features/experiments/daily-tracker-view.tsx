// src/features/experiments/daily-tracker-view.tsx
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Plus, Save, Loader2 } from "lucide-react";
import { isSameDay } from "date-fns";
import { useStore } from "@tanstack/react-store";
import dataStore, { addEntry } from "@/store/data-store";
import loadingStore from "@/store/loading-store";
import { toast } from "sonner";
import { ApiService } from "@/services/api";
import { Experiment, Metric, MetricWithLog } from "./experiments";
import TrackerControls from "./tracker-controls";
import { parseMetricValue } from "./experiments-utils";

export default function DailyTrackerView() {
  // State
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedExperiment, setSelectedExperiment] = useState<string>("");
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [metricsWithLogs, setMetricsWithLogs] = useState<MetricWithLog[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [logsChanged, setLogsChanged] = useState(false);
  const [selectedTab, setSelectedTab] = useState("all");

  // Access data from the store
  const metricsData = useStore(dataStore, (state) => state.metrics) || [];
  const experimentsData =
    useStore(dataStore, (state) => state.experiments) || [];
  const dailyLogsData = useStore(dataStore, (state) => state.daily_logs) || [];

  // Loading state
  const metricsLoading =
    useStore(loadingStore, (state) => state.metrics) || false;
  const dailyLogsLoading =
    useStore(loadingStore, (state) => state.daily_logs) || false;

  // Process data when it changes
  useEffect(() => {
    if (experimentsData.length > 0) {
      setExperiments(experimentsData as Experiment[]);
    }

    if (metricsData.length > 0) {
      processLogsForSelectedDate(selectedDate, dailyLogsData);
    }
  }, [experimentsData, dailyLogsData, selectedDate]);

  console.log(metricsData);
  console.log(dailyLogsData);

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
        hasChanged: false,
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
    setLogsChanged(false); // Reset changed flag when loading new date
  };

  // Handle value changes
  const handleValueChange = (metricId: string, newValue: any) => {
    setMetricsWithLogs((prev) =>
      prev.map((item) =>
        item.id === metricId
          ? { ...item, value: newValue, hasChanged: true }
          : item
      )
    );
    setLogsChanged(true);
  };

  // Handle notes changes
  const handleNotesChange = (metricId: string, notes: string) => {
    setMetricsWithLogs((prev) =>
      prev.map((item) =>
        item.id === metricId ? { ...item, notes, hasChanged: true } : item
      )
    );
    setLogsChanged(true);
  };

  // Save changes
  const saveChanges = async () => {
    setIsSaving(true);

    try {
      const updatedMetrics = metricsWithLogs.filter(
        (metric) => metric.hasChanged
      );

      for (const metric of updatedMetrics) {
        const value = JSON.stringify(metric.value);

        if (metric.log) {
          // Update existing log
          await ApiService.updateRecord(metric.log.id, {
            ...metric.log,
            value,
            notes: metric.notes,
            experiment_id:
              selectedExperiment || metric.log.experiment_id || null,
          });
        } else {
          // Create new log
          const newLog = {
            date: selectedDate,
            metric_id: metric.id,
            experiment_id: selectedExperiment || null,
            value,
            notes: metric.notes || "",
          };

          const response = await ApiService.addRecord("daily_logs", newLog);
          if (response) {
            addEntry(response, "daily_logs");
          }
        }
      }

      toast.success("Daily logs saved successfully");
      setLogsChanged(false);
    } catch (error) {
      console.error("Error saving daily logs:", error);
      toast.error("Failed to save daily logs");
    } finally {
      setIsSaving(false);
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
    <div className="space-y-6">
      {/* Date Navigation and Controls */}
      <TrackerControls
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        selectedExperiment={selectedExperiment}
        setSelectedExperiment={setSelectedExperiment}
        experiments={experiments}
        logsChanged={logsChanged}
        isSaving={isSaving}
        saveChanges={saveChanges}
        setMetricsWithLogs={setMetricsWithLogs}
        setLogsChanged={setLogsChanged}
        dailyLogsData={dailyLogsData as any[]}
      />

      {/* Metrics Tracking Section */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Tracking</CardTitle>
        </CardHeader>
        <CardContent>
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

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {filteredMetrics
                              .filter(
                                (m) =>
                                  (m.category_id_data?.name ||
                                    "Uncategorized") === category
                              )
                              .map((metric) => (
                                <Card
                                  key={metric.id}
                                  className={
                                    metric.hasChanged
                                      ? "border-primary border-2"
                                      : metric.log
                                        ? "border-green-500 border"
                                        : ""
                                  }
                                >
                                  <CardContent className="p-4">
                                    <div className="flex justify-between items-start mb-2">
                                      <div>
                                        <h4 className="font-medium">
                                          {metric.name}
                                        </h4>
                                        <p className="text-sm text-muted-foreground">
                                          {metric.description}
                                        </p>
                                      </div>
                                      {metric.log && (
                                        <Badge
                                          variant="outline"
                                          className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                                        >
                                          Logged
                                        </Badge>
                                      )}
                                      {metric.hasChanged && (
                                        <Badge
                                          variant="outline"
                                          className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                                        >
                                          Changed
                                        </Badge>
                                      )}
                                    </div>

                                    {/* Render appropriate input based on metric type */}
                                    <div className="mt-4">
                                      {metric.type === "boolean" ? (
                                        <div className="flex items-center space-x-2">
                                          <Checkbox
                                            id={`metric-${metric.id}`}
                                            checked={!!metric.value}
                                            onCheckedChange={(checked) =>
                                              handleValueChange(
                                                metric.id,
                                                !!checked
                                              )
                                            }
                                          />
                                          <Label
                                            htmlFor={`metric-${metric.id}`}
                                          >
                                            Completed
                                          </Label>
                                        </div>
                                      ) : metric.type === "number" ||
                                        metric.type === "percentage" ||
                                        metric.type === "time" ? (
                                        <div className="space-y-2">
                                          <Label
                                            htmlFor={`metric-${metric.id}`}
                                          >
                                            Value{" "}
                                            {metric.unit
                                              ? `(${metric.unit})`
                                              : ""}
                                          </Label>
                                          <Input
                                            id={`metric-${metric.id}`}
                                            type="number"
                                            value={metric.value}
                                            onChange={(e) =>
                                              handleValueChange(
                                                metric.id,
                                                parseFloat(e.target.value) || 0
                                              )
                                            }
                                          />
                                        </div>
                                      ) : (
                                        <div className="space-y-2">
                                          <Label
                                            htmlFor={`metric-${metric.id}`}
                                          >
                                            Value
                                          </Label>
                                          <Input
                                            id={`metric-${metric.id}`}
                                            value={metric.value}
                                            onChange={(e) =>
                                              handleValueChange(
                                                metric.id,
                                                e.target.value
                                              )
                                            }
                                          />
                                        </div>
                                      )}
                                    </div>

                                    {/* Notes field */}
                                    <div className="mt-4 space-y-2">
                                      <Label htmlFor={`notes-${metric.id}`}>
                                        Notes (Optional)
                                      </Label>
                                      <Input
                                        id={`notes-${metric.id}`}
                                        value={metric.notes || ""}
                                        onChange={(e) =>
                                          handleNotesChange(
                                            metric.id,
                                            e.target.value
                                          )
                                        }
                                        placeholder="Add notes..."
                                      />
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                          </div>
                        </div>
                      ))}
                  </div>
                </TabsContent>
              </Tabs>

              {/* Save button at bottom too for convenience */}
              {logsChanged && (
                <div className="mt-6 flex justify-end">
                  <Button disabled={isSaving} onClick={saveChanges}>
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
