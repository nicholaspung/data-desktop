import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Calendar,
  FileText,
  Heart,
  Activity,
  DollarSign,
  Clock,
  Users,
  BookOpen,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Check,
} from "lucide-react";
import { useStore } from "@tanstack/react-store";
import dataStore from "@/store/data-store";
import { fieldDefinitionsStore } from "@/features/field-definitions/field-definitions-store";
import settingsStore from "@/store/settings-store";
import { format, differenceInDays, differenceInHours } from "date-fns";
import FieldValueDisplay from "@/components/reusable/field-value-display";
import ReusableMultiSelect, {
  MultiSelectOption,
} from "@/components/reusable/reusable-multiselect";
import { getDisplayValue } from "@/lib/table-utils";
import { usePin } from "@/hooks/usePin";

interface DailyRecordsPanelProps {
  selectedDate: Date;
  onToggle?: () => void;
  isCollapsed?: boolean;
}

const DATASET_ICONS: Record<string, any> = {
  daily_journal: BookOpen,
  gratitude_journal: Heart,
  creativity_journal: BookOpen,
  question_journal: BookOpen,
  affirmation: Heart,
  daily_logs: Activity,
  body_measurements: Activity,
  bloodwork: Activity,
  dexa: Activity,
  financial_logs: DollarSign,
  financial_balances: DollarSign,
  time_entries: Clock,
  meetings: Users,
  todo: FileText,
};

