// frontend/src/features/todos/todo-list.tsx
import { useState, useEffect } from "react";
import { useStore } from "@tanstack/react-store";
import dataStore, { deleteEntry, updateEntry } from "@/store/data-store";
import loadingStore from "@/store/loading-store";
import { Todo, TodoPriority, TodoStatus } from "@/store/todo-definitions.d";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Calendar, CheckCircle2, Clock } from "lucide-react";
import { formatDistanceToNow, isPast } from "date-fns";
import AddTodoButton from "./add-todo-button";
import { ConfirmDeleteDialog } from "@/components/reusable/confirm-delete-dialog";
import { ApiService } from "@/services/api";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";
import TodoStats from "./todo-stats";
import ReusableTabs from "@/components/reusable/reusable-tabs";
import { getSortedTodos } from "./todo-utils";

export default function TodoList() {
  const todos = useStore(dataStore, (state) => state.todos as Todo[]);
  const isLoading = useStore(loadingStore, (state) => state.todos);
  const [todoMetrics, setTodoMetrics] = useState<Record<string, any>>({});

  // Load related metrics data for todos
  useEffect(() => {
    const loadMetrics = async () => {
      const metrics = await ApiService.getRecordsWithRelations<any>("metrics");
      const metricMap: Record<string, any> = {};
      metrics.forEach((metric) => {
        metricMap[metric.id] = metric;
      });
      setTodoMetrics(metricMap);
    };

    loadMetrics();
  }, []);

  // Filter todos based on active tab
  const getFilteredTodos = (tabId: string) => {
    return todos.filter((todo) => {
      switch (tabId) {
        case "active":
          return !todo.isComplete;
        case "overdue":
          return !todo.isComplete && isPast(new Date(todo.deadline));
        case "completed":
          return todo.isComplete;
        default:
          return true;
      }
    });
  };

  const handleCompleteTodo = async (todo: Todo) => {
    const updatedTodo = {
      ...todo,
      isComplete: true,
      completedAt: new Date(),
      status: TodoStatus.COMPLETED,
    };

    try {
      const response = await ApiService.updateRecord(todo.id, updatedTodo);
      if (response) {
        updateEntry(todo.id, response, "todos");
        toast.success(`"${todo.title}" marked as completed!`);

        // If todo has a related metric, check if it's in the "Todo" category
        if (todo.relatedMetricId && todoMetrics[todo.relatedMetricId]) {
          const metric = todoMetrics[todo.relatedMetricId];

          // Check if the metric belongs to the "Todo" category
          let shouldDeactivate = false;
          if (
            metric.category_id_data &&
            metric.category_id_data.name === "Todo"
          ) {
            shouldDeactivate = true;
          }

          if (shouldDeactivate) {
            const updatedMetric = {
              ...metric,
              active: false,
            };

            const metricResponse = await ApiService.updateRecord(
              todo.relatedMetricId,
              updatedMetric
            );
            if (metricResponse) {
              updateEntry(todo.relatedMetricId, metricResponse, "metrics");
              toast.info("Related metric has been marked as inactive");
            }
          }
        }
      }
    } catch (error) {
      console.error("Failed to complete todo:", error);
      toast.error("Failed to complete todo");
    }
  };

  const handleDeleteTodo = async (id: string) => {
    try {
      await ApiService.deleteRecord(id);
      deleteEntry(id, "todos");
      toast.success("Todo deleted successfully");
    } catch (error) {
      console.error("Failed to delete todo:", error);
      toast.error("Failed to delete todo");
    }
  };

  const getPriorityBadge = (priority: TodoPriority) => {
    const variants: Record<
      TodoPriority,
      {
        variant: "default" | "secondary" | "destructive" | "outline";
        label: string;
      }
    > = {
      [TodoPriority.LOW]: { variant: "outline", label: "Low" },
      [TodoPriority.MEDIUM]: { variant: "secondary", label: "Medium" },
      [TodoPriority.HIGH]: { variant: "default", label: "High" },
      [TodoPriority.URGENT]: { variant: "destructive", label: "Urgent" },
    };

    const config = variants[priority];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getDeadlineStatus = (deadline: string, isComplete: boolean) => {
    if (isComplete) return null;

    const deadlineDate = new Date(deadline);
    const isPastDeadline = isPast(deadlineDate);

    if (isPastDeadline) {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          Overdue
        </Badge>
      );
    }

    // Calculate how many days until deadline
    const daysUntil = Math.ceil(
      (deadlineDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    if (daysUntil <= 3) {
      return (
        <Badge
          variant="warning"
          className="flex items-center gap-1 bg-amber-500 text-white"
        >
          <Clock className="h-3 w-3" />
          {daysUntil === 0
            ? "Due today"
            : `${daysUntil} day${daysUntil > 1 ? "s" : ""} left`}
        </Badge>
      );
    }

    return (
      <Badge variant="outline" className="flex items-center gap-1">
        <Calendar className="h-3 w-3" />
        {daysUntil} days left
      </Badge>
    );
  };

  function renderTodoList(tabId: string) {
    const filteredTodos = getFilteredTodos(tabId);
    const sortedTodos = getSortedTodos(filteredTodos);

    if (sortedTodos.length === 0) {
      return (
        <Card className="border-dashed">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground mb-4">
              {tabId === "completed"
                ? "You haven't completed any todos yet."
                : tabId === "overdue"
                  ? "No overdue todos. Great job staying on track!"
                  : "No todos found. Create one to get started!"}
            </p>
            <AddTodoButton />
          </CardContent>
        </Card>
      );
    }

    return (
      <>
        {sortedTodos.map((todo) => (
          <Card
            key={todo.id}
            className={`border-l-4 ${
              todo.isComplete
                ? "border-l-green-500"
                : isPast(new Date(todo.deadline))
                  ? "border-l-red-500"
                  : "border-l-blue-500"
            }`}
          >
            <CardContent className="py-3 px-4">
              <div className="flex items-center justify-between">
                {/* Left section - Title and info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <h3
                      className={`font-medium truncate ${
                        todo.isComplete
                          ? "line-through text-muted-foreground"
                          : ""
                      }`}
                    >
                      {todo.title}
                    </h3>
                    <div className="flex flex-wrap gap-2 items-center">
                      {getPriorityBadge(todo.priority as TodoPriority)}
                      {getDeadlineStatus(
                        todo.deadline.toISOString(),
                        todo.isComplete
                      )}

                      {todo.tags &&
                        todo.tags.length > 0 &&
                        todo.tags.slice(0, 2).map((tag, index) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="text-xs"
                          >
                            {tag}
                          </Badge>
                        ))}

                      {todo.tags && todo.tags.length > 2 && (
                        <Badge variant="secondary" className="text-xs">
                          +{todo.tags.length - 2}
                        </Badge>
                      )}

                      {todo.relatedMetricId &&
                        todoMetrics[todo.relatedMetricId] && (
                          <Badge
                            variant="outline"
                            className="flex gap-1 items-center text-xs"
                          >
                            <Link
                              to="/metric"
                              search={{
                                query: todoMetrics[todo.relatedMetricId].name,
                              }}
                            >
                              {todoMetrics[todo.relatedMetricId].name}
                            </Link>
                          </Badge>
                        )}
                    </div>
                    {todo.description && (
                      <p className="text-sm text-muted-foreground truncate max-w-xs">
                        {todo.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right section - Actions */}
                <div className="flex gap-1 ml-4">
                  {!todo.isComplete && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCompleteTodo(todo)}
                      className="h-8 w-8 p-0 text-green-600 hover:bg-green-50"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                    </Button>
                  )}
                  {!todo.isComplete && (
                    <>
                      <AddTodoButton
                        existingTodo={todo}
                        onSuccess={() => {
                          // Refresh metrics data after update
                          const loadMetrics = async () => {
                            const metrics =
                              await ApiService.getRecordsWithRelations<any>(
                                "metrics"
                              );
                            const metricMap: Record<string, any> = {};
                            metrics.forEach((metric) => {
                              metricMap[metric.id] = metric;
                            });
                            setTodoMetrics(metricMap);
                          };
                          loadMetrics();
                        }}
                      />
                      <ConfirmDeleteDialog
                        title={`Delete "${todo.title}"?`}
                        description="This will permanently remove this todo. This action cannot be undone."
                        onConfirm={() => handleDeleteTodo(todo.id)}
                        variant="ghost"
                        size="sm"
                      />
                    </>
                  )}
                </div>
              </div>

              {/* Footer info */}
              <div className="mt-2 pt-2 border-t text-xs text-muted-foreground flex justify-between items-center">
                <div>
                  Deadline: {new Date(todo.deadline).toLocaleDateString()}
                  {!todo.isComplete && (
                    <span>
                      {" "}
                      -{" "}
                      {formatDistanceToNow(new Date(todo.deadline), {
                        addSuffix: true,
                      })}
                    </span>
                  )}
                </div>

                {todo.failedDeadlines && todo.failedDeadlines.length > 0 && (
                  <div>
                    {todo.failedDeadlines.length} failed deadline
                    {todo.failedDeadlines.length > 1 ? "s" : ""}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // Define tabs configuration for ReusableTabs
  const tabs = [
    {
      id: "all",
      label: `All (${todos.length})`,
      content: <div className="space-y-4">{renderTodoList("all")}</div>,
    },
    {
      id: "active",
      label: `Active (${todos.filter((t) => !t.isComplete).length})`,
      content: <div className="space-y-4">{renderTodoList("active")}</div>,
    },
    {
      id: "overdue",
      label: `Overdue (${
        todos.filter((t) => !t.isComplete && isPast(new Date(t.deadline)))
          .length
      })`,
      content: <div className="space-y-4">{renderTodoList("overdue")}</div>,
    },
    {
      id: "completed",
      label: `Completed (${todos.filter((t) => t.isComplete).length})`,
      content: <div className="space-y-4">{renderTodoList("completed")}</div>,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between items-center">
        <TodoStats />
        <ReusableTabs
          tabs={tabs}
          defaultTabId="active"
          className="w-full"
          tabsListClassName="grid grid-cols-4 mb-4"
        />
      </div>
    </div>
  );
}
