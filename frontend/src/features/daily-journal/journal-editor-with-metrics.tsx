import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Zap, Search, ArrowRight, X, Edit, Eye } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useStore } from "@tanstack/react-store";
import dataStore from "@/store/data-store";
import { Metric } from "@/store/experiment-definitions";

// Helper function to convert metric type to value examples
const getMetricExamples = (metric: Metric): string[] => {
  switch (metric.type) {
    case "number":
      return ["1", "5", "10", "25", "100"];
    case "boolean":
      return ["true", "false", "yes", "no"];
    case "percentage":
      return ["25%", "50%", "75%", "100%"];
    case "time":
      return ["10:30", "2:45", "30 mins", "1 hour"];
    case "text":
      return ["example text", "notes here", "good", "excellent"];
    default:
      return ["value"];
  }
};

interface JournalEditorWithMetricsProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
}

interface InlineMetricsPanelProps {
  onClose: () => void;
  selectedIndex: number;
  filteredMetrics: Metric[];
  isInValueMode: boolean;
  selectedMetric: Metric | null;
  metricValue: string;
  onMetricValueChange: (value: string) => void;
  searchQuery: string;
}

function InlineMetricsPanel({
  onClose,
  selectedIndex,
  filteredMetrics,
  isInValueMode,
  selectedMetric,
  metricValue,
  onMetricValueChange,
  searchQuery,
}: InlineMetricsPanelProps) {


  // Generate value input placeholder based on metric type
  const getValuePlaceholder = (metric: Metric) => {
    switch (metric.type) {
      case "number":
        return `Enter number${metric.unit ? ` (${metric.unit})` : ""}`;
      case "percentage":
        return "Enter percentage (25%, 50%, etc.)";
      case "time":
        return "Enter time (10:30, 2 hours, etc.)";
      case "boolean":
        return "Enter true/false or yes/no";
      case "text":
        return "Enter description";
      default:
        return "Enter value";
    }
  };

  // Get value suggestions based on metric
  const getValueSuggestions = (metric: Metric) => {
    return getMetricExamples(metric).slice(0, 5);
  };

  return (
    <Card className="w-80 h-fit absolute right-0 top-0 z-10 shadow-lg border-l-2 border-blue-500">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-blue-600" />
            <span className="font-medium text-sm">
              {isInValueMode ? "Enter Value" : "Add Metric"}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-6 w-6 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>

        {!isInValueMode ? (
          // Metric selection view
          <>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-3 w-3 text-muted-foreground" />
              <div className="text-xs text-muted-foreground pl-7">
                Type to filter or use ↑↓ arrows, Enter to select
              </div>
            </div>

            <div className="text-xs text-muted-foreground">
              {filteredMetrics.length} metrics available
            </div>

            <ScrollArea className="h-64">
              <div className="space-y-1">
                {filteredMetrics.map((metric, index) => (
                  <Button
                    key={metric.id}
                    variant="ghost"
                    className={`w-full justify-start p-2 h-auto text-left ${
                      index === selectedIndex
                        ? "bg-accent text-accent-foreground"
                        : "hover:bg-accent"
                    }`}
                    onClick={() => {}} // Handled by keyboard in parent
                  >
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-1">
                        <span className="font-medium text-sm">
                          {metric.name}
                        </span>
                        <Badge variant="secondary" className="text-xs h-4">
                          {metric.type}
                        </Badge>
                        {metric.unit && (
                          <Badge variant="outline" className="text-xs h-4">
                            {metric.unit}
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {metric.description}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Ex: {getMetricExamples(metric).slice(0, 2).join(", ")}
                      </div>
                    </div>
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  </Button>
                ))}
              </div>
            </ScrollArea>

            {filteredMetrics.length === 0 && (
              <div className="text-center py-4">
                <div className="text-sm text-muted-foreground">
                  No metrics match "{searchQuery}"
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Create metrics in the Metric Logger first
                </div>
              </div>
            )}
          </>
        ) : (
          // Value input view
          <>
            {selectedMetric && (
              <>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <div className="font-medium text-sm">
                      {selectedMetric.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {selectedMetric.description}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Value (press Enter to confirm, Esc to go back)
                  </label>
                  <Input
                    placeholder={getValuePlaceholder(selectedMetric)}
                    value={metricValue}
                    onChange={(e) => onMetricValueChange(e.target.value)}
                    className="text-sm h-8"
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
                        className="text-xs h-6"
                        onClick={() => onMetricValueChange(example)}
                      >
                        {example}
                      </Button>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div className="space-y-2">
              <div className="text-sm font-medium">Preview</div>
              <div className="bg-muted p-2 rounded text-xs font-mono">
                @metric:{selectedMetric?.name.includes(' ') 
                  ? `'${selectedMetric.name}'` 
                  : selectedMetric?.name}:{metricValue || "___"}
              </div>
            </div>

            <div className="text-xs text-muted-foreground">
              Use keyboard: Enter to confirm, Esc to go back
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default function JournalEditorWithMetrics({
  value,
  onChange,
  placeholder = "Start writing...",
  minHeight = "300px",
}: JournalEditorWithMetricsProps) {
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");
  const [showMetricsPanel, setShowMetricsPanel] = useState(false);
  const [metricSearchQuery, setMetricSearchQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isInValueMode, setIsInValueMode] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<Metric | null>(null);
  const [metricValue, setMetricValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load metrics from data store for keyboard navigation
  const metrics = useStore(dataStore, (state) => state.metrics as Metric[]) || [];
  const activeMetrics = metrics.filter(metric => metric.active);
  
  // Filter metrics based on search query
  const filteredMetrics = metricSearchQuery.trim() 
    ? activeMetrics.filter(metric =>
        metric.name.toLowerCase().includes(metricSearchQuery.toLowerCase()) ||
        metric.description.toLowerCase().includes(metricSearchQuery.toLowerCase()) ||
        metric.type.toLowerCase().includes(metricSearchQuery.toLowerCase())
      )
    : activeMetrics;

  // Handle metric insertion from the inline panel
  const handleMetricInsert = useCallback((metricText: string) => {
    // Find the last @metric: occurrence and replace it
    const lastAtMetricIndex = value.lastIndexOf("@metric:");
    
    if (lastAtMetricIndex !== -1) {
      // Replace from @metric: to the end of the text with the complete metric text and add a space
      const beforeMetric = value.substring(0, lastAtMetricIndex);
      const newText = beforeMetric + metricText + " ";
      onChange(newText);

      // Close metrics panel
      setShowMetricsPanel(false);
      setMetricSearchQuery("");

      // Refocus textarea after a brief delay
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          // Position cursor at the end of the inserted metric text (after the space)
          const cursorPosition = newText.length;
          textareaRef.current.setSelectionRange(cursorPosition, cursorPosition);
        }
      }, 100);
    }
  }, [value, onChange]);

  // Global keyboard event handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!showMetricsPanel) return;

      if (!isInValueMode) {
        // Navigation in metric list
        switch (e.key) {
          case "ArrowDown":
            e.preventDefault();
            e.stopPropagation();
            setSelectedIndex((prev) =>
              prev < filteredMetrics.length - 1 ? prev + 1 : 0
            );
            break;
          case "ArrowUp":
            e.preventDefault();
            e.stopPropagation();
            setSelectedIndex((prev) =>
              prev > 0 ? prev - 1 : filteredMetrics.length - 1
            );
            break;
          case "Enter":
            e.preventDefault();
            e.stopPropagation();
            if (filteredMetrics[selectedIndex]) {
              setSelectedMetric(filteredMetrics[selectedIndex]);
              setIsInValueMode(true);
            }
            break;
          case "Escape":
            e.preventDefault();
            e.stopPropagation();
            setShowMetricsPanel(false);
            setMetricSearchQuery("");
            setIsInValueMode(false);
            break;
        }
      } else {
        // Value input mode
        switch (e.key) {
          case "Enter":
            e.preventDefault();
            e.stopPropagation();
            if (selectedMetric && metricValue.trim()) {
              const metricName = selectedMetric.name.includes(' ') 
                ? `'${selectedMetric.name}'` 
                : selectedMetric.name;
              const metricText = `@metric:${metricName}:${metricValue.trim()}`;
              handleMetricInsert(metricText);
              setIsInValueMode(false);
              setSelectedMetric(null);
              setMetricValue("");
            }
            break;
          case "Escape":
            e.preventDefault();
            e.stopPropagation();
            setIsInValueMode(false);
            setSelectedMetric(null);
            setMetricValue("");
            break;
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown, true);
    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, [showMetricsPanel, isInValueMode, filteredMetrics, selectedIndex, selectedMetric, metricValue, handleMetricInsert]);

  // Handle text changes and detect @metric: pattern
  const handleTextChange = (newText: string) => {
    onChange(newText);

    // Find the last @metric: occurrence in the text
    const lastAtMetricIndex = newText.lastIndexOf("@metric:");
    
    if (lastAtMetricIndex !== -1) {
      // Get text from @metric: to the end
      const textAfterMetric = newText.substring(lastAtMetricIndex);
      
      // Check if this @metric: tag is incomplete (no space after it or still being typed)
      const spaceAfterMetric = textAfterMetric.indexOf(" ");
      const isIncompleteMetric = spaceAfterMetric === -1 || 
        (spaceAfterMetric > 0 && textAfterMetric.substring(spaceAfterMetric).trim() === "");
      
      if (isIncompleteMetric) {
        // Extract the search query after @metric:
        const searchQuery = textAfterMetric.substring(8); // Remove "@metric:" prefix
        setMetricSearchQuery(searchQuery);
        setShowMetricsPanel(true);
        setSelectedIndex(0); // Reset selection when showing panel
      } else {
        setShowMetricsPanel(false);
        setMetricSearchQuery("");
      }
    } else {
      setShowMetricsPanel(false);
      setMetricSearchQuery("");
    }
  };


  // Handle closing the metrics panel
  const handleMetricsPanelClose = () => {
    setShowMetricsPanel(false);
    setMetricSearchQuery("");
    setIsInValueMode(false);
    setSelectedMetric(null);
    setMetricValue("");

    // Refocus textarea when closing panel
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }, 100);
  };

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-3">
        <Button
          variant={activeTab === "edit" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveTab("edit")}
          className="h-8"
        >
          <Edit className="h-3 w-3 mr-1" />
          Edit
        </Button>
        <Button
          variant={activeTab === "preview" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveTab("preview")}
          className="h-8"
        >
          <Eye className="h-3 w-3 mr-1" />
          Preview
        </Button>
      </div>

      <div className="relative">
        {activeTab === "edit" ? (
          <div className="flex gap-4">
            <div className="flex-1">
              <textarea
                ref={textareaRef}
                value={value}
                onChange={(e) => handleTextChange(e.target.value)}
                placeholder={placeholder}
                className="flex min-h-[300px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-mono resize-y"
                style={{ minHeight }}
              />
            </div>

            {showMetricsPanel && (
              <InlineMetricsPanel
                onClose={handleMetricsPanelClose}
                selectedIndex={selectedIndex}
                filteredMetrics={filteredMetrics}
                isInValueMode={isInValueMode}
                selectedMetric={selectedMetric}
                metricValue={metricValue}
                onMetricValueChange={setMetricValue}
                searchQuery={metricSearchQuery}
              />
            )}
          </div>
        ) : (
          <div
            className="min-h-[300px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm prose prose-sm dark:prose-invert max-w-none"
            style={{ minHeight }}
          >
            {value ? (
              <ReactMarkdown>{value}</ReactMarkdown>
            ) : (
              <p className="text-muted-foreground italic">
                Nothing to preview yet...
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