export default function DailyRecordsPanel({
  selectedDate,
  onToggle,
  isCollapsed = false,
}: DailyRecordsPanelProps) {
  const allData = useStore(dataStore, (state) => state);
  const fieldDefinitions = useStore(
    fieldDefinitionsStore,
    (state) => state.datasets
  );
  const settings = useStore(settingsStore);
  const isMetricsEnabled = settings.visibleRoutes["/metric"] === true;
  const isTodosEnabled = settings.visibleRoutes["/todos"] === true;
  
  const { isConfigured, isUnlocked } = usePin();

  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);

  const [collapsedSections, setCollapsedSections] = useState<
    Record<string, boolean>
  >({});

  const featureOptions: MultiSelectOption[] = Object.entries(fieldDefinitions)
    .filter(([datasetId, dataset]) => {
      // Check if dataset has a date field
      const hasDateField = dataset.fields.some((field) => field.type === "date");
      if (!hasDateField) return false;
      
      // Filter out metrics-related datasets if metrics is disabled
      if (!isMetricsEnabled && (datasetId === "daily_logs" || datasetId === "metrics")) {
        return false;
      }
      
      // Filter out todo dataset if todos is disabled
      if (!isTodosEnabled && datasetId === "todos") {
        return false;
      }
      
      return true;
    })
    .map(([datasetId, dataset]) => ({
      id: datasetId,
      label: dataset.name,
    }));

  const STORAGE_KEY = "daily-journal-selected-features";
  const COLLAPSED_STORAGE_KEY = "daily-journal-collapsed-sections";

  useEffect(() => {
    try {
      const savedFeatures = localStorage.getItem(STORAGE_KEY);
      if (savedFeatures) {
        const parsedFeatures = JSON.parse(savedFeatures);

        const validFeatures = parsedFeatures.filter((featureId: string) =>
          featureOptions.some((option) => option.id === featureId)
        );
        setSelectedFeatures(validFeatures);
        return;
      }
    } catch (error) {
      console.warn(
        "Failed to load selected features from localStorage:",
        error
      );
    }

    const defaultSelected = featureOptions
      .filter((option) => option.id.includes("files"))
      .map((option) => option.id);
    // Always include daily_journal by default
    if (featureOptions.some((option) => option.id === "daily_journal")) {
      defaultSelected.push("daily_journal");
    }
    setSelectedFeatures(defaultSelected);
  }, []); // Remove featureOptions dependency to prevent re-runs

  // Separate effect to filter out invalid features when options change
  useEffect(() => {
    setSelectedFeatures((current) => {
      const validFeatures = current.filter((featureId) =>
        featureOptions.some((option) => option.id === featureId)
      );
      // Only update if there's a difference
      if (validFeatures.length !== current.length) {
        return validFeatures;
      }
      return current;
    });
  }, [featureOptions]);

  useEffect(() => {
    if (selectedFeatures.length > 0) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedFeatures));
      } catch (error) {
        console.warn(
          "Failed to save selected features to localStorage:",
          error
        );
      }
    }
  }, [selectedFeatures]);

  useEffect(() => {
    try {
      const savedCollapsed = localStorage.getItem(COLLAPSED_STORAGE_KEY);
      if (savedCollapsed) {
        setCollapsedSections(JSON.parse(savedCollapsed));
      }
    } catch (error) {
      console.warn(
        "Failed to load collapsed sections from localStorage:",
        error
      );
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        COLLAPSED_STORAGE_KEY,
        JSON.stringify(collapsedSections)
      );
    } catch (error) {
      console.warn("Failed to save collapsed sections to localStorage:", error);
    }
  }, [collapsedSections]);

  const toggleSection = (datasetId: string) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [datasetId]: !prev[datasetId],
    }));
  };

  const shouldHidePrivateRecord = (record: any, datasetId: string): boolean => {
    // If PIN is not configured, show all records
    if (!isConfigured) return false;
    
    // If PIN is unlocked, show all records
    if (isUnlocked) return false;
    
    // Check if the record itself is private
    if (record.private) return true;
    
    // For daily_logs, check if the associated metric is private
    if (datasetId === "daily_logs" && record.metric_id) {
      const metrics = allData.metrics || [];
      const metric = metrics.find((m: any) => m.id === record.metric_id);
      if (metric?.private) return true;
    }
    
    // For experiment-related records, check if the associated experiment is private
    if (record.experiment_id) {
      const experiments = allData.experiments || [];
      const experiment = experiments.find((e: any) => e.id === record.experiment_id);
      if (experiment?.private) return true;
    }
    
    return false;
  };

  const getRecordsForDate = () => {
    const recordsByDataset: Array<{
      datasetId: string;
      datasetName: string;
      records: any[];
      icon: any;
    }> = [];

    Object.entries(allData).forEach(([datasetId, records]) => {
      if (!records || !Array.isArray(records)) return;

      if (!selectedFeatures.includes(datasetId)) return;

      const dataset = fieldDefinitions[datasetId];
      if (!dataset) return;

      const dateField = dataset.fields.find((field) => field.type === "date");
      if (!dateField) return;

      const dateRecords = records
        .filter((record: any) => {
          // First check privacy - if record should be hidden, filter it out
          if (shouldHidePrivateRecord(record, datasetId)) return false;
          
          // Special handling for todos - only show completed ones
          if (datasetId === "todos") {
            if (!record.is_complete || !record.completed_at) return false;
            const completedDate = new Date(record.completed_at);
            return (
              completedDate.getFullYear() === selectedDate.getFullYear() &&
              completedDate.getMonth() === selectedDate.getMonth() &&
              completedDate.getDate() === selectedDate.getDate()
            );
          }

          if (!record[dateField.key]) return false;
          const recordDate = new Date(record[dateField.key]);

          return (
            recordDate.getFullYear() === selectedDate.getFullYear() &&
            recordDate.getMonth() === selectedDate.getMonth() &&
            recordDate.getDate() === selectedDate.getDate()
          );
        })
        .sort((a: any, b: any) => {
          let aTime, bTime;

          if (datasetId === "time_entries" && a.start_time && b.start_time) {
            aTime = new Date(a.start_time);
            bTime = new Date(b.start_time);
          } else {
            aTime = new Date(a[dateField.key]);
            bTime = new Date(b[dateField.key]);
          }

          // Sort early to late (ascending order)
          return aTime.getTime() - bTime.getTime();
        });

      if (dateRecords.length > 0) {
        recordsByDataset.push({
          datasetId,
          datasetName: dataset.name,
          records: dateRecords,
          icon: DATASET_ICONS[datasetId] || FileText,
        });
      }
    });

    return recordsByDataset;
  };

  const recordsByDataset = getRecordsForDate();
  const totalRecords = recordsByDataset.reduce(
    (sum, dataset) => sum + dataset.records.length,
    0
  );

  if (isCollapsed) {
    return (
      <Card className="w-20">
        <CardHeader className="p-3">
          <CardTitle className="flex justify-center">
            {onToggle && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onToggle}
                      className="h-6 w-6 p-0"
                    >
                      <ChevronLeft className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="left">
                    <span>Show Records Panel</span>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  if (totalRecords === 0) {
    return (
      <Card>
        <CardHeader className="space-y-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Records for {format(selectedDate, "MMM d, yyyy")}
            </div>
            {onToggle && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onToggle}
                      className="h-6 w-6 p-0"
                    >
                      <ChevronRight className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="left">
                    <span>Hide Records Panel</span>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </CardTitle>
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">
              Select which features you want to show records for:
            </label>
            <ReusableMultiSelect
              options={featureOptions}
              selected={selectedFeatures}
              onChange={setSelectedFeatures}
              placeholder="Filter features..."
              title="features"
              maxDisplay={0}
              className="w-full"
            />
          </div>
        </CardHeader>
        <CardContent className="text-center py-8">
          <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Records</h3>
          <p className="text-muted-foreground text-sm">
            {selectedFeatures.length === 0
              ? "No features selected to display."
              : "No records found for this date in the selected features."}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="space-y-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Records for {format(selectedDate, "MMM d, yyyy")}
          </div>
          {onToggle && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onToggle}
                    className="h-6 w-6 p-0"
                  >
                    <ChevronRight className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">
                  <span>Hide Records Panel</span>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </CardTitle>
        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">
            Select which features you want to show records for:
          </label>
          <ReusableMultiSelect
            options={featureOptions}
            selected={selectedFeatures}
            onChange={setSelectedFeatures}
            placeholder="Filter features..."
            title="features"
            maxDisplay={0}
            className="w-full"
          />
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">
            {totalRecords} record{totalRecords !== 1 ? "s" : ""}
          </Badge>
          <Badge variant="outline">
            {recordsByDataset.length} feature
            {recordsByDataset.length !== 1 ? "s" : ""}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {recordsByDataset.map(
          ({ datasetId, datasetName, records, icon: Icon }) => {
            const dataset = fieldDefinitions[datasetId];
            const isCollapsed = collapsedSections[datasetId] || false;

            return (
              <div key={datasetId} className="space-y-2">
                {/* Custom compact collapsible header */}
                <button
                  onClick={() => toggleSection(datasetId)}
                  className="flex items-center gap-2 w-full text-left hover:bg-muted/50 rounded-md px-2 py-1 transition-colors"
                >
                  {isCollapsed ? (
                    <ChevronRight className="h-3 w-3 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-3 w-3 text-muted-foreground" />
                  )}
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <h4 className="font-medium text-sm">{datasetName}</h4>
                  <Badge variant="secondary" className="text-xs">
                    {records.length}
                  </Badge>
                </button>

                {/* Collapsible content */}
                {!isCollapsed && (
                  <div className="space-y-2">
                    {records.map((record, index) => (
                      <div
                        key={record.id || index}
                        className="p-3 bg-muted/50 rounded-md w-full"
                      >
                        <div className="space-y-1">
                          {/* Special handling for Time Entries */}
                          {datasetId === "time_entries" ? (
                            <>
                              <div className="text-sm font-medium">
                                {record.start_time && record.end_time
                                  ? `${format(
                                      new Date(record.start_time),
                                      "h:mm a"
                                    )} - ${format(
                                      new Date(record.end_time),
                                      "h:mm a"
                                    )}`
                                  : record.start_time
                                    ? format(
                                        new Date(record.start_time),
                                        "h:mm a"
                                      )
                                    : "No time"}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {record.description || "No description"}
                              </div>
                            </>
                          ) : datasetId === "daily_logs" ? (
                            /* Special handling for Daily Logs */
                            (() => {
                              // Resolve metric name
                              const metricField = dataset.fields.find(
                                (f) => f.key === "metric_id"
                              );
                              let metricName = "";
                              if (metricField && record.metric_id) {
                                const metrics = allData.metrics || [];
                                const metric = metrics.find(
                                  (m: any) => m.id === record.metric_id
                                );
                                metricName = metric
                                  ? getDisplayValue(metricField, metric)
                                  : "";
                              }

                              // Resolve experiment name
                              const experimentField = dataset.fields.find(
                                (f) => f.key === "experiment_id"
                              );
                              let experimentName = "";
                              if (experimentField && record.experiment_id) {
                                const experiments = allData.experiments || [];
                                const experiment = experiments.find(
                                  (e: any) => e.id === record.experiment_id
                                );
                                experimentName = experiment
                                  ? getDisplayValue(experimentField, experiment)
                                  : "";
                              }

                              return (
                                <>
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="font-medium">
                                      {metricName}
                                    </span>
                                    <span className="font-medium">
                                      {record.value || "No value"}
                                    </span>
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    {experimentName && (
                                      <span>
                                        <i>Experiment:</i> {experimentName}
                                      </span>
                                    )}
                                    {experimentName && record.notes && " • "}
                                    {record.notes && (
                                      <span>
                                        <i>Note:</i> {record.notes}
                                      </span>
                                    )}
                                  </div>
                                </>
                              );
                            })()
                          ) : datasetId === "financial_logs" ||
                            datasetId === "financial_balances" ||
                            datasetId === "paycheck" ? (
                            /* Special handling for Financial Logs, Balances, and Paychecks */
                            <>
                              <div className="text-sm font-medium">
                                {record.amount !== undefined &&
                                  record.amount !== null && (
                                    <span
                                      className={
                                        record.amount < 0
                                          ? "text-red-600"
                                          : "text-green-600"
                                      }
                                    >
                                      $
                                      {Math.abs(record.amount).toLocaleString(
                                        "en-US",
                                        {
                                          minimumFractionDigits: 2,
                                          maximumFractionDigits: 2,
                                        }
                                      )}
                                    </span>
                                  )}
                                {record.amount !== undefined &&
                                  record.amount !== null &&
                                  record.description &&
                                  " "}
                                {record.description ||
                                  record.name ||
                                  "No description"}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {datasetId === "financial_balances" &&
                                record.account_type
                                  ? record.account_type
                                  : record.category || "No category"}
                              </div>
                            </>
                          ) : datasetId === "daily_journal" ? (
                            /* Special handling for Daily Journal - show entry created */
                            <div className="text-sm">
                              <div className="flex items-center gap-2">
                                <Check className="h-4 w-4 text-green-600" />
                                <span className="font-medium">
                                  Journal entry created
                                </span>
                              </div>
                              {record.created_at && (
                                <div className="text-xs text-muted-foreground mt-1">
                                  {format(
                                    new Date(record.created_at),
                                    "h:mm a"
                                  )}
                                </div>
                              )}
                            </div>
                          ) : datasetId === "gratitude_journal" ? (
                            /* Special handling for Gratitude Journal - show count only */
                            <div className="text-sm">
                              <div className="flex items-center gap-2">
                                <Heart className="h-4 w-4 text-pink-600" />
                                <span className="font-medium">
                                  {records.length} gratitude
                                  {records.length !== 1 ? "s" : ""} recorded
                                </span>
                              </div>
                            </div>
                          ) : datasetId === "todos" ? (
                            /* Special handling for Todos - only completed ones shown */
                            (() => {
                              const createdDate = record.created_at
                                ? new Date(record.created_at)
                                : null;
                              const completedDate = record.completed_at
                                ? new Date(record.completed_at)
                                : null;
                              let timeTaken = "";

                              if (createdDate && completedDate) {
                                const daysDiff = differenceInDays(
                                  completedDate,
                                  createdDate
                                );
                                const hoursDiff = differenceInHours(
                                  completedDate,
                                  createdDate
                                );

                                if (daysDiff > 0) {
                                  timeTaken = `${daysDiff} day${daysDiff > 1 ? "s" : ""}`;
                                } else if (hoursDiff > 0) {
                                  timeTaken = `${hoursDiff} hour${hoursDiff > 1 ? "s" : ""}`;
                                } else {
                                  timeTaken = "< 1 hour";
                                }
                              }

                              return (
                                <>
                                  <div className="flex items-center gap-2 text-sm">
                                    <Check className="h-4 w-4 text-green-600" />
                                    <span className="font-medium">
                                      {record.title || "Untitled todo"}
                                    </span>
                                  </div>
                                  {timeTaken && (
                                    <div className="text-xs text-muted-foreground ml-6">
                                      Completed in {timeTaken}
                                    </div>
                                  )}
                                </>
                              );
                            })()
                          ) : (
                            /* Default rendering for other datasets */
                            dataset.fields
                              .filter(
                                (field) =>
                                  field.key !== "date" &&
                                  record[field.key] !== undefined &&
                                  record[field.key] !== null &&
                                  record[field.key] !== ""
                              )
                              .slice(0, 3)
                              .map((field) => (
                                <div
                                  key={field.key}
                                  className="flex items-start gap-2 text-sm"
                                >
                                  <span className="font-medium text-muted-foreground min-w-0 flex-shrink-0">
                                    {field.displayName}:
                                  </span>
                                  <div className="min-w-0 flex-1">
                                    <FieldValueDisplay
                                      field={field}
                                      value={record[field.key]}
                                    />
                                  </div>
                                </div>
                              ))
                          )}

                          {/* Show creation time if available (but not for time_entries) */}
                          {record.created_at &&
                            datasetId !== "time_entries" && (
                              <div className="text-xs text-muted-foreground mt-2">
                                Created:{" "}
                                {format(new Date(record.created_at), "h:mm a")}
                              </div>
                            )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          }
        )}
      </CardContent>
    </Card>
  );
}
