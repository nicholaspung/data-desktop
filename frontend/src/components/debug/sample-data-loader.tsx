import { useState } from "react";
import { Button } from "@/components/ui/button";
import ReusableCard from "@/components/reusable/reusable-card";
import { LoadSampleData, LoadSampleDataWithDates } from "../../../wailsjs/go/backend/App";
import { Database, Download, CheckCircle, AlertCircle, Calendar, Clock } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import ReusableDatePicker from "@/components/reusable/reusable-date-picker";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { format, addDays, startOfWeek, subWeeks, differenceInDays } from "date-fns";

const SampleDataLoader = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [lastLoadTime, setLastLoadTime] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [useCustomDates, setUseCustomDates] = useState(false);
  const [weekOnlyMode, setWeekOnlyMode] = useState(true);
  const [startDate, setStartDate] = useState<Date>(startOfWeek(new Date(), { weekStartsOn: 1 })); // Monday start
  const [endDate, setEndDate] = useState<Date>(new Date());

  const validateDateRange = () => {
    if (!useCustomDates) return true;
    
    const daysDiff = differenceInDays(endDate, startDate);
    
    if (weekOnlyMode && daysDiff > 7) {
      setError("Week mode allows maximum 7 days. Please select a shorter range or disable week mode.");
      return false;
    }
    
    if (daysDiff < 0) {
      setError("End date must be after start date.");
      return false;
    }
    
    if (daysDiff > 365) {
      setError("Date range cannot exceed 1 year.");
      return false;
    }
    
    return true;
  };

  const handleLoadSampleData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!validateDateRange()) {
        setIsLoading(false);
        return;
      }

      if (useCustomDates) {
        const finalStartDate = startDate;
        const finalEndDate = weekOnlyMode ? addDays(finalStartDate, 6) : endDate; // 7 days total (inclusive)
        
        const start = format(finalStartDate, "yyyy-MM-dd");
        const end = format(finalEndDate, "yyyy-MM-dd");
        
        await LoadSampleDataWithDates(start, end);
        toast.success(
          `Sample data loaded successfully with dates from ${start} to ${end}!`
        );
      } else {
        await LoadSampleData();
        toast.success(
          "Sample data loaded successfully! Only empty datasets were populated - existing data was preserved."
        );
      }

      const now = new Date().toLocaleString();
      setLastLoadTime(now);

      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err: unknown) {
      const errorMessage = `Error loading sample data: ${err instanceof Error ? err.message : String(err)}`;
      setError(errorMessage);
      toast.error(errorMessage);
      console.error("Error loading sample data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWeekPreset = (weeksAgo: number) => {
    const targetDate = subWeeks(new Date(), weeksAgo);
    const weekStart = startOfWeek(targetDate, { weekStartsOn: 1 });
    setStartDate(weekStart);
    setEndDate(addDays(weekStart, 6));
  };


  return (
    <ReusableCard
      title={
        <div className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Sample Data Loader
        </div>
      }
      content={
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Load comprehensive sample data for empty datasets. This function
            checks each dataset individually and only loads sample data for
            datasets that are currently empty, preserving any existing data you
            may have.
          </p>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {lastLoadTime && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Sample data was last loaded on {lastLoadTime}
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            {/* Date Selection Toggle */}
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label className="text-base">Use Custom Date Range</Label>
                <div className="text-sm text-muted-foreground">
                  Generate sample data within specific dates
                </div>
              </div>
              <Switch
                checked={useCustomDates}
                onCheckedChange={setUseCustomDates}
              />
            </div>

            {/* Week Mode Toggle */}
            {useCustomDates && (
              <div className="flex items-center justify-between rounded-lg border p-4 bg-blue-50 dark:bg-blue-950/20">
                <div className="space-y-0.5">
                  <Label className="text-base flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Week Mode
                  </Label>
                  <div className="text-sm text-muted-foreground">
                    Generate data for one week only (max 7 days)
                  </div>
                </div>
                <Switch
                  checked={weekOnlyMode}
                  onCheckedChange={setWeekOnlyMode}
                />
              </div>
            )}

            {/* Quick Week Presets */}
            {useCustomDates && weekOnlyMode && (
              <div className="p-4 bg-muted/50 rounded-lg">
                <Label className="text-sm font-medium mb-3 block">Quick Week Selection:</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleWeekPreset(0)}
                  >
                    This Week
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleWeekPreset(1)}
                  >
                    Last Week
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleWeekPreset(2)}
                  >
                    2 Weeks Ago
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleWeekPreset(4)}
                  >
                    1 Month Ago
                  </Button>
                </div>
              </div>
            )}

            {/* Date Pickers */}
            {useCustomDates && (
              <div className={`p-4 bg-muted/50 rounded-lg ${weekOnlyMode ? 'grid grid-cols-1 gap-4' : 'grid grid-cols-2 gap-4'}`}>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {weekOnlyMode ? 'Week Start Date' : 'Start Date'}
                  </Label>
                  <ReusableDatePicker
                    value={startDate}
                    onChange={(date) => date && setStartDate(date)}
                    className="w-full"
                  />
                  {weekOnlyMode && (
                    <div className="text-xs text-muted-foreground">
                      End date: {format(addDays(startDate, 6), 'MMM dd, yyyy')}
                    </div>
                  )}
                </div>
                {!weekOnlyMode && (
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      End Date
                    </Label>
                    <ReusableDatePicker
                      value={endDate}
                      onChange={(date) => date && setEndDate(date)}
                      className="w-full"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Data Description */}
            <div className="space-y-2">
              <p className="text-sm font-medium">
                What gets loaded:
              </p>
              <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                {useCustomDates ? (
                  weekOnlyMode ? (
                    <>
                      <li>• Sample data for one week ({format(startDate, 'MMM dd')} - {format(addDays(startDate, 6), 'MMM dd, yyyy')})</li>
                      <li>• ~{Math.max(15, Math.floor(Math.random() * 10) + 20)}-{Math.max(25, Math.floor(Math.random() * 15) + 35)} records across all datasets</li>
                      <li>• Realistic daily patterns and frequency for each dataset type</li>
                      <li>• Includes: health data, finance, journaling, time tracking, etc.</li>
                    </>
                  ) : (
                    <>
                      <li>• All datasets with dates within your selected range ({differenceInDays(endDate, startDate) + 1} days)</li>
                      <li>• Data will be spread realistically across the date range</li>
                      <li>• Includes 25+ datasets: body measurements, daily journal, health files, etc.</li>
                      <li>• ~{Math.max(50, Math.floor(differenceInDays(endDate, startDate) * 3))} total records estimated</li>
                    </>
                  )
                ) : (
                  <>
                    <li>• Only loads data for empty datasets (preserves existing data)</li>
                    <li>• Uses default date ranges (past 6-12 months)</li>
                    <li>• Standard datasets: DEXA, bloodwork, experiments, todos, etc.</li>
                    <li>• Will not overwrite any existing data you may have</li>
                  </>
                )}
              </ul>
            </div>
          </div>

          <Button
            onClick={handleLoadSampleData}
            disabled={isLoading}
            className="w-full"
            size="lg"
          >
            {isLoading ? (
              <>
                <Download className="h-4 w-4 mr-2 animate-spin" />
                Loading Sample Data...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Load Sample Data
              </>
            )}
          </Button>

          <p className="text-xs text-muted-foreground">
            {useCustomDates
              ? weekOnlyMode
                ? "Note: Week mode generates sample data for exactly 7 days starting from your selected date. Existing data will be replaced. The page reloads automatically to refresh all data."
                : "Note: Custom date range will generate all sample data within the specified dates. Existing data will be replaced. The page reloads automatically to refresh all data."
              : "Note: Each dataset is checked individually. Only empty datasets will receive sample data. Existing data in any dataset will be preserved. The page reloads automatically to refresh all data."}
          </p>
        </div>
      }
    />
  );
};

export default SampleDataLoader;
