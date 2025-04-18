// src/features/daily-tracker/quick-metric-logger.tsx
import { useState, useMemo, useEffect } from "react";
import { useStore } from "@tanstack/react-store";
import { format, startOfDay } from "date-fns";
import { Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ReusableCard from "@/components/reusable/reusable-card";
import dataStore, {
  addEntry,
  deleteEntry,
  updateEntry,
} from "@/store/data-store";
import { Metric, DailyLog } from "@/store/experiment-definitions";
import { toast } from "sonner";
import { ApiService } from "@/services/api";
import AddMetricModal from "./add-metric-modal";
import AddCategoryDialog from "./add-category-dialog";
import QuickMetricLoggerListItem from "./quick-metric-logger-list-item";
import QuickMetricLoggerCardItem from "./quick-metric-logger-card-item";

const QuickMetricLogger = () => {
  // State
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showOnlyIncomplete, setShowOnlyIncomplete] = useState(false);
  const [showCalendarTracked, setShowCalendarTracked] = useState<
    "all" | "tracked" | "nottracked"
  >("all");
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    // Create a date at midnight local time to avoid timezone issues
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  });
  const [viewMode, setViewMode] = useState<"list" | "cards">("cards");

  // Access store data
  const metrics = useStore(dataStore, (state) => state.metrics) || [];
  const dailyLogs = useStore(dataStore, (state) => state.daily_logs) || [];
  const categories =
    useStore(dataStore, (state) => state.metric_categories) || [];

  // Ensure selected date stays in sync with startOfDay
  useEffect(() => {
    // Keep selected date at start of day to avoid time-of-day complications
    setSelectedDate(startOfDay(selectedDate));
  }, []);

  // Get all unique categories from metrics
  const uniqueCategories = useMemo(() => {
    const categorySet = new Set<string>();
    metrics.forEach((metric: Metric) => {
      if (metric.category_id) {
        const category = categories.find((c) => c.id === metric.category_id);
        if (category) {
          categorySet.add(category.name);
        }
      }
    });
    return Array.from(categorySet).sort();
  }, [metrics, categories]);

  // Filter metrics based on search, categories, and completion status
  const filteredMetrics = useMemo(() => {
    return metrics.filter((metric: Metric) => {
      // Skip inactive metrics
      if (!metric.active) return false;

      // Check search term
      const matchesSearch =
        !searchTerm ||
        metric.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (metric.description &&
          metric.description.toLowerCase().includes(searchTerm.toLowerCase()));

      // Check categories
      const matchesCategory =
        selectedCategories.length === 0 ||
        (metric.category_id &&
          selectedCategories.includes(
            categories.find((c) => c.id === metric.category_id)?.name || ""
          ));

      // Check if metric has a calendar display attribute
      const matchesCalendarTracked =
        showCalendarTracked === "all" ||
        (showCalendarTracked === "tracked" &&
          !metric.schedule_days?.includes(-1)) ||
        (showCalendarTracked === "nottracked" &&
          metric.schedule_days?.includes(-1));

      // Check if metric is completed for today
      if (showOnlyIncomplete) {
        // Use startOfDay format for consistent date comparison
        const selectedDateString = format(selectedDate, "yyyy-MM-dd");

        const todayLog = dailyLogs.find((log: DailyLog) => {
          const logDate = new Date(log.date);
          const logDateString = format(logDate, "yyyy-MM-dd");
          return (
            log.metric_id === metric.id && logDateString === selectedDateString
          );
        });

        // For boolean metrics, we consider them incomplete if there's no log or the log value is false
        if (metric.type === "boolean") {
          if (!todayLog)
            return matchesSearch && matchesCategory && matchesCalendarTracked;
          try {
            const value = JSON.parse(todayLog.value);
            return (
              !value &&
              matchesSearch &&
              matchesCategory &&
              matchesCalendarTracked
            );
          } catch (e) {
            console.error(e);
            return matchesSearch && matchesCategory && matchesCalendarTracked;
          }
        }

        // For non-boolean metrics, we consider them incomplete if there's no log
        return (
          !todayLog &&
          matchesSearch &&
          matchesCategory &&
          matchesCalendarTracked
        );
      }

      return matchesSearch && matchesCategory && matchesCalendarTracked;
    });
  }, [
    metrics,
    searchTerm,
    selectedCategories,
    showOnlyIncomplete,
    dailyLogs,
    selectedDate,
    showCalendarTracked,
    categories,
  ]);

  // Group metrics by category for card view
  const groupedMetrics = useMemo(() => {
    const result: Record<string, Metric[]> = {};

    filteredMetrics.forEach((metric: Metric) => {
      const categoryId = metric.category_id;
      const category = categories.find((c) => c.id === categoryId);
      const categoryName = category ? category.name : "Uncategorized";

      if (!result[categoryName]) {
        result[categoryName] = [];
      }

      result[categoryName].push(metric);
    });

    // Sort metrics by name within each category
    Object.keys(result).forEach((category) => {
      result[category].sort((a, b) => a.name.localeCompare(b.name));
    });

    return result;
  }, [filteredMetrics, categories]);

  // Check if a metric is completed for the selected date
  const isMetricCompleted = (metric: Metric) => {
    // Use consistent date format for comparison
    const selectedDateString = format(selectedDate, "yyyy-MM-dd");

    const todayLog = dailyLogs.find((log: DailyLog) => {
      // Ensure log date is also processed as YYYY-MM-DD local time
      let logDate;
      if (typeof log.date === "string") {
        // Handle string date format
        // Add T00:00:00 to ensure it's parsed in local timezone
        logDate = new Date(log.date);
        logDate.setHours(0, 0, 0, 0);
      } else {
        // Handle Date object
        logDate = new Date(log.date);
        logDate.setHours(0, 0, 0, 0);
      }

      const logDateString = format(logDate, "yyyy-MM-dd");
      return (
        log.metric_id === metric.id && logDateString === selectedDateString
      );
    });

    if (!todayLog) return false;

    // For boolean metrics, we check if the value is true
    if (metric.type === "boolean") {
      try {
        return JSON.parse(todayLog.value) === true;
      } catch (e) {
        console.error(e);
        return false;
      }
    }

    // For other metrics, we consider them completed if there's a log
    return true;
  };

  // Toggle completion for a boolean metric
  const toggleMetricCompletion = async (metric: Metric) => {
    if (metric.type !== "boolean") return;

    // Use consistent date format for comparison
    const selectedDateString = format(selectedDate, "yyyy-MM-dd");

    const todayLog = dailyLogs.find((log: DailyLog) => {
      const logDate = new Date(log.date);
      const logDateString = format(logDate, "yyyy-MM-dd");
      return (
        log.metric_id === metric.id && logDateString === selectedDateString
      );
    });

    try {
      // If log exists, toggle its value
      if (todayLog) {
        let currentValue;
        try {
          currentValue = JSON.parse(todayLog.value);
        } catch (e) {
          console.error(e);
          currentValue = todayLog.value === "true";
        }

        const newValue = !currentValue;

        const updatedLog = {
          ...todayLog,
          value: JSON.stringify(newValue),
        };

        const response = await ApiService.updateRecord(todayLog.id, updatedLog);
        if (response) {
          updateEntry(todayLog.id, response, "daily_logs");
          toast.success(
            `${metric.name} ${newValue ? "completed" : "uncompleted"}`
          );
        }
      }
      // If no log exists, create a new one
      else {
        const newLog = {
          date: selectedDate,
          metric_id: metric.id,
          value: "true", // JSON.stringify(true)
          notes: "",
        };

        const response = await ApiService.addRecord("daily_logs", newLog);
        if (response) {
          addEntry(response, "daily_logs");
          toast.success(`${metric.name} completed`);
        }
      }
    } catch (error) {
      console.error("Error updating metric:", error);
      toast.error("Failed to update metric");
    }
  };

  // Toggle calendar tracking for a metric
  const toggleCalendarTracking = async (metric: Metric) => {
    try {
      let scheduleDays = [...(metric.schedule_days || [])];

      // If -1 exists, remove it (enable calendar tracking)
      if (scheduleDays.includes(-1)) {
        scheduleDays = scheduleDays.filter((day) => day !== -1);
      }
      // Otherwise, add it (disable calendar tracking)
      else {
        scheduleDays.push(-1);
      }

      const updatedMetric = {
        ...metric,
        schedule_days: scheduleDays,
      };

      const response = await ApiService.updateRecord(metric.id, updatedMetric);
      if (response) {
        updateEntry(metric.id, response, "metrics");
        toast.success(
          `${metric.name} ${scheduleDays.includes(-1) ? "removed from" : "added to"} calendar tracking`
        );
      }
    } catch (error) {
      console.error("Error updating metric calendar tracking:", error);
      toast.error("Failed to update metric settings");
    }
  };

  // Delete a metric
  const handleDeleteMetric = async (metric: Metric) => {
    try {
      await ApiService.deleteRecord(metric.id);
      deleteEntry(metric.id, "metrics");
      toast.success("Metric deleted successfully");
    } catch (error) {
      console.error("Error deleting metric:", error);
      toast.error("Failed to delete metric");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold">Quick Metric Logger</h1>

        <div className="flex items-center space-x-2">
          <AddMetricModal buttonLabel="Add Metric" />
          <AddCategoryDialog />
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative w-full md:w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search metrics..."
            className="pl-8 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <Input
            type="date"
            value={format(selectedDate, "yyyy-MM-dd")}
            onChange={(e) => {
              if (e.target.value) {
                // Create a date object at midnight local time for the selected date
                const newDate = new Date(e.target.value + "T00:00:00");
                newDate.setHours(0, 0, 0, 0);
                setSelectedDate(newDate);
              }
            }}
            className="w-40"
          />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Categories</DropdownMenuLabel>
              {uniqueCategories.map((category) => (
                <DropdownMenuCheckboxItem
                  key={category}
                  checked={selectedCategories.includes(category)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedCategories([...selectedCategories, category]);
                    } else {
                      setSelectedCategories(
                        selectedCategories.filter((c) => c !== category)
                      );
                    }
                  }}
                >
                  {category}
                </DropdownMenuCheckboxItem>
              ))}

              <DropdownMenuSeparator />

              <DropdownMenuLabel>Options</DropdownMenuLabel>
              <div className="p-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="incomplete-only">Show incomplete only</Label>
                  <Switch
                    id="incomplete-only"
                    checked={showOnlyIncomplete}
                    onCheckedChange={setShowOnlyIncomplete}
                  />
                </div>
              </div>

              <DropdownMenuSeparator />

              <DropdownMenuLabel>Calendar Tracking</DropdownMenuLabel>
              <div className="p-2">
                <Tabs
                  value={showCalendarTracked}
                  onValueChange={(v) => setShowCalendarTracked(v as any)}
                  className="w-full"
                >
                  <TabsList className="w-full grid grid-cols-3">
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="tracked">Tracked</TabsTrigger>
                    <TabsTrigger value="nottracked">Not Tracked</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant={viewMode === "cards" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("cards")}
          >
            Cards
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("list")}
          >
            List
          </Button>
        </div>
      </div>

      {Object.keys(groupedMetrics).length === 0 ? (
        <ReusableCard
          title="No metrics found"
          content={
            <p className="text-muted-foreground py-8 text-center">
              No metrics match your filter criteria.
            </p>
          }
        />
      ) : (
        <div className="space-y-4">
          {viewMode === "list" ? (
            <div className="space-y-6">
              <QuickMetricLoggerListItem
                groupedMetrics={groupedMetrics}
                isMetricCompleted={isMetricCompleted}
                toggleMetricCompletion={toggleMetricCompletion}
                toggleCalendarTracking={toggleCalendarTracking}
                handleDeleteMetric={handleDeleteMetric}
              />
            </div>
          ) : (
            <QuickMetricLoggerCardItem
              groupedMetrics={groupedMetrics}
              isMetricCompleted={isMetricCompleted}
              toggleMetricCompletion={toggleMetricCompletion}
              toggleCalendarTracking={toggleCalendarTracking}
              dailyLogs={dailyLogs}
              selectedDate={selectedDate}
              handleDeleteMetric={handleDeleteMetric}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default QuickMetricLogger;
