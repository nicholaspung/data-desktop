import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { addDays, format, isSameDay, subDays } from "date-fns";
import {
  Beaker,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Loader2,
  Save,
} from "lucide-react";
import { toast } from "sonner";
import { parseMetricValue } from "./experiments-utils";
import { Experiment, MetricWithLog } from "./experiments";

export default function TrackerControls({
  selectedDate,
  setSelectedDate,
  selectedExperiment,
  setSelectedExperiment,
  experiments,
  logsChanged,
  isSaving,
  saveChanges,
  setMetricsWithLogs,
  setLogsChanged,
  dailyLogsData,
}: {
  selectedDate: Date;
  setSelectedDate: React.Dispatch<React.SetStateAction<Date>>;
  selectedExperiment: string;
  setSelectedExperiment: React.Dispatch<React.SetStateAction<string>>;
  experiments: Experiment[];
  logsChanged: boolean;
  isSaving: boolean;
  saveChanges: () => void;
  setMetricsWithLogs: React.Dispatch<React.SetStateAction<MetricWithLog[]>>;
  setLogsChanged: React.Dispatch<React.SetStateAction<boolean>>;
  dailyLogsData: any[];
}) {
  // Navigate to previous day
  const goToPreviousDay = () => {
    setSelectedDate(subDays(selectedDate, 1));
  };

  // Navigate to next day
  const goToNextDay = () => {
    setSelectedDate(addDays(selectedDate, 1));
  };

  return (
    <Card className="flex-1">
      <CardHeader>
        <CardTitle>Tracking Controls</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Daily Navigation */}
        <div className="flex justify-between items-center">
          <Button variant="outline" onClick={goToPreviousDay}>
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous Day
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                className={"w-full pl-3 text-left font-normal"}
              >
                {format(selectedDate, "EEEE, MMMM d, yyyy")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                className="rounded-md border"
              />
            </PopoverContent>
          </Popover>
          <Button variant="outline" onClick={goToNextDay}>
            Next Day
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>

        {/* Experiment Selection */}
        <div className="space-y-2">
          <Label htmlFor="experiment-select">Experiment (Optional)</Label>
          <Select
            value={selectedExperiment}
            onValueChange={setSelectedExperiment}
          >
            <SelectTrigger id="experiment-select" className="w-full">
              <SelectValue placeholder="Select experiment (optional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No Experiment</SelectItem>
              {experiments
                .filter((exp) => exp.status === "active")
                .map((experiment) => (
                  <SelectItem key={experiment.id} value={experiment.id}>
                    <div className="flex items-center">
                      <Beaker className="h-4 w-4 mr-2" />
                      {experiment.name}
                    </div>
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        {/* Save Button */}
        <Button
          className="w-full"
          disabled={!logsChanged || isSaving}
          onClick={saveChanges}
        >
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

        {/* Quick Action Buttons */}
        <div className="mt-4 space-y-2">
          <Label>Quick Actions</Label>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => {
                // Mark all boolean metrics as completed
                setMetricsWithLogs((prev) =>
                  prev.map((item) =>
                    item.type === "boolean"
                      ? { ...item, value: true, hasChanged: true }
                      : item
                  )
                );
                setLogsChanged(true);
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
                      hasChanged: true,
                    };
                  })
                );
                setLogsChanged(true);
                toast.success("Copied yesterday's values");
              }}
            >
              Copy Yesterday
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
