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
} from "lucide-react";
import { useStore } from "@tanstack/react-store";
import dataStore from "@/store/data-store";
import { fieldDefinitionsStore } from "@/features/field-definitions/field-definitions-store";
import { format } from "date-fns";
import FieldValueDisplay from "@/components/reusable/field-value-display";

interface DailyRecordsPanelProps {
  selectedDate: Date;
}

// Icons for different dataset types
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

  // Get all records for the selected date across all datasets
  const getRecordsForDate = () => {
    const selectedDateString = selectedDate.toISOString().split("T")[0];
    const recordsByDataset: Array<{
      datasetId: string;
      datasetName: string;
      records: any[];
      icon: any;
    }> = [];

    Object.entries(allData).forEach(([datasetId, records]) => {
      if (!records || !Array.isArray(records)) return;

      const dataset = fieldDefinitions[datasetId];
      if (!dataset) return;

      // Find date field in this dataset
      const dateField = dataset.fields.find((field) => field.type === "date");
      if (!dateField) return;

      // Filter records for the selected date
      const dateRecords = records.filter((record: any) => {
        if (!record[dateField.key]) return false;
        const recordDate = new Date(record[dateField.key]);
        return recordDate.toISOString().split("T")[0] === selectedDateString;
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
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Records for {format(selectedDate, "MMM d, yyyy")}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Records</h3>
          <p className="text-muted-foreground text-sm">
            No records found for this date across any features.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Records for {format(selectedDate, "MMM d, yyyy")}
        </CardTitle>
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

            return (
              <div key={datasetId} className="space-y-2">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <h4 className="font-medium text-sm">{datasetName}</h4>
                  <Badge variant="secondary" className="text-xs">
                    {records.length}
                  </Badge>
                </div>

                <div className="space-y-2 ml-6">
                  {records.map((record, index) => (
                    <div
                      key={record.id || index}
                      className="p-3 bg-muted/50 rounded-md"
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
                          .slice(0, 3) // Show only first 3 non-date fields to keep it compact
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
              </div>
            );
          }
        )}
      </CardContent>
    </Card>
  );
}
