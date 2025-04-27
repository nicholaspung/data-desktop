// src/features/dashboard/quick-metric-logger-dashboard-summary.tsx
import { useState, useRef, useEffect } from "react";
import { useStore } from "@tanstack/react-store";
import { format, parseISO, startOfDay } from "date-fns";
import { CheckCircle2, Circle, Lock, ClipboardCheck } from "lucide-react";
import { Link } from "@tanstack/react-router";
import dataStore, { addEntry } from "@/store/data-store";
import { ApiService } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  ProtectedContent,
  ProtectedField,
} from "@/components/security/protected-content";
import { usePin } from "@/hooks/usePin";
import ReusableSummary from "@/components/reusable/reusable-summary";
import { Metric, DailyLog } from "@/store/experiment-definitions";

export default function QuickMetricLoggerDashboardSummary() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date>(
    startOfDay(new Date())
  );
  const [dateString, setDateString] = useState(
    format(new Date(), "yyyy-MM-dd")
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<Metric | null>(null);
  const [metricValue, setMetricValue] = useState<string | number | boolean>("");
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const commandRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Access PIN state
  const { isUnlocked } = usePin();

  // Ref to prevent infinite update loops
  const isDateUpdating = useRef(false);

  const metrics = useStore(dataStore, (state) => state.metrics) || [];
  const dailyLogs = useStore(dataStore, (state) => state.daily_logs) || [];
  const categories =
    useStore(dataStore, (state) => state.metric_categories) || [];

  useEffect(() => {
    // Simulate loading
    setTimeout(() => setIsLoading(false), 300);
  }, []);

  // Handle click outside to close command
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        commandRef.current &&
        !commandRef.current.contains(event.target as Node)
      ) {
        setIsCommandOpen(false);
      }
    };

    if (isCommandOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isCommandOpen]);

  // Handle date string changes from the input
  const handleDateStringChange = (value: string) => {
    if (isDateUpdating.current) return;

    isDateUpdating.current = true;
    setDateString(value);

    try {
      // Parse date string to Date object and normalize to start of day
      const date = startOfDay(parseISO(value));
      if (!isNaN(date.getTime())) {
        setSelectedDate(date);
        setSelectedMetric(null);
      }
    } catch (error) {
      console.error("Error parsing date:", error);
    }

    setTimeout(() => {
      isDateUpdating.current = false;
    }, 0);
  };

  // Compare dates by converting to ISO date strings (YYYY-MM-DD)
  const isSameLocalDate = (date1: Date, date2: Date): boolean => {
    return format(date1, "yyyy-MM-dd") === format(date2, "yyyy-MM-dd");
  };

  // Check if a metric has been logged for the current date
  const isMetricLogged = (metricId: string): boolean => {
    return dailyLogs.some((log: DailyLog) => {
      const logDate = new Date(log.date);
      return (
        log.metric_id === metricId && isSameLocalDate(logDate, selectedDate)
      );
    });
  };

  // Filter metrics based on search term and exclude already logged metrics
  const filteredMetrics = metrics.filter((metric: Metric) => {
    // Skip inactive metrics
    if (!metric.active) return false;

    // Skip metrics that have already been logged for this date
    if (isMetricLogged(metric.id)) return false;

    // Filter by search term - for private metrics, only match on id if it's locked
    const matchesSearch =
      searchTerm.length === 0
        ? true
        : !metric.private || isUnlocked
          ? metric.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (metric.description &&
              metric.description
                .toLowerCase()
                .includes(searchTerm.toLowerCase()))
          : metric.id.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  // Group metrics by category
  const groupedMetrics = filteredMetrics.reduce(
    (acc: Record<string, Metric[]>, metric) => {
      const categoryId = metric.category_id;
      const category = categories.find((c) => c.id === categoryId);
      const categoryName = category ? category.name : "Uncategorized";

      if (!acc[categoryName]) {
        acc[categoryName] = [];
      }

      acc[categoryName].push(metric);
      return acc;
    },
    {}
  );

  // Handle metric selection with special handling for private metrics
  const handleSelectMetric = (metric: Metric) => {
    setSelectedMetric(metric);
    setIsCommandOpen(false);

    // Set default value based on metric type
    if (metric.type === "boolean") {
      setMetricValue(false);
    } else if (metric.type === "number" || metric.type === "percentage") {
      setMetricValue(0);
    } else {
      setMetricValue("");
    }
  };

  // Log the metric
  const handleLogMetric = async () => {
    if (!selectedMetric) return;

    setIsSubmitting(true);

    try {
      const stringValue =
        selectedMetric.type === "boolean"
          ? JSON.stringify(metricValue)
          : typeof metricValue === "number"
            ? JSON.stringify(metricValue)
            : String(metricValue);

      // Create new log
      const newLog = {
        date: selectedDate,
        metric_id: selectedMetric.id,
        value: stringValue,
      };

      const response = await ApiService.addRecord("daily_logs", newLog);

      if (response) {
        addEntry(response, "daily_logs");
        toast.success(
          `Logged ${selectedMetric.private ? "entry" : selectedMetric.name}`
        );
      }

      // Reset form
      setSelectedMetric(null);
      setMetricValue("");
      setSearchTerm("");
    } catch (error) {
      console.error("Error logging metric:", error);
      toast.error("Failed to log metric");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render metric name and description with optional protection
  const renderMetricNameAndDescription = (metric: Metric) => {
    if (metric.private) {
      return (
        <ProtectedField>
          <div className="flex flex-col">
            <span>{metric.name}</span>
            {metric.description && (
              <span className="text-xs text-muted-foreground">
                {metric.description}
              </span>
            )}
          </div>
        </ProtectedField>
      );
    }

    return (
      <div className="flex flex-col">
        <span>{metric.name}</span>
        {metric.description && (
          <span className="text-xs text-muted-foreground">
            {metric.description}
          </span>
        )}
      </div>
    );
  };

  // Custom main content that will span the full width
  const fullWidthContent = (
    <>
      {Object.keys(groupedMetrics).length === 0 ? (
        <div className="text-center py-6 text-muted-foreground">
          <p>No metrics available to log for this date</p>
          <Link to="/metric">
            <Button variant="outline" className="mt-2">
              Manage metrics
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Date selector */}
          <div className="flex flex-col space-y-1.5">
            <Label htmlFor="date">Date</Label>
            <Input
              type="date"
              value={dateString}
              onChange={(e) => handleDateStringChange(e.target.value)}
              className="w-full"
            />
          </div>

          {/* Metric selector */}
          <div className="flex flex-col space-y-1.5">
            <Label>Select Metric</Label>
            <div className="relative" ref={commandRef}>
              <Command className="rounded-lg border shadow-md">
                <CommandInput
                  placeholder="Search metrics..."
                  value={searchTerm}
                  onValueChange={setSearchTerm}
                  onFocus={() => setIsCommandOpen(true)}
                />

                {isCommandOpen && (
                  <CommandList className="max-h-52 overflow-auto">
                    {Object.keys(groupedMetrics).length === 0 ? (
                      <CommandEmpty>
                        {searchTerm
                          ? "No matching metrics found"
                          : "All metrics have been logged for this date"}
                      </CommandEmpty>
                    ) : (
                      Object.entries(groupedMetrics).map(
                        ([category, categoryMetrics]) => (
                          <CommandGroup key={category} heading={category}>
                            {categoryMetrics.map((metric) => (
                              <CommandItem
                                key={metric.id}
                                // Use id as the value for uniqueness
                                value={metric.id}
                                onSelect={() => handleSelectMetric(metric)}
                                className="flex items-center justify-between"
                              >
                                {renderMetricNameAndDescription(metric)}
                                <div className="flex items-center">
                                  {metric.private && (
                                    <Lock className="h-3.5 w-3.5 mr-1.5 text-amber-500" />
                                  )}
                                  <Badge variant="outline">{metric.type}</Badge>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        )
                      )
                    )}
                  </CommandList>
                )}
              </Command>
            </div>
          </div>

          {/* Selected metric form */}
          {selectedMetric && (
            <div className="space-y-4 p-3 border rounded-md">
              <div className="flex justify-between items-start">
                {selectedMetric.private ? (
                  <ProtectedContent>
                    <div>
                      <h4 className="font-medium">{selectedMetric.name}</h4>
                      {selectedMetric.description && (
                        <p className="text-sm text-muted-foreground">
                          {selectedMetric.description}
                        </p>
                      )}
                    </div>
                  </ProtectedContent>
                ) : (
                  <div>
                    <h4 className="font-medium">{selectedMetric.name}</h4>
                    {selectedMetric.description && (
                      <p className="text-sm text-muted-foreground">
                        {selectedMetric.description}
                      </p>
                    )}
                  </div>
                )}
                <Badge variant="outline" className="flex items-center gap-1">
                  {selectedMetric.private && (
                    <Lock className="h-3 w-3 text-amber-500" />
                  )}
                  {selectedMetric.type}
                  {selectedMetric.unit ? ` (${selectedMetric.unit})` : ""}
                </Badge>
              </div>

              <div className="space-y-2">
                <Label htmlFor="value">Value</Label>

                {selectedMetric.type === "boolean" ? (
                  <div className="flex items-center space-x-2">
                    <Button
                      variant={metricValue === true ? "default" : "outline"}
                      size="sm"
                      onClick={() => setMetricValue(true)}
                      className="w-20"
                    >
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      Yes
                    </Button>
                    <Button
                      variant={metricValue === false ? "default" : "outline"}
                      size="sm"
                      onClick={() => setMetricValue(false)}
                      className="w-20"
                    >
                      <Circle className="h-4 w-4 mr-1" />
                      No
                    </Button>
                  </div>
                ) : selectedMetric.type === "number" ||
                  selectedMetric.type === "percentage" ? (
                  <Input
                    id="value"
                    type="number"
                    value={metricValue as number}
                    onChange={(e) =>
                      setMetricValue(parseFloat(e.target.value) || 0)
                    }
                    placeholder={`Enter ${selectedMetric.type}`}
                  />
                ) : (
                  <Input
                    id="value"
                    value={metricValue as string}
                    onChange={(e) => setMetricValue(e.target.value)}
                    placeholder="Enter value"
                  />
                )}
              </div>

              <Button
                onClick={handleLogMetric}
                disabled={isSubmitting}
                className="w-full"
              >
                {isSubmitting ? "Saving..." : "Log Metric"}
              </Button>
            </div>
          )}
        </div>
      )}
    </>
  );

  return (
    <ReusableSummary
      title="Quick Metric Logger"
      titleIcon={<ClipboardCheck className="h-5 w-5" />}
      linkText="View all"
      linkTo="/metric"
      loading={isLoading}
      emptyState={
        metrics.length === 0
          ? {
              message: "No metric data available",
              actionText: "Add your first metric",
              actionTo: "/metric",
            }
          : undefined
      }
      // Instead of using mainSection, directly provide the content in the customContent property
      customContent={fullWidthContent}
      // Set className to ensure full width
      className="h-full"
      contentClassName="p-4"
    />
  );
}
