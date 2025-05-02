// frontend/src/features/todos/todo-list.tsx
import { useState, useEffect } from "react";
import { useStore } from "@tanstack/react-store";
import dataStore, { deleteEntry, updateEntry } from "@/store/data-store";
import loadingStore from "@/store/loading-store";
import { Todo, TodoPriority, TodoStatus } from "@/store/todo-definitions.d";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Calendar, CheckCircle2, Clock } from "lucide-react";
import { formatDistanceToNow, isPast } from "date-fns";
import AddTodoButton from "./add-todo-button";
import { ConfirmDeleteDialog } from "@/components/reusable/confirm-delete-dialog";
import { ApiService } from "@/services/api";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";
import TodoStats from "./todo-stats";
import ReusableTabs from "@/components/reusable/reusable-tabs";

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

  // Sort todos by deadline (earliest first) and then by priority
  const getSortedTodos = (todos: Todo[]) => {
    return [...todos].sort((a, b) => {
      // Sort by completion status first
      if (a.isComplete !== b.isComplete) {
        return a.isComplete ? 1 : -1;
      }

      // Then by deadline
      const aDate = new Date(a.deadline);
      const bDate = new Date(b.deadline);
      const dateComparison = aDate.getTime() - bDate.getTime();
      if (dateComparison !== 0) return dateComparison;

      // Then by priority
      const priorityOrder = {
        [TodoPriority.URGENT]: 0,
        [TodoPriority.HIGH]: 1,
        [TodoPriority.MEDIUM]: 2,
        [TodoPriority.LOW]: 3,
      };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
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
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle
                  className={`text-xl ${
                    todo.isComplete ? "line-through text-muted-foreground" : ""
                  }`}
                >
                  {todo.title}
                </CardTitle>
                <div className="flex gap-2">
                  {!todo.isComplete && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCompleteTodo(todo)}
                      className="h-8 text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700"
                    >
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      Complete
                    </Button>
                  )}
                  <ConfirmDeleteDialog
                    title={`Delete "${todo.title}"?`}
                    description="This will permanently remove this todo. This action cannot be undone."
                    onConfirm={() => handleDeleteTodo(todo.id)}
                    variant="ghost"
                    size="sm"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2 items-center">
                  {getPriorityBadge(todo.priority as TodoPriority)}
                  {getDeadlineStatus(
                    todo.deadline.toISOString(),
                    todo.isComplete
                  )}

                  {todo.tags &&
                    todo.tags.length > 0 &&
                    todo.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                </div>

                {todo.description && (
                  <p className="text-sm text-muted-foreground mt-2">
                    {todo.description}
                  </p>
                )}

                <div className="pt-2 flex justify-between items-center">
                  <div className="text-sm">
                    <span className="text-muted-foreground">Deadline: </span>
                    <span className="font-medium">
                      {new Date(todo.deadline).toLocaleDateString()}
                    </span>
                    {!todo.isComplete && (
                      <span className="text-muted-foreground">
                        {" "}
                        -{" "}
                        {formatDistanceToNow(new Date(todo.deadline), {
                          addSuffix: true,
                        })}
                      </span>
                    )}
                  </div>

                  {todo.relatedMetricId &&
                    todoMetrics[todo.relatedMetricId] && (
                      <div className="flex items-center">
                        <Badge
                          variant="outline"
                          className="flex gap-1 items-center"
                        >
                          <span>Tracks: </span>
                          <Link
                            to="/metric"
                            search={{
                              query: todoMetrics[todo.relatedMetricId].name,
                            }}
                          >
                            {todoMetrics[todo.relatedMetricId].name}
                          </Link>
                        </Badge>
                      </div>
                    )}
                </div>

                {todo.failedDeadlines && todo.failedDeadlines.length > 0 && (
                  <div className="text-sm mt-2 pt-2 border-t">
                    <p className="text-muted-foreground mb-1">
                      Failed Deadlines:
                    </p>
                    <ul className="space-y-1">
                      {todo.failedDeadlines.map(
                        (failed: any, index: number) => (
                          <li key={index} className="text-muted-foreground">
                            <span className="line-through">
                              {new Date(
                                failed.originalDeadline
                              ).toLocaleDateString()}
                            </span>
                            {failed.reason && ` - ${failed.reason}`}
                          </li>
                        )
                      )}
                    </ul>
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
