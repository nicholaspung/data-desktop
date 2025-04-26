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
import ReusableTabs from "@/components/reusable/reusable-tabs";

const QuickMetricLogger = () => {
  // State
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showOnlyIncomplete, setShowOnlyIncomplete] = useState(false);
  const [showCalendarTracked, setShowCalendarTracked] = useState<
    "all" | "tracked" | "nottracked"
  >("all");
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  });
  const [viewMode, setViewMode] = useState<"list" | "cards">("cards");

  const metrics = useStore(dataStore, (state) => state.metrics) || [];
  const dailyLogs = useStore(dataStore, (state) => state.daily_logs) || [];
  const categories =
    useStore(dataStore, (state) => state.metric_categories) || [];

  useEffect(() => {
    setSelectedDate(startOfDay(selectedDate));
  }, []);

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

  const filteredMetrics = useMemo(() => {
    return metrics.filter((metric: Metric) => {
      if (!metric.active) return false;

      const matchesSearch =
        !searchTerm ||
        metric.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (metric.description &&
          metric.description.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesCategory =
        selectedCategories.length === 0 ||
        (metric.category_id &&
          selectedCategories.includes(
            categories.find((c) => c.id === metric.category_id)?.name || ""
          ));

      const matchesCalendarTracked =
        showCalendarTracked === "all" ||
        (showCalendarTracked === "tracked" &&
          !metric.schedule_days?.includes(-1)) ||
        (showCalendarTracked === "nottracked" &&
          metric.schedule_days?.includes(-1));

      if (showOnlyIncomplete) {
        const selectedDateString = format(selectedDate, "yyyy-MM-dd");

        const todayLog = dailyLogs.find((log: DailyLog) => {
          const logDate = new Date(log.date);
          const logDateString = format(logDate, "yyyy-MM-dd");
          return (
            log.metric_id === metric.id && logDateString === selectedDateString
          );
        });

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

    Object.keys(result).forEach((category) => {
      result[category].sort((a, b) => a.name.localeCompare(b.name));
    });

    return result;
  }, [filteredMetrics, categories]);

  const isMetricCompleted = (metric: Metric) => {
    const selectedDateString = format(selectedDate, "yyyy-MM-dd");

    const todayLog = dailyLogs.find((log: DailyLog) => {
      let logDate;
      if (typeof log.date === "string") {
        logDate = new Date(log.date);
        logDate.setHours(0, 0, 0, 0);
      } else {
        logDate = new Date(log.date);
        logDate.setHours(0, 0, 0, 0);
      }

      const logDateString = format(logDate, "yyyy-MM-dd");
      return (
        log.metric_id === metric.id && logDateString === selectedDateString
      );
    });

    if (!todayLog) return false;

    if (metric.type === "boolean") {
      try {
        return JSON.parse(todayLog.value) === true;
      } catch (e) {
        console.error(e);
        return false;
      }
    }

    return true;
  };

  const toggleMetricCompletion = async (metric: Metric) => {
    if (metric.type !== "boolean") return;

    const selectedDateString = format(selectedDate, "yyyy-MM-dd");

    const todayLog = dailyLogs.find((log: DailyLog) => {
      const logDate = new Date(log.date);
      const logDateString = format(logDate, "yyyy-MM-dd");
      return (
        log.metric_id === metric.id && logDateString === selectedDateString
      );
    });

    try {
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
      } else {
        const newLog = {
          date: selectedDate,
          metric_id: metric.id,
          value: "true",
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

  const toggleCalendarTracking = async (metric: Metric) => {
    try {
      let scheduleDays = [...(metric.schedule_days || [])];

      if (scheduleDays.includes(-1)) {
        scheduleDays = scheduleDays.filter((day) => day !== -1);
      } else {
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

  const hasNoMetrics = metrics.length ? false : true;

  return (
    <div className="space-y-6">
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
          <Button
            onClick={() => {
              const newDate = new Date();
              newDate.setHours(0, 0, 0, 0);
              setSelectedDate(newDate);
            }}
            size="sm"
            variant="outline"
          >
            Today
          </Button>
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
                <ReusableTabs
                  tabs={[
                    { id: "all", label: "All", content: null },
                    { id: "tracked", label: "Tracked", content: null },
                    { id: "nottracked", label: "Not Tracked", content: null },
                  ]}
                  defaultTabId={showCalendarTracked}
                  onChange={(v) => setShowCalendarTracked(v as any)}
                  className="w-full"
                  tabsListClassName="w-full grid grid-cols-3"
                />
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
      {hasNoMetrics && (
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
      {!hasNoMetrics && Object.keys(groupedMetrics).length === 0 ? (
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
