import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Edit,
  Eye,
  Plus,
  Zap,
  Search,
  ArrowRight,
  X,
  Lock,
  Check,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useStore } from "@tanstack/react-store";
import dataStore from "@/store/data-store";
import { Metric, DailyLog } from "@/store/experiment-definitions";
import { Todo } from "@/store/todo-definitions";
import { format } from "date-fns";
import { usePin } from "@/hooks/usePin";

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

// Helper function to intelligently quote names based on their content
const smartQuoteName = (name: string): string => {
  // If no spaces, no quotes needed
  if (!name.includes(" ")) {
    return name;
  }

  // Check what characters the name contains
  const hasSingleQuote = name.includes("'");
  const hasDoubleQuote = name.includes('"');

  // Choose quote style based on content
  if (hasSingleQuote && hasDoubleQuote) {
    // Both quotes present, use backticks
    return `\`${name}\``;
  } else if (hasSingleQuote) {
    // Has single quote, use double quotes
    return `"${name}"`;
  } else {
    // Default to single quotes (or has double quotes)
    return `'${name}'`;
  }
};

interface JournalEditorWithMetricsProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  selectedDate: Date;
  isMetricsEnabled?: boolean;
  isTodosEnabled?: boolean;
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
  getExistingMetricValue: (metricId: string) => string | null;
}

interface InlineTodoPanelProps {
  onClose: () => void;
  selectedIndex: number;
  filteredTodos: Todo[];
  searchQuery: string;
  onSelectTodo: (todo: Todo) => void;
}

