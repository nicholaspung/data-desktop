import { useState, useEffect } from "react";
import { useStore } from "@tanstack/react-store";
import dataStore from "@/store/data-store";
import loadingStore from "@/store/loading-store";
import { Todo, TodoPriority } from "@/store/todo-definitions.d";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { isPast } from "date-fns";
import AddTodoButton from "./add-todo-button";
import { ApiService } from "@/services/api";
import TodoStats from "./todo-stats";
import ReusableTabs from "@/components/reusable/reusable-tabs";
import ReusableSelect from "@/components/reusable/reusable-select";
import { getSortedTodos } from "./todo-utils";
import TodoListItem from "./todo-list-item";
interface TodoListProps {
  showPrivate: boolean;
}

export default function TodoList({ showPrivate }: TodoListProps) {
  const todos = useStore(dataStore, (state) => state.todos as Todo[]);
  const isLoading = useStore(loadingStore, (state) => state.todos);
  const [todoMetrics, setTodoMetrics] = useState<Record<string, any>>({});
  const [searchText, setSearchText] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [hasMetricFilter, setHasMetricFilter] = useState(false);
  const [hasDeadlineFilter, setHasDeadlineFilter] = useState("all");

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

  const getFilteredTodos = (tabId: string) => {
    return todos.filter((todo) => {
      if (todo.private && !showPrivate) return false;

      if (searchText) {
        const searchLower = searchText.toLowerCase();
        const matchesSearch =
          todo.title.toLowerCase().includes(searchLower) ||
          todo.description?.toLowerCase().includes(searchLower) ||
          todo.tags?.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      if (
        priorityFilter &&
        priorityFilter !== "all" &&
        priorityFilter !== todo.priority
      ) {
        return false;
      }

      if (hasMetricFilter && !todo.relatedMetricId) {
        return false;
      }

      if (hasDeadlineFilter === "with-deadline" && !todo.deadline) {
        return false;
      }
      if (hasDeadlineFilter === "no-deadline" && todo.deadline) {
        return false;
      }

      switch (tabId) {
        case "active":
          return !todo.isComplete;
        case "overdue":
          return (
            !todo.isComplete && todo.deadline && isPast(new Date(todo.deadline))
          );
        case "completed":
          return todo.isComplete;
        default:
          return true;
      }
    });
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

    if (tabId === "active") {
      const todosWithDeadlines = sortedTodos.filter((todo) => todo.deadline);
      const todosWithoutDeadlines = sortedTodos.filter(
        (todo) => !todo.deadline
      );

      return (
        <>
          {todosWithDeadlines.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">
                With Deadlines
              </h3>
              {todosWithDeadlines.map((todo) => (
                <TodoListItem
                  key={todo.id}
                  todo={todo}
                  todoMetrics={todoMetrics}
                  setTodoMetrics={setTodoMetrics}
                />
              ))}
            </div>
          )}

          {todosWithoutDeadlines.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">
                Needs Deadline
              </h3>
              {todosWithoutDeadlines.map((todo) => (
                <TodoListItem
                  key={todo.id}
                  todo={todo}
                  todoMetrics={todoMetrics}
                  setTodoMetrics={setTodoMetrics}
                />
              ))}
            </div>
          )}
        </>
      );
    }

    return (
      <>
        {sortedTodos.map((todo) => (
          <TodoListItem
            key={todo.id}
            todo={todo}
            todoMetrics={todoMetrics}
            setTodoMetrics={setTodoMetrics}
          />
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

  const visibleTodos = todos.filter((todo) => !todo.private || showPrivate);

  const priorityOptions = [
    { id: "all", label: "All Priorities" },
    { id: TodoPriority.LOW, label: "Low" },
    { id: TodoPriority.MEDIUM, label: "Medium" },
    { id: TodoPriority.HIGH, label: "High" },
    { id: TodoPriority.URGENT, label: "Urgent" },
  ];

  const deadlineOptions = [
    { id: "all", label: "All Todos" },
    { id: "with-deadline", label: "With Deadline" },
    { id: "no-deadline", label: "Needs Deadline" },
  ];

  const tabs = [
    {
      id: "all",
      label: `All (${visibleTodos.length})`,
      content: <div className="space-y-4">{renderTodoList("all")}</div>,
    },
    {
      id: "active",
      label: `Active (${visibleTodos.filter((t) => !t.isComplete).length})`,
      content: <div className="space-y-4">{renderTodoList("active")}</div>,
    },
    {
      id: "overdue",
      label: `Overdue (${
        visibleTodos.filter(
          (t) => !t.isComplete && t.deadline && isPast(new Date(t.deadline))
        ).length
      })`,
      content: <div className="space-y-4">{renderTodoList("overdue")}</div>,
    },
    {
      id: "completed",
      label: `Completed (${visibleTodos.filter((t) => t.isComplete).length})`,
      content: <div className="space-y-4">{renderTodoList("completed")}</div>,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between items-center">
        <div className="flex justify-between items-center w-full mb-4">
          <TodoStats />
        </div>

        {/* Filter Controls */}
        <div className="w-full mb-4 p-4 border rounded-lg bg-card">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Search todos..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <ReusableSelect
                options={priorityOptions}
                value={priorityFilter}
                onChange={setPriorityFilter}
                placeholder="All Priorities"
                title="priority"
                noDefault={false}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="deadline-filter">Deadline</Label>
              <ReusableSelect
                options={deadlineOptions}
                value={hasDeadlineFilter}
                onChange={setHasDeadlineFilter}
                placeholder="All Todos"
                title="deadline filter"
                noDefault={false}
              />
            </div>

            <div className="space-y-2">
              <Label>Other Filters</Label>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="has-metric"
                  checked={hasMetricFilter}
                  onCheckedChange={(checked) => setHasMetricFilter(!!checked)}
                />
                <Label htmlFor="has-metric" className="text-sm">
                  Has metric only
                </Label>
              </div>
            </div>
          </div>
        </div>

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
