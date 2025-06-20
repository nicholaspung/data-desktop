import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Todo, TodoPriority, TodoStatus } from "@/store/todo-definitions.d";
import { Link } from "@tanstack/react-router";
import { formatDistanceToNow, isPast } from "date-fns";
import { AlertCircle, Calendar, CheckCircle2, Clock } from "lucide-react";
import AddTodoButton from "./add-todo-button";
import { ApiService } from "@/services/api";
import { ConfirmDeleteDialog } from "@/components/reusable/confirm-delete-dialog";
import { deleteEntry, updateEntry } from "@/store/data-store";
import { toast } from "sonner";
import ReusableCard from "@/components/reusable/reusable-card";
import { ProtectedField } from "@/components/security/protected-content";

export default function TodoListItem({
  todo,
  todoMetrics,
  setTodoMetrics,
  isCompact,
}: {
  todo: Todo;
  todoMetrics?: Record<string, any>;
  setTodoMetrics?: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  isCompact?: boolean;
}) {
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

        if (
          todoMetrics &&
          todo.relatedMetricId &&
          todoMetrics[todo.relatedMetricId]
        ) {
          const metric = todoMetrics[todo.relatedMetricId];

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

  const getDeadlineStatus = (deadline: string | undefined, isComplete: boolean) => {
    if (isComplete || !deadline) return null;

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

  const renderTags = () => (
    <>
      {todo.tags &&
        todo.tags.length > 0 &&
        todo.tags
          .split(", ")
          .slice(0, 2)
          .map((tag, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}

      {todo.tags && todo.tags.split(", ").length > 2 && (
        <Badge variant="secondary" className="text-xs">
          +{todo.tags.split(", ").length - 2}
        </Badge>
      )}

      {todoMetrics &&
        todo.relatedMetricId &&
        todoMetrics[todo.relatedMetricId] && (
          <Badge variant="outline" className="flex gap-1 items-center text-xs">
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
    </>
  );

  return (
    <ReusableCard
      showHeader={false}
      cardClassName={`border-l-4 ${
        todo.isComplete
          ? "border-l-green-500"
          : todo.deadline && isPast(new Date(todo.deadline))
            ? "border-l-red-500"
            : "border-l-blue-500"
      }`}
      contentClassName="py-3 px-4"
      content={
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            {/* Left section - Title and info */}
            <div className="flex-1 min-w-0 space-y-2">
              {todo.private ? (
                <ProtectedField>
                  <h3
                    className={`font-medium break-words ${
                      todo.isComplete ? "line-through text-muted-foreground" : ""
                    }`}
                  >
                    {todo.title}
                  </h3>
                </ProtectedField>
              ) : (
                <h3
                  className={`font-medium break-words ${
                    todo.isComplete ? "line-through text-muted-foreground" : ""
                  }`}
                >
                  {todo.title}
                </h3>
              )}
              <div className="flex flex-wrap gap-2 items-center">
                {getPriorityBadge(todo.priority as TodoPriority)}
                {getDeadlineStatus(
                  todo.deadline?.toISOString(),
                  todo.isComplete
                )}

                {todo.private ? (
                  <ProtectedField>{renderTags()}</ProtectedField>
                ) : (
                  renderTags()
                )}
              </div>
              {!isCompact && todo.description && (
                todo.private ? (
                  <ProtectedField>
                    <p className="text-sm text-muted-foreground break-words">
                      {todo.description}
                    </p>
                  </ProtectedField>
                ) : (
                  <p className="text-sm text-muted-foreground break-words">
                    {todo.description}
                  </p>
                )
              )}
            </div>

            {/* Right section - Actions */}
            {!isCompact && (
              <div className="flex gap-1 sm:ml-4 self-start sm:self-center flex-shrink-0">
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
                        const loadMetrics = async () => {
                          const metrics =
                            await ApiService.getRecordsWithRelations<any>(
                              "metrics"
                            );
                          const metricMap: Record<string, any> = {};
                          metrics.forEach((metric) => {
                            metricMap[metric.id] = metric;
                          });
                          if (setTodoMetrics) {
                            setTodoMetrics(metricMap);
                          }
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
            )}
          </div>

          {/* Footer info */}
          <div className="mt-2 pt-2 border-t text-xs text-muted-foreground flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
            <div className="break-words">
              {todo.deadline ? (
                <>
                  Deadline: {new Date(todo.deadline).toLocaleDateString()}
                  {!todo.isComplete && (
                    <span>
                      {" "}
                      -{" "}
                      <strong>
                        {formatDistanceToNow(new Date(todo.deadline), {
                          addSuffix: true,
                        })}
                      </strong>
                    </span>
                  )}
                </>
              ) : (
                <span className="text-muted-foreground">Needs deadline</span>
              )}
            </div>

            {todo.failedDeadlines && todo.failedDeadlines.length > 0 && (
              <div className="flex-shrink-0">
                {todo.failedDeadlines.length} failed deadline
                {todo.failedDeadlines.length > 1 ? "s" : ""}
              </div>
            )}
          </div>
        </div>
      }
    />
  );
}
