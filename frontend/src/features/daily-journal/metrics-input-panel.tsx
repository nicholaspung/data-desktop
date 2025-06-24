import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Zap, Search, ArrowRight, Check, X } from "lucide-react";

interface MetricSuggestion {
  label: string;
  description: string;
  type: string;
  examples: string[];
  valueType: "number" | "rating" | "text" | "boolean" | "duration";
  unit?: string;
}

// Enhanced metric suggestions with value types
const METRIC_SUGGESTIONS: MetricSuggestion[] = [
  {
    label: "weight",
    description: "Body weight measurements",
    type: "weight",
    valueType: "number",
    unit: "lbs/kg",
    examples: ["150 lbs", "68 kg", "140 lbs", "160 lbs", "70 kg"]
  },
  {
    label: "mood",
    description: "Mood and emotional state",
    type: "mood",
    valueType: "rating",
    examples: ["8/10", "7/10", "9/10", "good", "great", "okay", "excellent"]
  },
  {
    label: "sleep",
    description: "Sleep duration and quality",
    type: "sleep",
    valueType: "duration",
    unit: "hours",
    examples: ["7 hours", "8 hours", "6 hours", "7.5 hours", "8.5 hours"]
  },
  {
    label: "energy",
    description: "Energy levels throughout the day",
    type: "energy",
    valueType: "rating",
    examples: ["high", "medium", "low", "8/10", "7/10", "good"]
  },
  {
    label: "exercise",
    description: "Physical activities and workouts",
    type: "exercise",
    valueType: "text",
    examples: ["30 mins running", "45 mins walking", "60 mins workout", "20 mins cycling", "1 hour gym"]
  },
  {
    label: "stress",
    description: "Stress levels and anxiety",
    type: "stress",
    valueType: "rating",
    examples: ["3/10", "low", "high", "7/10", "medium"]
  },
  {
    label: "focus",
    description: "Concentration and focus levels",
    type: "focus",
    valueType: "rating",
    examples: ["8/10", "good", "poor", "excellent", "6/10"]
  },
  {
    label: "productivity",
    description: "Daily productivity levels",
    type: "productivity",
    valueType: "rating",
    examples: ["high", "7/10", "good", "low", "9/10"]
  },
  {
    label: "hydration",
    description: "Water intake tracking",
    type: "hydration",
    valueType: "number",
    unit: "glasses/liters",
    examples: ["8 glasses", "2 liters", "10 glasses", "3 liters", "6 glasses"]
  },
  {
    label: "temperature",
    description: "Body temperature",
    type: "temperature",
    valueType: "number",
    unit: "°F/°C",
    examples: ["98.6°F", "37°C", "99.1°F", "36.8°C", "98.2°F"]
  },
  {
    label: "completed_todo",
    description: "Task completion status",
    type: "completed_todo",
    valueType: "boolean",
    examples: ["true", "false", "yes", "no", "completed"]
  }
];

interface MetricsInputPanelProps {
  onMetricSelect: (metricText: string) => void;
  onClose: () => void;
  searchQuery?: string;
}

