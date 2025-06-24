import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
} from "lucide-react";
import { useStore } from "@tanstack/react-store";
import dataStore from "@/store/data-store";
import { fieldDefinitionsStore } from "@/features/field-definitions/field-definitions-store";
import { format } from "date-fns";
import FieldValueDisplay from "@/components/reusable/field-value-display";
import ReusableMultiSelect, {
  MultiSelectOption,
} from "@/components/reusable/reusable-multiselect";

interface DailyRecordsPanelProps {
  selectedDate: Date;
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
}: DailyRecordsPanelProps) {
  const allData = useStore(dataStore, (state) => state);
  const fieldDefinitions = useStore(
    fieldDefinitionsStore,
    (state) => state.datasets
  );

  // Initialize selected features state
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  
  // State for collapsed sections
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  // Create options from available datasets
  const featureOptions: MultiSelectOption[] = Object.entries(fieldDefinitions)
    .filter(([datasetId, dataset]) => {
      // Only include datasets that have a date field
      return dataset.fields.some((field) => field.type === "date");
    })
    .map(([datasetId, dataset]) => ({
      id: datasetId,
      label: dataset.name,
    }));

  // Local storage keys
  const STORAGE_KEY = "daily-journal-selected-features";
  const COLLAPSED_STORAGE_KEY = "daily-journal-collapsed-sections";

  // Initialize selected features on component mount
  useEffect(() => {
    try {
      // Try to load from localStorage first
      const savedFeatures = localStorage.getItem(STORAGE_KEY);
      if (savedFeatures) {
        const parsedFeatures = JSON.parse(savedFeatures);
        // Validate that saved features still exist in current options
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

    // Fallback to default selection if no saved data or error
    const defaultSelected = featureOptions
      .filter(
        (option) => option.id !== "daily_journal" && option.id.includes("files")
      )
      .map((option) => option.id);
    setSelectedFeatures(defaultSelected);
  }, []);

  // Save selected features to localStorage whenever they change
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

  // Initialize collapsed sections from localStorage
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

  // Save collapsed sections to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(COLLAPSED_STORAGE_KEY, JSON.stringify(collapsedSections));
    } catch (error) {
      console.warn(
        "Failed to save collapsed sections to localStorage:",
        error
      );
    }
  }, [collapsedSections]);

  // Toggle collapsed state for a section
  const toggleSection = (datasetId: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [datasetId]: !prev[datasetId]
    }));
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

      // Filter by selected features
      if (!selectedFeatures.includes(datasetId)) return;

      const dataset = fieldDefinitions[datasetId];
      if (!dataset) return;

      const dateField = dataset.fields.find((field) => field.type === "date");
      if (!dateField) return;

      const dateRecords = records.filter((record: any) => {
        if (!record[dateField.key]) return false;
        const recordDate = new Date(record[dateField.key]);

        // Compare local dates by extracting year, month, and day
        return (
          recordDate.getFullYear() === selectedDate.getFullYear() &&
          recordDate.getMonth() === selectedDate.getMonth() &&
          recordDate.getDate() === selectedDate.getDate()
        );
      }).sort((a: any, b: any) => {
        // Sort by datetime - use start_time for time tracking, otherwise use the date field
        let aTime, bTime;
        
        if (datasetId === 'time_entries' && a.start_time && b.start_time) {
          aTime = new Date(a.start_time);
          bTime = new Date(b.start_time);
        } else {
          aTime = new Date(a[dateField.key]);
          bTime = new Date(b[dateField.key]);
        }
        
        // Sort in descending order (newest first)
        return bTime.getTime() - aTime.getTime();
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

  if (totalRecords === 0) {
    return (
      <Card>
        <CardHeader className="space-y-3">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Records for {format(selectedDate, "MMM d, yyyy")}
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
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Records for {format(selectedDate, "MMM d, yyyy")}
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
                          {dataset.fields
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
                            ))}

                          {/* Show creation time if available */}
                          {record.created_at && (
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
