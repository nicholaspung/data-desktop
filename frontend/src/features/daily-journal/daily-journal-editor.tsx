import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Zap, AlertCircle, Calendar, HelpCircle } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import JournalEditorWithMetrics from "./journal-editor-with-metrics";
import ReusableDatePicker from "@/components/reusable/reusable-date-picker";
import dataStore, { addEntry, updateEntry } from "@/store/data-store";
import { useStore } from "@tanstack/react-store";
import { DailyJournalEntry } from "@/store/journaling-definitions";
import { ApiService } from "@/services/api";
import { toast } from "sonner";
import { parseMetricsFromText } from "./metric-parser";
import { MetricPreview } from "./metric-preview";
import { format } from "date-fns";

interface DailyJournalEditorProps {
  selectedDate?: Date;
  onDateChange?: (date: Date) => void;
}

export default function DailyJournalEditor({ 
  selectedDate: propSelectedDate, 
  onDateChange
}: DailyJournalEditorProps = {}) {
  const [entry, setEntry] = useState("");
  const [selectedDate, setSelectedDate] = useState(propSelectedDate || new Date());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [parsedMetrics, setParsedMetrics] = useState<any[]>([]);
  const [isParsingEnabled, setIsParsingEnabled] = useState(true);
  const [existingEntry, setExistingEntry] = useState<DailyJournalEntry | null>(null);

  const entries = useStore(
    dataStore,
    (state) => state.daily_journal as DailyJournalEntry[]
  );

  // Sync with prop changes
  useEffect(() => {
    if (propSelectedDate) {
      setSelectedDate(propSelectedDate);
    }
  }, [propSelectedDate]);

  // Handle date changes
  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
    if (onDateChange) {
      onDateChange(date);
    }
  };

  // Load existing entry for selected date
  useEffect(() => {
    const selectedDateString = selectedDate.toISOString().split('T')[0];
    const existingEntryForDate = entries.find((entry) => {
      const entryDate = new Date(entry.date);
      return entryDate.toISOString().split('T')[0] === selectedDateString;
    });

    if (existingEntryForDate) {
      setExistingEntry(existingEntryForDate);
      setEntry(existingEntryForDate.entry);
    } else {
      setExistingEntry(null);
      setEntry("");
    }
  }, [selectedDate, entries]);

  // Parse metrics from text in real-time
  useEffect(() => {
    if (isParsingEnabled && entry.trim()) {
      const metrics = parseMetricsFromText(entry);
      setParsedMetrics(metrics);
    } else {
      setParsedMetrics([]);
    }
  }, [entry, isParsingEnabled]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!entry.trim()) {
      toast.error("Please write something in your journal");
      return;
    }

    setIsSubmitting(true);

    try {
      const entryData = {
        date: selectedDate,
        entry: entry.trim(),
      };

      let result;
      if (existingEntry) {
        // Update existing entry
        result = await ApiService.updateRecord(existingEntry.id, entryData as any);
        if (result) {
          updateEntry(existingEntry.id, result, "daily_journal");
          toast.success(
            `Daily journal entry updated${
              parsedMetrics.length > 0 
                ? ` with ${parsedMetrics.length} metrics logged` 
                : ""
            }!`
          );
        }
      } else {
        // Create new entry
        result = await ApiService.addRecord("daily_journal", entryData as any);
        if (result) {
          addEntry(result as any, "daily_journal");
          toast.success(
            `Daily journal entry added${
              parsedMetrics.length > 0 
                ? ` with ${parsedMetrics.length} metrics logged` 
                : ""
            }!`
          );
        }
      }

      if (result) {
        // Process and save parsed metrics if any
        if (isParsingEnabled && parsedMetrics.length > 0) {
          await processMetrics(parsedMetrics, selectedDate);
        }
        setParsedMetrics([]);
      }
    } catch (error) {
      console.error("Error saving daily journal entry:", error);
      toast.error("Failed to save daily journal entry");
    } finally {
      setIsSubmitting(false);
    }
  };

  const processMetrics = async (metrics: any[], entryDate: Date) => {
    try {
      // Here we would process each parsed metric and save it to the appropriate dataset
      // For now, we'll just log them - this will be implemented in the metric parser
      console.log("Processing metrics for date:", entryDate, metrics);
      
      // TODO: Implement actual metric saving based on metric type
      for (const metric of metrics) {
        // Based on metric.type, save to appropriate dataset (daily_logs, body_measurements, etc.)
        console.log(`Would save metric for ${entryDate.toDateString()}: ${metric.name} = ${metric.value} (${metric.type})`);
      }
    } catch (error) {
      console.error("Error processing metrics:", error);
      toast.error("Journal saved, but some metrics failed to process");
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              {existingEntry ? "Edit Journal Entry" : "Write Your Daily Journal"}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant={isParsingEnabled ? "default" : "outline"}
                size="sm"
                onClick={() => setIsParsingEnabled(!isParsingEnabled)}
              >
                <Zap className="h-4 w-4 mr-1" />
                Auto-metrics {isParsingEnabled ? "ON" : "OFF"}
              </Button>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm" className="p-1 h-8 w-8">
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-96 p-4" align="end">
                  <div className="space-y-3">
                    <div className="font-semibold text-sm">Auto-Metrics Detection Tips</div>
                    
                    <div className="space-y-2 text-sm">
                      <div>
                        <div className="font-medium mb-1">Smart Metric Mentions:</div>
                        <div className="text-muted-foreground">Type <code className="bg-muted px-1 rounded">@metric:</code> to open the metrics menu with improved positioning</div>
                      </div>
                      
                      <div>
                        <div className="font-medium mb-1">Supported Patterns:</div>
                        <ul className="text-muted-foreground space-y-1 text-xs">
                          <li>• <strong>Measurements:</strong> <code className="bg-muted px-1 rounded">weight: 150lbs</code>, <code className="bg-muted px-1 rounded">height: 5'10"</code></li>
                          <li>• <strong>Ratings:</strong> <code className="bg-muted px-1 rounded">mood: 8/10</code>, <code className="bg-muted px-1 rounded">energy: 7/10</code></li>
                          <li>• <strong>Descriptive:</strong> <code className="bg-muted px-1 rounded">mood: good</code>, <code className="bg-muted px-1 rounded">energy: high</code></li>
                          <li>• <strong>Duration:</strong> <code className="bg-muted px-1 rounded">sleep: 7 hours</code>, <code className="bg-muted px-1 rounded">exercise: 30 mins</code></li>
                          <li>• <strong>Activities:</strong> <code className="bg-muted px-1 rounded">exercise: 30 mins running</code></li>
                        </ul>
                      </div>
                      
                      <div>
                        <div className="font-medium mb-1">How to Use:</div>
                        <ul className="text-muted-foreground space-y-1 text-xs">
                          <li>• Type <code className="bg-muted px-1 rounded">@metric:</code> to see all available metrics</li>
                          <li>• Continue typing to filter (e.g., <code className="bg-muted px-1 rounded">@metric: weight</code>)</li>
                          <li>• Use ↑↓ arrows to navigate, Enter to select</li>
                          <li>• Enhanced markdown editor with autocomplete</li>
                          <li>• Metrics are still auto-detected from natural text</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <div className="flex items-center gap-2 pt-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Select date:</span>
            <ReusableDatePicker
              value={selectedDate}
              onChange={(date) => date && handleDateChange(date)}
              placeholder="Select date"
            />
            {existingEntry && (
              <span className="text-sm text-blue-600 bg-blue-50 dark:bg-blue-950/20 px-2 py-1 rounded-md">
                Editing existing entry
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                What happened today? How are you feeling?
              </label>
              <JournalEditorWithMetrics
                value={entry}
                onChange={setEntry}
                placeholder="Write about your day... Try typing @metric: to add metrics like weight, mood, sleep, energy, exercise, stress, focus, or productivity!"
                minHeight="300px"
              />
            </div>

            {/* Metric Preview */}
            {isParsingEnabled && parsedMetrics.length > 0 && (
              <div className="border rounded-lg p-4 bg-blue-50 dark:bg-blue-950/20">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-600">
                    Detected Metrics ({parsedMetrics.length})
                  </span>
                </div>
                <div className="space-y-2">
                  {parsedMetrics.map((metric, index) => (
                    <MetricPreview key={index} metric={metric} />
                  ))}
                </div>
                <div className="mt-2 text-xs text-blue-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  These metrics will be automatically logged when you save your entry
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {existingEntry ? (
                  <span>Last updated: {format(new Date(existingEntry.lastModified || existingEntry.createdAt || new Date()), "MMM d, yyyy 'at' h:mm a")}</span>
                ) : (
                  <span>Creating entry for {format(selectedDate, "MMM d, yyyy")}</span>
                )}
              </div>
              <Button type="submit" disabled={isSubmitting || !entry.trim()}>
                {isSubmitting ? "Saving..." : existingEntry ? "Update Entry" : "Save Entry"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}