export default function MetricsInputPanel({
  onMetricSelect,
  onClose,
  searchQuery = ""
}: MetricsInputPanelProps) {
  const [selectedMetric, setSelectedMetric] = useState<MetricSuggestion | null>(null);
  const [filteredMetrics, setFilteredMetrics] = useState<MetricSuggestion[]>(METRIC_SUGGESTIONS);
  const [searchInput, setSearchInput] = useState(searchQuery);
  const [metricValue, setMetricValue] = useState("");

  // Filter metrics based on search input
  const filterMetrics = useCallback((query: string) => {
    if (!query.trim()) {
      return METRIC_SUGGESTIONS;
    }
    
    return METRIC_SUGGESTIONS.filter(metric =>
      metric.label.toLowerCase().includes(query.toLowerCase()) ||
      metric.description.toLowerCase().includes(query.toLowerCase()) ||
      metric.type.toLowerCase().includes(query.toLowerCase())
    );
  }, []);

  useEffect(() => {
    setFilteredMetrics(filterMetrics(searchInput));
  }, [searchInput, filterMetrics]);

  // Update search input when prop changes
  useEffect(() => {
    setSearchInput(searchQuery);
  }, [searchQuery]);

  // Handle metric selection
  const handleMetricSelect = (metric: MetricSuggestion) => {
    setSelectedMetric(metric);
    setMetricValue("");
  };

  // Handle value submission
  const handleValueSubmit = () => {
    if (!selectedMetric || !metricValue.trim()) return;

    const metricText = `@metric:${selectedMetric.label}:${metricValue.trim()}`;
    onMetricSelect(metricText);
    
    // Reset state
    setSelectedMetric(null);
    setMetricValue("");
    setSearchInput("");
  };

  // Handle back to metric selection
  const handleBack = () => {
    setSelectedMetric(null);
    setMetricValue("");
  };

  // Generate value input placeholder based on metric type
  const getValuePlaceholder = (metric: MetricSuggestion) => {
    switch (metric.valueType) {
      case "number":
        return `Enter number${metric.unit ? ` (${metric.unit})` : ""}`;
      case "rating":
        return "Enter rating (1-10, good, high, etc.)";
      case "duration":
        return `Enter duration${metric.unit ? ` (${metric.unit})` : ""}`;
      case "boolean":
        return "Enter true/false or yes/no";
      case "text":
        return "Enter description";
      default:
        return "Enter value";
    }
  };

  // Get value suggestions based on metric
  const getValueSuggestions = (metric: MetricSuggestion) => {
    return metric.examples.slice(0, 5);
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          {selectedMetric ? "Enter Value" : "Add Metric"}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="ml-auto h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!selectedMetric ? (
          // Metric selection view
          <>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search metrics..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-9"
                autoFocus
              />
            </div>

            <div className="text-sm text-muted-foreground">
              {filteredMetrics.length} metrics available
            </div>

            <ScrollArea className="h-96">
              <div className="space-y-2">
                {filteredMetrics.map((metric) => (
                  <Button
                    key={metric.label}
                    variant="ghost"
                    className="w-full justify-start p-3 h-auto hover:bg-accent"
                    onClick={() => handleMetricSelect(metric)}
                  >
                    <div className="flex-1 text-left space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{metric.label}</span>
                        <Badge variant="secondary" className="text-xs">
                          {metric.valueType}
                        </Badge>
                        {metric.unit && (
                          <Badge variant="outline" className="text-xs">
                            {metric.unit}
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {metric.description}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Examples: {metric.examples.slice(0, 2).join(", ")}
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </Button>
                ))}
              </div>
            </ScrollArea>

            {filteredMetrics.length === 0 && (
              <div className="text-center py-8">
                <div className="text-sm text-muted-foreground">
                  No metrics match "{searchInput}"
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Try: weight, mood, sleep, energy, exercise, stress, focus, productivity
                </div>
              </div>
            )}
          </>
        ) : (
          // Value input view
          <>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="p-1"
              >
                <ArrowRight className="h-4 w-4 rotate-180" />
              </Button>
              <div className="flex-1">
                <div className="font-medium">{selectedMetric.label}</div>
                <div className="text-xs text-muted-foreground">
                  {selectedMetric.description}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Value</label>
              <Input
                placeholder={getValuePlaceholder(selectedMetric)}
                value={metricValue}
                onChange={(e) => setMetricValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && metricValue.trim()) {
                    handleValueSubmit();
                  }
                }}
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium">Suggestions</div>
              <div className="flex flex-wrap gap-1">
                {getValueSuggestions(selectedMetric).map((example, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className="text-xs h-7"
                    onClick={() => setMetricValue(example)}
                  >
                    {example}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium">Preview</div>
              <div className="bg-muted p-2 rounded text-sm font-mono">
                @metric:{selectedMetric.label}:{metricValue || "___"}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                onClick={handleValueSubmit}
                disabled={!metricValue.trim()}
                className="flex-1"
              >
                <Check className="h-4 w-4 mr-1" />
                Add Metric
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}