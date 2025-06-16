import { useState, useEffect } from "react";
import { useStore } from "@tanstack/react-store";
import dataStore from "@/store/data-store";
import loadingStore from "@/store/loading-store";
import { Todo } from "@/store/todo-definitions.d";
import { Card, CardContent } from "@/components/ui/card";
import { isPast } from "date-fns";
import AddTodoButton from "./add-todo-button";
import { ApiService } from "@/services/api";
import TodoStats from "./todo-stats";
import ReusableTabs from "@/components/reusable/reusable-tabs";
import { getSortedTodos } from "./todo-utils";
import TodoListItem from "./todo-list-item";
interface TodoListProps {
  showPrivate: boolean;
}

export default function TodoList({ showPrivate }: TodoListProps) {
  const todos = useStore(dataStore, (state) => state.todos as Todo[]);
  const isLoading = useStore(loadingStore, (state) => state.todos);
  const [todoMetrics, setTodoMetrics] = useState<Record<string, any>>({});

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

  const visibleTodos = todos.filter(
    (todo) => !todo.private || showPrivate
  );

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
          (t) => !t.isComplete && isPast(new Date(t.deadline))
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
