import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Edit,
  Eye,
  Plus,
  Trash2,
  Zap,
  Search,
  ArrowRight,
  X,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useStore } from "@tanstack/react-store";
import dataStore from "@/store/data-store";
import { Metric } from "@/store/experiment-definitions";

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
}

interface Block {
  id: string;
  content: string;
  contentHistory?: string[];
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
  onSelectMetric: (metric: Metric) => void;
  onConfirmValue: () => void;
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
  onSelectMetric,
  onConfirmValue,
}: InlineMetricsPanelProps) {
  useEffect(() => {
    if (!isInValueMode && filteredMetrics.length > 0) {
      const selectedElement = document.getElementById(
        `metric-option-${selectedIndex}`
      );
      if (selectedElement) {
        selectedElement.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "nearest",
        });
      }
    }
  }, [selectedIndex, isInValueMode, filteredMetrics.length]);

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

  const getValueSuggestions = (metric: Metric) => {
    return getMetricExamples(metric).slice(0, 5);
  };

  return (
    <div className="w-full h-fit shadow-lg border-l-2 border-blue-500 bg-blue-50/30 dark:bg-blue-950/30 rounded-lg">
      <div className="p-4 space-y-4">
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

            <ScrollArea className="h-64" id="metrics-scroll-area">
              <div className="space-y-1">
                {filteredMetrics.map((metric, index) => (
                  <Button
                    key={metric.id}
                    id={`metric-option-${index}`}
                    variant="ghost"
                    className={`w-full justify-start p-2 h-auto text-left ${
                      index === selectedIndex
                        ? "bg-accent text-accent-foreground"
                        : "hover:bg-accent"
                    }`}
                    onClick={() => onSelectMetric(metric)}
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
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        onConfirmValue();
                      }
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-medium">Suggestions</div>
                  <div className="flex flex-wrap gap-1">
                    {getValueSuggestions(selectedMetric).map(
                      (example, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          className="text-xs h-6"
                          onClick={() => onMetricValueChange(example)}
                        >
                          {example}
                        </Button>
                      )
                    )}
                  </div>
                </div>
              </>
            )}

            <div className="space-y-2">
              <div className="text-sm font-medium">Preview</div>
              <div className="bg-muted p-2 rounded text-xs font-mono">
                @metric:
                {selectedMetric?.name.includes(" ")
                  ? `'${selectedMetric.name}'`
                  : selectedMetric?.name}
                :{metricValue || "___"}
              </div>
            </div>

            <div className="text-xs text-muted-foreground">
              Use keyboard: Enter to confirm, Esc to go back
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function JournalEditorWithMetrics({
  value,
  onChange,
  placeholder = "Start writing...",
}: JournalEditorWithMetricsProps) {
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [showMetricsPanel, setShowMetricsPanel] = useState(false);
  const [metricSearchQuery, setMetricSearchQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isInValueMode, setIsInValueMode] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<Metric | null>(null);
  const [metricValue, setMetricValue] = useState("");
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const [focusedBlockId, setFocusedBlockId] = useState<string | null>(null);
  const blockRefs = useRef<{ [key: string]: HTMLTextAreaElement | null }>({});

  const metrics =
    useStore(dataStore, (state) => state.metrics as Metric[]) || [];
  const activeMetrics = metrics.filter((metric) => metric.active);

  const filteredMetrics = metricSearchQuery.trim()
    ? activeMetrics.filter(
        (metric) =>
          metric.name.toLowerCase().includes(metricSearchQuery.toLowerCase()) ||
          metric.description
            .toLowerCase()
            .includes(metricSearchQuery.toLowerCase()) ||
          metric.type.toLowerCase().includes(metricSearchQuery.toLowerCase())
      )
    : activeMetrics;

  const initializeBlocks = useCallback(() => {
    if (value) {
      const blockContents = value.split("\n\n");
      const initialBlocks = blockContents.map((block, index) => ({
        id: `block-${index}`,
        content: block,
      }));
      return initialBlocks.length > 0
        ? initialBlocks
        : [{ id: "block-0", content: "" }];
    } else {
      return [{ id: "block-0", content: "" }];
    }
  }, [value]);

  useEffect(() => {
    setBlocks(initializeBlocks());
  }, []);

  // Auto-resize textareas when blocks change
  useEffect(() => {
    blocks.forEach((block) => {
      const textarea = blockRefs.current[block.id];
      if (textarea) {
        // Force single line height initially
        textarea.style.height = '1.2em';
        // Then expand if content requires it
        if (textarea.scrollHeight > textarea.clientHeight) {
          textarea.style.height = textarea.scrollHeight + 'px';
        }
      }
    });
  }, [blocks]);

  const updateParentValue = useCallback(
    (newBlocks: Block[]) => {
      const combinedValue = newBlocks
        .map((block) => block.content)
        .join("\n\n");
      onChange(combinedValue);
    },
    [onChange]
  );

  const generateBlockId = () =>
    `block-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

  const addBlock = useCallback(
    (afterIndex?: number) => {
      const newBlock: Block = {
        id: generateBlockId(),
        content: "",
      };

      setBlocks((prev) => {
        const newBlocks = [...prev];
        const insertIndex =
          afterIndex !== undefined ? afterIndex + 1 : newBlocks.length;
        newBlocks.splice(insertIndex, 0, newBlock);
        updateParentValue(newBlocks);
        return newBlocks;
      });

      setTimeout(() => {
        const textarea = blockRefs.current[newBlock.id];
        if (textarea) {
          textarea.focus();
          textarea.style.height = 'auto';
          textarea.style.height = textarea.scrollHeight + 'px';
        }
      }, 10);
    },
    [updateParentValue]
  );

  const removeBlock = useCallback(
    (blockId: string) => {
      setBlocks((prev) => {
        const newBlocks = prev.filter((block) => block.id !== blockId);

        if (newBlocks.length === 0) {
          newBlocks.push({ id: generateBlockId(), content: "" });
        }
        updateParentValue(newBlocks);
        return newBlocks;
      });
    },
    [updateParentValue]
  );

  const hasCompleteMetric = useCallback((content: string): boolean => {
    const metricMatches = content.match(
      /@metric:(?:'[^']*'|[^:]*):(?![:\s])[^\s@]+/g
    );
    return metricMatches !== null && metricMatches.length > 0;
  }, []);

  const isCorrection = useCallback(
    (blockId: string, newContent: string, prevContent: string): boolean => {
      const block = blocks.find((b) => b.id === blockId);
      const history = block?.contentHistory || [];

      if (newContent.length < prevContent.length) {
        return true;
      }

      const recentHistory = history.slice(-3);
      if (recentHistory.includes(newContent)) {
        return true;
      }

      const prevAtMetricIndex = prevContent.lastIndexOf("@metric:");
      const newAtMetricIndex = newContent.lastIndexOf("@metric:");

      if (prevAtMetricIndex !== -1 && newAtMetricIndex === -1) {
        return true;
      }

      return false;
    },
    [blocks]
  );

  const updateBlock = useCallback(
    (blockId: string, content: string) => {
      setBlocks((prev) => {
        const newBlocks = prev.map((block) => {
          if (block.id === blockId) {
            const currentHistory = block.contentHistory || [];
            const updatedHistory = [...currentHistory, block.content].slice(
              -10
            );

            return {
              ...block,
              content,
              contentHistory: updatedHistory,
            };
          }
          return block;
        });
        updateParentValue(newBlocks);
        return newBlocks;
      });

      const lastAtMetricIndex = content.lastIndexOf("@metric:");

      if (lastAtMetricIndex !== -1) {
        const textAfterMetric = content.substring(lastAtMetricIndex);

        const spaceAfterMetric = textAfterMetric.indexOf(" ");
        const isIncompleteMetric =
          spaceAfterMetric === -1 ||
          (spaceAfterMetric > 0 &&
            textAfterMetric.substring(spaceAfterMetric).trim() === "");

        if (isIncompleteMetric) {
          const currentBlock = blocks.find((b) => b.id === blockId);
          const prevContent = currentBlock?.content || "";

          const isUserCorrection = isCorrection(blockId, content, prevContent);

          const blockHasMetric = hasCompleteMetric(content);

          const isActivelyTypingMetric =
            content.endsWith("@metric:") ||
            (lastAtMetricIndex !== -1 &&
              content.substring(lastAtMetricIndex).startsWith("@metric:"));

          if (
            (!isUserCorrection || isActivelyTypingMetric) &&
            !blockHasMetric
          ) {
            const searchQuery = textAfterMetric.substring(8);
            setMetricSearchQuery(searchQuery);
            setShowMetricsPanel(true);
            setActiveBlockId(blockId);
            setSelectedIndex(0);
            setIsInValueMode(false);
          } else {
            setShowMetricsPanel(false);
            setMetricSearchQuery("");
            setActiveBlockId(null);
          }
        } else {
          setShowMetricsPanel(false);
          setMetricSearchQuery("");
          setActiveBlockId(null);
        }
      } else {
        setShowMetricsPanel(false);
        setMetricSearchQuery("");
        setActiveBlockId(null);
      }
    },
    [updateParentValue, blocks, isCorrection, hasCompleteMetric]
  );

  const handleBlockKeyPress = useCallback(
    (
      e: React.KeyboardEvent<HTMLTextAreaElement>,
      blockId: string,
      blockIndex: number
    ) => {
      const textarea = e.currentTarget;
      const cursorPosition = textarea.selectionStart || 0;

      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        addBlock(blockIndex);
      } else if (e.key === "Enter" && e.shiftKey) {
        // Allow default behavior for Shift+Enter (newline)
        return;
      } else if (
        e.key === "Backspace" &&
        e.currentTarget.value === "" &&
        blocks.length > 1
      ) {
        e.preventDefault();
        removeBlock(blockId);

        if (blockIndex > 0) {
          const prevBlock = blocks[blockIndex - 1];
          setTimeout(() => {
            const textarea = blockRefs.current[prevBlock.id];
            if (textarea) {
              textarea.focus();
              textarea.setSelectionRange(textarea.value.length, textarea.value.length);
            }
          }, 10);
        }
      } else if (e.key === "ArrowUp" && !showMetricsPanel) {
        // Check if cursor is at the first line of the textarea
        const textBeforeCursor = textarea.value.substring(0, cursorPosition);
        const linesBeforeCursor = textBeforeCursor.split('\n');
        const isOnFirstLine = linesBeforeCursor.length === 1;
        
        if (isOnFirstLine && blockIndex > 0) {
          e.preventDefault();
          const prevBlock = blocks[blockIndex - 1];
          setTimeout(() => {
            const prevTextarea = blockRefs.current[prevBlock.id];
            if (prevTextarea) {
              prevTextarea.focus();
              // Position cursor at the end of the last line
              const lines = prevTextarea.value.split('\n');
              const lastLine = lines[lines.length - 1];
              const lastLineStart = prevTextarea.value.lastIndexOf(lastLine);
              const positionInLine = Math.min(cursorPosition, lastLine.length);
              const newPosition = lastLineStart + positionInLine;
              prevTextarea.setSelectionRange(newPosition, newPosition);
            }
          }, 10);
        }
      } else if (e.key === "ArrowDown" && !showMetricsPanel) {
        // Check if cursor is at the last line of the textarea
        const textAfterCursor = textarea.value.substring(cursorPosition);
        const linesAfterCursor = textAfterCursor.split('\n');
        const isOnLastLine = linesAfterCursor.length === 1;
        
        if (isOnLastLine && blockIndex < blocks.length - 1) {
          e.preventDefault();
          const nextBlock = blocks[blockIndex + 1];
          setTimeout(() => {
            const nextTextarea = blockRefs.current[nextBlock.id];
            if (nextTextarea) {
              nextTextarea.focus();
              // Position cursor at the beginning of the first line
              const lines = nextTextarea.value.split('\n');
              const firstLine = lines[0];
              const cursorColumn = cursorPosition - textarea.value.lastIndexOf('\n', cursorPosition - 1) - 1;
              const newPosition = Math.min(cursorColumn, firstLine.length);
              nextTextarea.setSelectionRange(newPosition, newPosition);
            }
          }, 10);
        }
      }
    },
    [blocks, addBlock, removeBlock, showMetricsPanel]
  );

  const handleSelectMetric = useCallback((metric: Metric) => {
    setSelectedMetric(metric);
    setIsInValueMode(true);
    setMetricValue("");
  }, []);

  const handleConfirmValue = useCallback(() => {
    if (selectedMetric && metricValue.trim() && activeBlockId) {
      const metricName = selectedMetric.name.includes(" ")
        ? `'${selectedMetric.name}'`
        : selectedMetric.name;
      const metricText = `@metric:${metricName}:${metricValue.trim()}`;

      setBlocks((prev) => {
        const newBlocks = prev.map((block) => {
          if (block.id === activeBlockId) {
            const lastAtMetricIndex = block.content.lastIndexOf("@metric:");
            if (lastAtMetricIndex !== -1) {
              const beforeMetric = block.content.substring(
                0,
                lastAtMetricIndex
              );
              return { ...block, content: beforeMetric + metricText + " " };
            }
          }
          return block;
        });
        updateParentValue(newBlocks);
        return newBlocks;
      });

      setShowMetricsPanel(false);
      setMetricSearchQuery("");
      setIsInValueMode(false);
      setSelectedMetric(null);
      setMetricValue("");
      setActiveBlockId(null);

      setTimeout(() => {
        const textarea = blockRefs.current[activeBlockId];
        if (textarea) {
          textarea.focus();
          const newCursorPos =
            textarea.value.lastIndexOf(metricText) + metricText.length + 1;
          textarea.setSelectionRange(newCursorPos, newCursorPos);
          textarea.style.height = 'auto';
          textarea.style.height = textarea.scrollHeight + 'px';
        }
      }, 10);
    }
  }, [selectedMetric, metricValue, activeBlockId, updateParentValue]);

  const handleMetricsPanelClose = useCallback(() => {
    setShowMetricsPanel(false);
    setMetricSearchQuery("");
    setIsInValueMode(false);
    setSelectedMetric(null);
    setMetricValue("");
    setActiveBlockId(null);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!showMetricsPanel) return;

      if (!isInValueMode) {
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
              handleSelectMetric(filteredMetrics[selectedIndex]);
            }
            break;
          case "Escape":
            e.preventDefault();
            e.stopPropagation();
            handleMetricsPanelClose();
            break;
        }
      } else {
        switch (e.key) {
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
  }, [
    showMetricsPanel,
    isInValueMode,
    filteredMetrics,
    selectedIndex,
    handleSelectMetric,
    handleMetricsPanelClose,
  ]);

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
        <Button
          variant="outline"
          size="sm"
          onClick={() => addBlock()}
          className="h-8"
        >
          <Plus className="h-3 w-3 mr-1" />
          Add Block
        </Button>
      </div>

      <div className="relative">
        {activeTab === "edit" ? (
          <div className="flex-1">
            <ScrollArea className="h-[400px] w-full rounded-md border bg-background">
              <div className="p-4">
                {blocks.map((block, index) => {
                  const blockHasMetric = hasCompleteMetric(block.content);
                  const isActiveBlock =
                    showMetricsPanel && activeBlockId === block.id;
                  const isFocusedBlock = focusedBlockId === block.id;

                  return (
                    <div key={block.id} className="-my-1">
                      <div className="flex items-center gap-2 group relative hover:bg-accent/5 rounded-md transition-colors py-1">
                        <div className="flex-1 relative">
                          <textarea
                            ref={(el) => {
                              blockRefs.current[block.id] = el;
                              if (el) {
                                // Force single line height initially
                                el.style.height = '1.2em';
                                // Then expand if content requires it
                                if (el.scrollHeight > el.clientHeight) {
                                  el.style.height = el.scrollHeight + 'px';
                                }
                              }
                            }}
                            value={block.content}
                            onChange={(e) => {
                              updateBlock(block.id, e.target.value);
                              // Reset to auto to get accurate scrollHeight
                              e.target.style.height = '1.2em';
                              // Only expand if content requires it
                              if (e.target.scrollHeight > e.target.clientHeight) {
                                e.target.style.height = e.target.scrollHeight + 'px';
                              }
                            }}
                            onKeyDown={(e) =>
                              handleBlockKeyPress(e, block.id, index)
                            }
                            onFocus={() => setFocusedBlockId(block.id)}
                            onBlur={() => setFocusedBlockId(null)}
                            placeholder={
                              index === 0 && !block.content
                                ? placeholder
                                : "Continue writing..."
                            }
                            rows={1}
                            className={`w-full text-sm transition-colors outline-none bg-transparent placeholder:text-muted-foreground resize-none overflow-hidden leading-tight ${
                              blockHasMetric
                                ? "pr-8"
                                : ""
                            }`}
                            style={{
                              borderLeft: blockHasMetric
                                ? "2px solid #4ade80"
                                : isActiveBlock
                                  ? "2px solid #60a5fa"
                                  : isFocusedBlock
                                    ? "2px solid #a855f7"
                                    : "2px solid transparent",
                              paddingLeft: "8px",
                              paddingTop: "0",
                              paddingBottom: "0",
                              backgroundColor: blockHasMetric
                                ? "rgba(134, 239, 172, 0.1)"
                                : isActiveBlock
                                  ? "rgba(147, 197, 253, 0.1)"
                                  : isFocusedBlock
                                    ? "rgba(168, 85, 247, 0.1)"
                                    : "transparent",
                              marginLeft: "-2px",
                              minHeight: "1.2em",
                              lineHeight: "1.2",
                              font: "inherit"
                            }}
                          />
                          {blockHasMetric && (
                            <div className="absolute right-2 top-1/2 -translate-y-1/2">
                              <Zap className="h-3 w-3 text-green-600" />
                            </div>
                          )}
                        </div>
                        {blocks.length > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeBlock(block.id)}
                            className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700 hover:bg-red-50 absolute -right-10"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>

                      {/* Inline metrics panel for this specific block */}
                      {isActiveBlock && (
                        <div className="w-full flex justify-center mt-1 -mb-1">
                          <div className="w-full">
                            <InlineMetricsPanel
                              onClose={handleMetricsPanelClose}
                              selectedIndex={selectedIndex}
                              filteredMetrics={filteredMetrics}
                              isInValueMode={isInValueMode}
                              selectedMetric={selectedMetric}
                              metricValue={metricValue}
                              onMetricValueChange={setMetricValue}
                              searchQuery={metricSearchQuery}
                              onSelectMetric={handleSelectMetric}
                              onConfirmValue={handleConfirmValue}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {!value ? (
                  <div className="text-xs text-muted-foreground mt-4 p-2 bg-muted/20 rounded">
                    <strong>Tips:</strong>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      <li>
                        Press{" "}
                        <kbd className="px-1 py-0.5 bg-muted rounded text-xs">
                          Enter
                        </kbd>{" "}
                        to create a new block
                      </li>
                      <li>
                        Press{" "}
                        <kbd className="px-1 py-0.5 bg-muted rounded text-xs">
                          Backspace
                        </kbd>{" "}
                        on empty block to delete it
                      </li>
                      <li>
                        Use{" "}
                        <kbd className="px-1 py-0.5 bg-muted rounded text-xs">
                          ↑
                        </kbd>{" "}
                        <kbd className="px-1 py-0.5 bg-muted rounded text-xs">
                          ↓
                        </kbd>{" "}
                        to navigate between blocks
                      </li>
                      <li>
                        Type{" "}
                        <kbd className="px-1 py-0.5 bg-muted rounded text-xs">
                          @metric:
                        </kbd>{" "}
                        to add metrics
                      </li>
                      <li>
                        Press{" "}
                        <kbd className="px-1 py-0.5 bg-muted rounded text-xs">
                          Shift+Enter
                        </kbd>{" "}
                        to add a new line within a block
                      </li>
                      <li>
                        <strong>Each block can only have one @metric</strong> -
                        use separate blocks for multiple metrics
                      </li>
                      <li>
                        All blocks are combined with blank lines when saved
                      </li>
                    </ul>
                  </div>
                ) : null}
              </div>
            </ScrollArea>
          </div>
        ) : (
          <ScrollArea className="h-[400px] w-full rounded-md border">
            <div className="px-3 py-2 text-sm prose prose-sm dark:prose-invert max-w-none">
              {value ? (
                <ReactMarkdown>{value}</ReactMarkdown>
              ) : (
                <p className="text-muted-foreground italic">
                  Nothing to preview yet...
                </p>
              )}
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
}