function InlineTodoPanel({
  onClose,
  selectedIndex,
  filteredTodos,
  searchQuery,
  onSelectTodo,
}: InlineTodoPanelProps) {
  useEffect(() => {
    if (filteredTodos.length > 0) {
      const selectedElement = document.getElementById(
        `todo-option-${selectedIndex}`
      );
      if (selectedElement) {
        selectedElement.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "nearest",
        });
      }
    }
  }, [selectedIndex, filteredTodos.length]);

  return (
    <div className="w-full h-fit shadow-lg border-l-2 border-purple-500 bg-purple-50/30 dark:bg-purple-950/30 rounded-lg">
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-purple-600" />
            <span className="font-medium text-sm">
              Select Todo (Mark for Completion)
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

        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-3 w-3 text-muted-foreground" />
          <div className="text-xs text-muted-foreground pl-7">
            Type to filter or use ↑↓ arrows, Enter to select (completed when
            journal is saved)
          </div>
        </div>

        <div className="text-xs text-muted-foreground">
          {filteredTodos.length} todos ({filteredTodos.filter(t => !t.is_complete).length} incomplete, {filteredTodos.filter(t => t.is_complete).length} completed for this date)
        </div>

        <div className="text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 p-2 rounded border border-amber-200 dark:border-amber-800">
          <strong>Note:</strong> If you have multiple todos with the same name,
          all incomplete instances will be marked as completed when you save
          your journal entry.
        </div>

        <ScrollArea className="h-64" id="todos-scroll-area">
          <div className="space-y-1">
            {filteredTodos.map((todo, index) => {
              const isCompleted = todo.is_complete;
              
              return (
                <Button
                  key={todo.id}
                  id={`todo-option-${index}`}
                  variant="ghost"
                  className={`w-full justify-start p-2 h-auto text-left ${
                    index === selectedIndex
                      ? "bg-accent text-accent-foreground"
                      : "hover:bg-accent"
                  } ${
                    isCompleted
                      ? "border-l-2 border-l-green-500"
                      : ""
                  }`}
                  onClick={() => onSelectTodo(todo)}
                >
                  {index === selectedIndex && (
                    <ArrowRight className="h-4 w-4 text-primary mr-2 flex-shrink-0" />
                  )}
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-1">
                      <span className="font-medium text-sm">{todo.title}</span>
                      {todo.priority && (
                        <Badge
                          variant={
                            todo.priority === "urgent"
                              ? "destructive"
                              : todo.priority === "high"
                                ? "default"
                                : "secondary"
                          }
                          className="text-xs h-4"
                        >
                          {todo.priority}
                        </Badge>
                      )}
                      {isCompleted && (
                        <Badge
                          variant="outline"
                          className="text-xs h-4 bg-green-100 text-green-800 border-green-300"
                        >
                          <Check className="h-2 w-2 mr-1" />
                          Completed
                        </Badge>
                      )}
                    </div>
                    {todo.description && (
                      <div className="text-xs text-muted-foreground">
                        {todo.description}
                      </div>
                    )}
                    {todo.deadline && (
                      <div className="text-xs text-muted-foreground">
                        Due: {format(new Date(todo.deadline), "MMM d, yyyy")}
                      </div>
                    )}
                    {isCompleted && todo.completed_at && (
                      <div className="text-xs font-medium text-green-700 dark:text-green-400">
                        Completed: {format(new Date(todo.completed_at), "MMM d, yyyy")}
                      </div>
                    )}
                  </div>
                  {isCompleted ? (
                    <Check className="h-3 w-3 text-green-600" />
                  ) : (
                    <Check className="h-3 w-3 text-muted-foreground" />
                  )}
                </Button>
              );
            })}
          </div>
        </ScrollArea>

        {filteredTodos.length === 0 && (
          <div className="text-center py-4">
            <div className="text-sm text-muted-foreground">
              No incomplete todos match "{searchQuery}"
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              All matching todos might be completed
            </div>
          </div>
        )}
      </div>
    </div>
  );
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
  getExistingMetricValue,
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
                {filteredMetrics.map((metric, index) => {
                  const existingValue = getExistingMetricValue(metric.id);
                  const hasExistingValue = existingValue !== null;

                  return (
                    <Button
                      key={metric.id}
                      id={`metric-option-${index}`}
                      variant="ghost"
                      className={`w-full justify-start p-2 h-auto text-left ${
                        index === selectedIndex
                          ? "bg-accent text-accent-foreground"
                          : "hover:bg-accent"
                      } ${
                        hasExistingValue
                          ? "border-l-2 border-l-green-500"
                          : ""
                      }`}
                      onClick={() => onSelectMetric(metric)}
                    >
                      {index === selectedIndex && (
                        <ArrowRight className="h-4 w-4 text-primary mr-2 flex-shrink-0" />
                      )}
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
                          {hasExistingValue && (
                            <Badge
                              variant="outline"
                              className="text-xs h-4 bg-green-100 text-green-800 border-green-300"
                            >
                              <Lock className="h-2 w-2 mr-1" />
                              Logged
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {metric.description}
                        </div>
                        {hasExistingValue ? (
                          <div className="text-xs font-medium text-green-700 dark:text-green-400">
                            Current value: {existingValue}
                          </div>
                        ) : (
                          <div className="text-xs text-muted-foreground">
                            Ex:{" "}
                            {getMetricExamples(metric).slice(0, 2).join(", ")}
                          </div>
                        )}
                      </div>
                      {hasExistingValue ? (
                        <Lock className="h-3 w-3 text-green-600" />
                      ) : (
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                      )}
                    </Button>
                  );
                })}
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
                {selectedMetric ? smartQuoteName(selectedMetric.name) : "___"}:
                {metricValue || "___"}
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
  selectedDate,
  isMetricsEnabled = true,
  isTodosEnabled = true,
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

  // Todo-related state
  const [showTodoPanel, setShowTodoPanel] = useState(false);
  const [todoSearchQuery, setTodoSearchQuery] = useState("");
  const [selectedTodoIndex, setSelectedTodoIndex] = useState(0);

  // Block selection state
  const [allBlocksSelected, setAllBlocksSelected] = useState(false);

  // PIN protection
  const { isConfigured, isUnlocked } = usePin();

  const metrics =
    useStore(dataStore, (state) => state.metrics as Metric[]) || [];
  const activeMetrics = metrics.filter((metric) => metric.active);

  const dailyLogs =
    useStore(dataStore, (state) => state.daily_logs as DailyLog[]) || [];

  const todos = useStore(dataStore, (state) => state.todos as Todo[]) || [];
  const incompleteTodos = todos.filter((todo) => !todo.is_complete);

  const getExistingMetricValue = useCallback(
    (metricId: string): string | null => {
      const existingLog = dailyLogs.find((log) => {
        const logDate = new Date(log.date);
        return (
          log.metric_id === metricId &&
          logDate.getFullYear() === selectedDate.getFullYear() &&
          logDate.getMonth() === selectedDate.getMonth() &&
          logDate.getDate() === selectedDate.getDate()
        );
      });
      return existingLog ? existingLog.value : null;
    },
    [dailyLogs, selectedDate]
  );


  const getUsedTodosFromJournal = useCallback((): Set<string> => {
    const usedTodos = new Set<string>();
    const allContent = blocks.map((block) => block.content).join("\n\n");

    // Match patterns like @todo:title:true or @todo:'title with spaces':true
    const todoMatches = allContent.match(
      /@todo:(?:"([^"]*)"|'([^']*)'|`([^`]*)`|([^:]*)):true/g
    );

    if (todoMatches) {
      todoMatches.forEach((match) => {
        // Extract todo title from the match
        const titleMatch = match.match(
          /@todo:(?:"([^"]*)"|'([^']*)'|`([^`]*)`|([^:]*)):/
        );
        if (titleMatch) {
          const todoTitle =
            titleMatch[1] || titleMatch[2] || titleMatch[3] || titleMatch[4]; // double, single, backtick, or unquoted title
          const todo = incompleteTodos.find((t) => t.title === todoTitle);
          if (todo) {
            usedTodos.add(todo.id);
          }
        }
      });
    }

    return usedTodos;
  }, [blocks, incompleteTodos]);

  const getCompletedTodosForDate = useCallback((date: Date): Todo[] => {
    return todos.filter((todo) => {
      if (!todo.is_complete || !todo.completed_at) return false;
      const completedDate = new Date(todo.completed_at);
      return (
        completedDate.getFullYear() === date.getFullYear() &&
        completedDate.getMonth() === date.getMonth() &&
        completedDate.getDate() === date.getDate()
      );
    });
  }, [todos]);

  const filteredMetrics = useMemo(() => {
    // Filter out private metrics if PIN is configured and locked
    const availableMetrics = activeMetrics.filter((metric) => {
      if (metric.private && isConfigured && !isUnlocked) {
        return false; // Hide private metrics when PIN is locked
      }
      return true;
    });

    return metricSearchQuery.trim()
      ? availableMetrics.filter(
          (metric) =>
            metric.name
              .toLowerCase()
              .includes(metricSearchQuery.toLowerCase()) ||
            metric.description
              .toLowerCase()
              .includes(metricSearchQuery.toLowerCase()) ||
            metric.type.toLowerCase().includes(metricSearchQuery.toLowerCase())
        )
      : availableMetrics;
  }, [activeMetrics, metricSearchQuery, isConfigured, isUnlocked]);

  const filteredTodos = useMemo(() => {
    const usedTodos = getUsedTodosFromJournal();
    const completedTodosForDate = getCompletedTodosForDate(selectedDate);
    
    // Combine incomplete todos and todos completed on the selected date
    const incompleteTodosFiltered = incompleteTodos.filter(
      (todo) => !usedTodos.has(todo.id)
    );
    const completedTodosFiltered = completedTodosForDate.filter(
      (todo) => !usedTodos.has(todo.id)
    );
    
    const allAvailableTodos = [...incompleteTodosFiltered, ...completedTodosFiltered];
    
    // Filter out private todos if PIN is configured and locked
    const availableTodos = allAvailableTodos.filter((todo) => {
      if (todo.private && isConfigured && !isUnlocked) {
        return false; // Hide private todos when PIN is locked
      }
      return true;
    });

    return todoSearchQuery.trim()
      ? availableTodos.filter(
          (todo) =>
            todo.title.toLowerCase().includes(todoSearchQuery.toLowerCase()) ||
            (todo.description &&
              todo.description
                .toLowerCase()
                .includes(todoSearchQuery.toLowerCase()))
        )
      : availableTodos;
  }, [incompleteTodos, todoSearchQuery, getUsedTodosFromJournal, getCompletedTodosForDate, selectedDate, isConfigured, isUnlocked]);

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

  useEffect(() => {
    blocks.forEach((block) => {
      const textarea = blockRefs.current[block.id];
      if (textarea) {
        textarea.style.height = "1.2em";

        if (textarea.scrollHeight > textarea.clientHeight) {
          textarea.style.height = textarea.scrollHeight + "px";
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
          textarea.style.height = "auto";
          textarea.style.height = textarea.scrollHeight + "px";
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
      /@metric:(?:"[^"]*"|'[^']*'|`[^`]*`|[^:]*):(?![:\s])[^\s@]+/g
    );
    return metricMatches !== null && metricMatches.length > 0;
  }, []);

  const hasCompleteTodo = useCallback((content: string): boolean => {
    const todoMatches = content.match(
      /@todo:(?:"[^"]*"|'[^']*'|`[^`]*`|[^:]*):true/g
    );
    return todoMatches !== null && todoMatches.length > 0;
  }, []);

  const hasAnyMetricOrTodo = useCallback(
    (content: string): boolean => {
      return (
        hasCompleteMetric(content) ||
        hasCompleteTodo(content) ||
        content.includes("@metric:") ||
        content.includes("@todo:")
      );
    },
    [hasCompleteMetric, hasCompleteTodo]
  );

  const hasAnyMetricOrTodoOnLine = useCallback(
    (content: string, cursorPosition: number): boolean => {
      const lines = content.split('\n');
      let currentPos = 0;
      
      // Find which line the cursor is on
      for (let i = 0; i < lines.length; i++) {
        const lineLength = lines[i].length;
        if (cursorPosition <= currentPos + lineLength) {
          // This is the line with the cursor
          const currentLine = lines[i];
          // Only check for complete metrics/todos, not partial ones being typed
          return (
            hasCompleteMetric(currentLine) ||
            hasCompleteTodo(currentLine)
          );
        }
        currentPos += lineLength + 1; // +1 for the newline character
      }
      
      // If we can't find the line, just return false to allow autocomplete
      return false;
    },
    [hasCompleteMetric, hasCompleteTodo]
  );

  const updateBlock = useCallback(
    (blockId: string, content: string, cursorPosition?: number) => {
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

        // Schedule parent update asynchronously
        setTimeout(() => {
          updateParentValue(newBlocks);
        }, 0);

        return newBlocks;
      });

      // Schedule panel state updates for the next tick to avoid setState during render
      setTimeout(() => {
        const lastAtMetricIndex = content.lastIndexOf("@metric:");
        const lastAtTodoIndex = content.lastIndexOf("@todo:");

        if (
          lastAtMetricIndex !== -1 &&
          (lastAtTodoIndex === -1 || lastAtMetricIndex > lastAtTodoIndex)
        ) {
          const textAfterMetric = content.substring(lastAtMetricIndex);

          const spaceAfterMetric = textAfterMetric.indexOf(" ");
          const isIncompleteMetric =
            spaceAfterMetric === -1 ||
            (spaceAfterMetric > 0 &&
              textAfterMetric.substring(spaceAfterMetric).trim() === "");

          if (isIncompleteMetric) {
            const isActivelyTypingMetric =
              content.endsWith("@metric:") ||
              (lastAtMetricIndex !== -1 &&
                content.substring(lastAtMetricIndex).startsWith("@metric:"));

            // Only show panel if line doesn't already have a metric or todo
            const alreadyHasMetricOrTodo = cursorPosition !== undefined 
              ? hasAnyMetricOrTodoOnLine(content, cursorPosition)
              : hasAnyMetricOrTodo(content.substring(0, lastAtMetricIndex));

            if (
              isActivelyTypingMetric &&
              !alreadyHasMetricOrTodo &&
              isMetricsEnabled
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
        } else if (
          lastAtTodoIndex !== -1 &&
          (lastAtMetricIndex === -1 || lastAtTodoIndex > lastAtMetricIndex)
        ) {
          // Handle @todo: similar to @metric:
          const textAfterTodo = content.substring(lastAtTodoIndex);

          const spaceAfterTodo = textAfterTodo.indexOf(" ");
          const isIncompleteTodo =
            spaceAfterTodo === -1 ||
            (spaceAfterTodo > 0 &&
              textAfterTodo.substring(spaceAfterTodo).trim() === "");

          if (isIncompleteTodo) {
            // Only show panel if line doesn't already have a metric or todo
            const alreadyHasMetricOrTodo = cursorPosition !== undefined 
              ? hasAnyMetricOrTodoOnLine(content, cursorPosition)
              : hasAnyMetricOrTodo(content.substring(0, lastAtTodoIndex));

            if (!alreadyHasMetricOrTodo && isTodosEnabled) {
              const searchQuery = textAfterTodo.substring(6); // "@todo:" length is 6
              setTodoSearchQuery(searchQuery);
              setShowTodoPanel(true);
              setActiveBlockId(blockId);
              setSelectedTodoIndex(0);

              // Hide metrics panel if it's open
              setShowMetricsPanel(false);
              setMetricSearchQuery("");
            } else {
              setShowTodoPanel(false);
              setTodoSearchQuery("");
              setActiveBlockId(null);
            }
          } else {
            setShowTodoPanel(false);
            setTodoSearchQuery("");
            setActiveBlockId(null);
          }
        } else {
          setShowMetricsPanel(false);
          setMetricSearchQuery("");
          setShowTodoPanel(false);
          setTodoSearchQuery("");
          setActiveBlockId(null);
        }
      }, 0);
    },
    [updateParentValue, hasAnyMetricOrTodo, hasAnyMetricOrTodoOnLine]
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

        // Get the current block content
        const textBeforeCursor = textarea.value.substring(0, cursorPosition);
        const textAfterCursor = textarea.value.substring(cursorPosition);

        // Update current block with only text before cursor
        updateBlock(blockId, textBeforeCursor, textBeforeCursor.length);

        // Create new block with text after cursor
        const newBlock: Block = {
          id: generateBlockId(),
          content: textAfterCursor,
        };

        setBlocks((prev) => {
          const newBlocks = [...prev];
          newBlocks.splice(blockIndex + 1, 0, newBlock);
          updateParentValue(newBlocks);
          return newBlocks;
        });

        // Focus the new block and set cursor to beginning
        setTimeout(() => {
          const newTextarea = blockRefs.current[newBlock.id];
          if (newTextarea) {
            newTextarea.focus();
            newTextarea.setSelectionRange(0, 0);
            newTextarea.style.height = "auto";
            newTextarea.style.height = newTextarea.scrollHeight + "px";
          }
        }, 10);
      } else if (e.key === "Enter" && e.shiftKey) {
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
              textarea.setSelectionRange(
                textarea.value.length,
                textarea.value.length
              );
            }
          }, 10);
        }
      } else if (e.key === "ArrowUp" && !showMetricsPanel && !showTodoPanel) {
        const textBeforeCursor = textarea.value.substring(0, cursorPosition);
        const linesBeforeCursor = textBeforeCursor.split("\n");
        const isOnFirstLine = linesBeforeCursor.length === 1;

        if (isOnFirstLine && blockIndex > 0) {
          e.preventDefault();
          const prevBlock = blocks[blockIndex - 1];
          setTimeout(() => {
            const prevTextarea = blockRefs.current[prevBlock.id];
            if (prevTextarea) {
              prevTextarea.focus();

              const lines = prevTextarea.value.split("\n");
              const lastLine = lines[lines.length - 1];
              const lastLineStart = prevTextarea.value.lastIndexOf(lastLine);
              const positionInLine = Math.min(cursorPosition, lastLine.length);
              const newPosition = lastLineStart + positionInLine;
              prevTextarea.setSelectionRange(newPosition, newPosition);
            }
          }, 10);
        }
      } else if (e.key === "ArrowDown" && !showMetricsPanel && !showTodoPanel) {
        const textAfterCursor = textarea.value.substring(cursorPosition);
        const linesAfterCursor = textAfterCursor.split("\n");
        const isOnLastLine = linesAfterCursor.length === 1;

        if (isOnLastLine && blockIndex < blocks.length - 1) {
          e.preventDefault();
          const nextBlock = blocks[blockIndex + 1];
          setTimeout(() => {
            const nextTextarea = blockRefs.current[nextBlock.id];
            if (nextTextarea) {
              nextTextarea.focus();

              const lines = nextTextarea.value.split("\n");
              const firstLine = lines[0];
              const cursorColumn =
                cursorPosition -
                textarea.value.lastIndexOf("\n", cursorPosition - 1) -
                1;
              const newPosition = Math.min(cursorColumn, firstLine.length);
              nextTextarea.setSelectionRange(newPosition, newPosition);
            }
          }, 10);
        }
      }
    },
    [blocks, addBlock, removeBlock, showMetricsPanel, showTodoPanel]
  );

  const handleSelectMetric = useCallback(
    (metric: Metric) => {
      const existingValue = getExistingMetricValue(metric.id);

      if (existingValue && activeBlockId) {
        const metricName = smartQuoteName(metric.name);
        const metricText = `@metric:${metricName}:${existingValue}`;

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

          // Schedule parent update asynchronously
          setTimeout(() => {
            updateParentValue(newBlocks);
          }, 0);

          return newBlocks;
        });

        setShowMetricsPanel(false);
        setMetricSearchQuery("");
        setActiveBlockId(null);

        setTimeout(() => {
          const textarea = blockRefs.current[activeBlockId];
          if (textarea) {
            textarea.focus();
            const newCursorPos =
              textarea.value.lastIndexOf(metricText) + metricText.length + 1;
            textarea.setSelectionRange(newCursorPos, newCursorPos);
            textarea.style.height = "auto";
            textarea.style.height = textarea.scrollHeight + "px";
          }
        }, 10);
      } else if (metric.type === "boolean" && activeBlockId) {
        const metricName = smartQuoteName(metric.name);
        const metricText = `@metric:${metricName}:true`;

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

          // Schedule parent update asynchronously
          setTimeout(() => {
            updateParentValue(newBlocks);
          }, 0);

          return newBlocks;
        });

        setShowMetricsPanel(false);
        setMetricSearchQuery("");
        setActiveBlockId(null);

        setTimeout(() => {
          const textarea = blockRefs.current[activeBlockId];
          if (textarea) {
            textarea.focus();
            const newCursorPos =
              textarea.value.lastIndexOf(metricText) + metricText.length + 1;
            textarea.setSelectionRange(newCursorPos, newCursorPos);
            textarea.style.height = "auto";
            textarea.style.height = textarea.scrollHeight + "px";
          }
        }, 10);
      } else {
        setSelectedMetric(metric);
        setIsInValueMode(true);
        setMetricValue("");
      }
    },
    [getExistingMetricValue, activeBlockId, updateParentValue]
  );

  const handleSelectTodo = useCallback(
    (todo: Todo) => {
      if (activeBlockId) {
        // Format todo similar to metric: @todo:<name>:true
        const todoName = smartQuoteName(todo.title);
        const todoText = `@todo:${todoName}:true`;

        setBlocks((prev) => {
          const newBlocks = prev.map((block) => {
            if (block.id === activeBlockId) {
              const lastAtTodoIndex = block.content.lastIndexOf("@todo:");
              if (lastAtTodoIndex !== -1) {
                const beforeTodo = block.content.substring(0, lastAtTodoIndex);
                return { ...block, content: beforeTodo + todoText + " " };
              }
            }
            return block;
          });

          // Schedule parent update asynchronously
          setTimeout(() => {
            updateParentValue(newBlocks);
          }, 0);

          return newBlocks;
        });

        setShowTodoPanel(false);
        setTodoSearchQuery("");
        setActiveBlockId(null);

        setTimeout(() => {
          const textarea = blockRefs.current[activeBlockId];
          if (textarea) {
            textarea.focus();
            const newCursorPos =
              textarea.value.lastIndexOf(todoText) + todoText.length + 1;
            textarea.setSelectionRange(newCursorPos, newCursorPos);
            textarea.style.height = "auto";
            textarea.style.height = textarea.scrollHeight + "px";
          }
        }, 10);
      }
    },
    [activeBlockId, updateParentValue]
  );

  const handleConfirmValue = useCallback(() => {
    if (selectedMetric && metricValue.trim() && activeBlockId) {
      const metricName = smartQuoteName(selectedMetric.name);
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

        // Schedule parent update asynchronously
        setTimeout(() => {
          updateParentValue(newBlocks);
        }, 0);

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
          textarea.style.height = "auto";
          textarea.style.height = textarea.scrollHeight + "px";
        }
      }, 10);
    }
  }, [selectedMetric, metricValue, activeBlockId, updateParentValue]);

  const handleContainerClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const target = e.target as HTMLElement;

      if (
        target.tagName === "TEXTAREA" ||
        target.tagName === "BUTTON" ||
        target.closest("button")
      ) {
        return;
      }

      if (
        target.closest("[data-radix-popper-content-wrapper]") ||
        target.closest(".metrics-panel")
      ) {
        return;
      }

      if (blocks.length === 0) {
        addBlock();
        return;
      }

      const clickY = e.clientY;

      const blockPositions = blocks
        .map((block) => {
          const textarea = blockRefs.current[block.id];
          if (!textarea) return null;

          const rect = textarea.getBoundingClientRect();
          return {
            block,
            textarea,
            top: rect.top,
            bottom: rect.bottom,
            centerY: rect.top + rect.height / 2,
          };
        })
        .filter((pos): pos is NonNullable<typeof pos> => pos !== null);

      if (blockPositions.length === 0) return;

      // Find the closest block to the click position
      let closestBlock = null;
      let minDistance = Infinity;

      for (const blockPos of blockPositions) {
        // Check if click is within the block's vertical bounds
        if (clickY >= blockPos.top && clickY <= blockPos.bottom) {
          closestBlock = blockPos;
          break;
        }
        
        // Otherwise calculate distance to the block
        const distanceToTop = Math.abs(clickY - blockPos.top);
        const distanceToBottom = Math.abs(clickY - blockPos.bottom);
        const distance = Math.min(distanceToTop, distanceToBottom);
        
        if (distance < minDistance) {
          minDistance = distance;
          closestBlock = blockPos;
        }
      }

      // If clicking below all blocks, focus the last block
      const lastBlockPos = blockPositions[blockPositions.length - 1];
      if (clickY > lastBlockPos.bottom) {
        lastBlockPos.textarea.focus();
        lastBlockPos.textarea.scrollIntoView({
          behavior: "smooth",
          block: "center",
          inline: "nearest"
        });
        setTimeout(() => {
          lastBlockPos.textarea.setSelectionRange(
            lastBlockPos.textarea.value.length,
            lastBlockPos.textarea.value.length
          );
        }, 0);
        return;
      }

      // If clicking above all blocks, focus the first block
      const firstBlockPos = blockPositions[0];
      if (clickY < firstBlockPos.top) {
        firstBlockPos.textarea.focus();
        firstBlockPos.textarea.scrollIntoView({
          behavior: "smooth",
          block: "center",
          inline: "nearest"
        });
        setTimeout(() => {
          firstBlockPos.textarea.setSelectionRange(0, 0);
        }, 0);
        return;
      }

      // Focus the closest block
      if (closestBlock) {
        closestBlock.textarea.focus();
        
        // Scroll the block into view
        closestBlock.textarea.scrollIntoView({
          behavior: "smooth",
          block: "center",
          inline: "nearest"
        });
        
        // Try to position cursor based on click X position within the textarea
        const clickX = e.clientX;
        const textareaRect = closestBlock.textarea.getBoundingClientRect();
        const relativeX = clickX - textareaRect.left;
        
        // Simple heuristic: if clicking in the right half, put cursor at end
        // Otherwise put it at the beginning
        setTimeout(() => {
          if (relativeX > textareaRect.width / 2) {
            closestBlock.textarea.setSelectionRange(
              closestBlock.textarea.value.length,
              closestBlock.textarea.value.length
            );
          } else {
            closestBlock.textarea.setSelectionRange(0, 0);
          }
        }, 0);
      }
    },
    [blocks, addBlock]
  );

  const handleMetricsPanelClose = useCallback(() => {
    setShowMetricsPanel(false);
    setMetricSearchQuery("");
    setIsInValueMode(false);
    setSelectedMetric(null);
    setMetricValue("");
    setActiveBlockId(null);
  }, []);

  const handleTodoPanelClose = useCallback(() => {
    setShowTodoPanel(false);
    setTodoSearchQuery("");
    setSelectedTodoIndex(0);
    setActiveBlockId(null);
  }, []);

  const selectAllBlocks = useCallback(() => {
    if (allBlocksSelected) {
      // Deselect all blocks
      setAllBlocksSelected(false);
      blocks.forEach((block) => {
        const textarea = blockRefs.current[block.id];
        if (textarea) {
          textarea.setSelectionRange(0, 0);
        }
      });
    } else {
      // Select all blocks
      setAllBlocksSelected(true);
      blocks.forEach((block) => {
        const textarea = blockRefs.current[block.id];
        if (textarea && block.content) {
          textarea.setSelectionRange(0, block.content.length);
        }
      });
    }
  }, [allBlocksSelected, blocks]);

  const copyAllBlocks = useCallback(async () => {
    if (allBlocksSelected) {
      const combinedContent = blocks.map((block) => block.content).join("\n\n");

      try {
        await navigator.clipboard.writeText(combinedContent);
      } catch (err) {
        console.error("Failed to copy to clipboard:", err);
      }
    }
  }, [allBlocksSelected, blocks]);

  const deleteAllBlocks = useCallback(() => {
    if (allBlocksSelected) {
      // Clear all blocks and reset to single empty block
      const newBlock = { id: generateBlockId(), content: "" };
      setBlocks([newBlock]);
      setAllBlocksSelected(false);
      updateParentValue([newBlock]);

      // Focus the new empty block
      setTimeout(() => {
        const textarea = blockRefs.current[newBlock.id];
        if (textarea) {
          textarea.focus();
        }
      }, 10);
    }
  }, [allBlocksSelected, updateParentValue]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Global shortcuts that work regardless of panel state
      if (e.ctrlKey && e.shiftKey && e.key === "A") {
        e.preventDefault();
        e.stopPropagation();
        selectAllBlocks();
        return;
      }

      if (allBlocksSelected) {
        switch (e.key) {
          case "c":
            if (e.ctrlKey) {
              e.preventDefault();
              e.stopPropagation();
              copyAllBlocks();
            }
            break;
          case "Delete":
          case "Backspace":
            e.preventDefault();
            e.stopPropagation();
            deleteAllBlocks();
            break;
          case "Escape":
            e.preventDefault();
            e.stopPropagation();
            setAllBlocksSelected(false);
            blocks.forEach((block) => {
              const textarea = blockRefs.current[block.id];
              if (textarea) {
                textarea.setSelectionRange(0, 0);
              }
            });
            break;
        }
        return;
      }

      if (showTodoPanel) {
        switch (e.key) {
          case "ArrowDown":
            e.preventDefault();
            e.stopPropagation();
            setSelectedTodoIndex((prev) =>
              prev < filteredTodos.length - 1 ? prev + 1 : 0
            );
            break;
          case "ArrowUp":
            e.preventDefault();
            e.stopPropagation();
            setSelectedTodoIndex((prev) =>
              prev > 0 ? prev - 1 : filteredTodos.length - 1
            );
            break;
          case "Enter":
            e.preventDefault();
            e.stopPropagation();
            if (filteredTodos[selectedTodoIndex]) {
              handleSelectTodo(filteredTodos[selectedTodoIndex]);
            }
            break;
          case "Escape":
            e.preventDefault();
            e.stopPropagation();
            handleTodoPanelClose();
            break;
        }
        return;
      }

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
    showTodoPanel,
    isInValueMode,
    filteredMetrics,
    filteredTodos,
    selectedIndex,
    selectedTodoIndex,
    handleSelectMetric,
    handleSelectTodo,
    handleMetricsPanelClose,
    handleTodoPanelClose,
    allBlocksSelected,
    selectAllBlocks,
    copyAllBlocks,
    deleteAllBlocks,
    blocks,
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
        {allBlocksSelected && (
          <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 text-xs">
            <span>All blocks selected</span>
            <Badge variant="outline" className="text-xs h-4">
              Ctrl+C to copy, Del to delete, Esc to deselect
            </Badge>
          </div>
        )}
      </div>

      <div className="relative">
        {activeTab === "edit" ? (
          <div className="flex-1">
            <div className="min-h-[400px] max-h-[60vh] w-full rounded-md border bg-background overflow-y-hidden hover:overflow-y-auto overscroll-contain transition-all duration-200">
              <div 
                className="p-4 min-h-full cursor-text" 
                onClick={handleContainerClick}
                style={{ minHeight: "inherit" }}
              >
                {blocks.map((block, index) => {
                  const blockHasMetric = hasCompleteMetric(block.content);
                  const blockHasTodo = hasCompleteTodo(block.content);
                  const blockHasAnyMetricOrTodo =
                    blockHasMetric || blockHasTodo;
                  const isActiveBlock =
                    (showMetricsPanel || showTodoPanel) &&
                    activeBlockId === block.id;
                  const isFocusedBlock = focusedBlockId === block.id;
                  const isSelectedBlock = allBlocksSelected;

                  return (
                    <div key={block.id} className="-my-1">
                      <div className="flex items-center gap-2 group relative hover:bg-accent/5 rounded-md transition-colors py-1">
                        <div className="flex-1 relative">
                          <textarea
                            ref={(el) => {
                              blockRefs.current[block.id] = el;
                              if (el) {
                                el.style.height = "1.2em";

                                if (el.scrollHeight > el.clientHeight) {
                                  el.style.height = el.scrollHeight + "px";
                                }
                              }
                            }}
                            value={block.content}
                            onChange={(e) => {
                              const cursorPos = e.target.selectionStart || 0;
                              updateBlock(block.id, e.target.value, cursorPos);

                              e.target.style.height = "1.2em";

                              if (
                                e.target.scrollHeight > e.target.clientHeight
                              ) {
                                e.target.style.height =
                                  e.target.scrollHeight + "px";
                              }
                            }}
                            onKeyDown={(e) =>
                              handleBlockKeyPress(e, block.id, index)
                            }
                            onFocus={() => setFocusedBlockId(block.id)}
                            onBlur={() => {
                              setFocusedBlockId(null);
                            }}
                            placeholder={
                              index === 0 && !block.content
                                ? placeholder
                                : "Continue writing..."
                            }
                            rows={1}
                            className={`w-full text-sm transition-colors outline-none bg-transparent placeholder:text-muted-foreground resize-none overflow-hidden leading-tight ${
                              blockHasAnyMetricOrTodo ? "pr-8" : ""
                            }`}
                            style={{
                              borderLeft: isSelectedBlock
                                ? "2px solid #f59e0b"
                                : isFocusedBlock
                                  ? "2px solid #a855f7"
                                  : isActiveBlock
                                    ? "2px solid #60a5fa"
                                    : blockHasAnyMetricOrTodo
                                      ? "2px solid #4ade80"
                                      : "2px solid transparent",
                              paddingLeft: "8px",
                              paddingTop: "0",
                              paddingBottom: "0",
                              backgroundColor: isSelectedBlock
                                ? "rgba(245, 158, 11, 0.15)"
                                : isFocusedBlock
                                  ? "rgba(168, 85, 247, 0.1)"
                                  : isActiveBlock
                                    ? "rgba(147, 197, 253, 0.1)"
                                    : blockHasAnyMetricOrTodo
                                      ? "rgba(134, 239, 172, 0.1)"
                                      : "transparent",
                              marginLeft: "-2px",
                              minHeight: "1.2em",
                              lineHeight: "1.2",
                              font: "inherit",
                            }}
                          />
                          {blockHasAnyMetricOrTodo && (
                            <div className="absolute right-2 top-1/2 -translate-y-1/2">
                              {blockHasMetric ? (
                                <Zap className="h-3 w-3 text-green-600" />
                              ) : (
                                <Check className="h-3 w-3 text-purple-600" />
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Inline metrics panel for this specific block */}
                      {isActiveBlock && showMetricsPanel && (
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
                              getExistingMetricValue={getExistingMetricValue}
                            />
                          </div>
                        </div>
                      )}

                      {/* Inline todo panel for this specific block */}
                      {isActiveBlock && showTodoPanel && (
                        <div className="w-full flex justify-center mt-1 -mb-1">
                          <div className="w-full">
                            <InlineTodoPanel
                              onClose={handleTodoPanelClose}
                              selectedIndex={selectedTodoIndex}
                              filteredTodos={filteredTodos}
                              searchQuery={todoSearchQuery}
                              onSelectTodo={handleSelectTodo}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Add invisible spacer to ensure minimum clickable area */}
                <div className="min-h-[100px]" aria-hidden="true" />
                
                {!value ? (
                  <div className="text-xs text-muted-foreground mt-4 p-2 bg-muted/20 rounded">
                    <strong>Tips:</strong>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      <li>
                        Click anywhere in the editor to focus the nearest block
                      </li>
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
                      {isMetricsEnabled && (
                        <li>
                          Type{" "}
                          <kbd className="px-1 py-0.5 bg-muted rounded text-xs">
                            @metric:
                          </kbd>{" "}
                          to add metrics
                        </li>
                      )}
                      {isTodosEnabled && (
                        <li>
                          Type{" "}
                          <kbd className="px-1 py-0.5 bg-muted rounded text-xs">
                            @todo:
                          </kbd>{" "}
                          to mark todos for completion (completed when saved)
                        </li>
                      )}
                      <li>
                        <strong>Note:</strong> If you have multiple todos with
                        the same name, all incomplete instances will be marked
                        as completed
                      </li>
                      <li>
                        Press{" "}
                        <kbd className="px-1 py-0.5 bg-muted rounded text-xs">
                          Shift+Enter
                        </kbd>{" "}
                        to add a new line within a block
                      </li>
                      <li>
                        Press{" "}
                        <kbd className="px-1 py-0.5 bg-muted rounded text-xs">
                          Ctrl+Shift+A
                        </kbd>{" "}
                        to select all blocks for copying or deleting
                      </li>
                      <li>
                        <strong>
                          Each block can only have one @metric: OR one @todo:
                        </strong>{" "}
                        - use separate blocks for multiple items
                      </li>
                      <li>
                        All blocks are combined with blank lines when saved
                      </li>
                    </ul>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        ) : (
          <div className="min-h-[400px] max-h-[60vh] w-full rounded-md border overflow-y-hidden hover:overflow-y-auto overscroll-contain transition-all duration-200">
            <div className="px-3 py-2 text-sm prose prose-sm dark:prose-invert max-w-none">
              {value ? (
                <ReactMarkdown>{value}</ReactMarkdown>
              ) : (
                <p className="text-muted-foreground italic">
                  Nothing to preview yet...
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
