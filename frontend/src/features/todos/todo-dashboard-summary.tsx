// frontend/src/features/dashboard/todo-dashboard-summary.tsx
import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useStore } from "@tanstack/react-store";
import dataStore from "@/store/data-store";
import { Todo } from "@/store/todo-definitions";
import { FEATURE_ICONS } from "@/lib/icons";
import ReusableSummary from "@/components/reusable/reusable-summary";
import { isPast, isToday, differenceInDays } from "date-fns";
import { getSortedTodos } from "./todo-utils";

export default function TodoDashboardSummary() {
  const todos = useStore(dataStore, (state) => state.todos as Todo[]);
  const [todayTodos, setTodayTodos] = useState<Todo[]>([]);
  const [upcomingTodos, setUpcomingTodos] = useState<Todo[]>([]);
  const [overdueTodos, setOverdueTodos] = useState<Todo[]>([]);

  useEffect(() => {
    if (!todos || todos.length === 0) {
      setTodayTodos([]);
      setUpcomingTodos([]);
      setOverdueTodos([]);
      return;
    }

    const sortedTodos = getSortedTodos(todos);

    // Filter todos due today
    const today = sortedTodos.filter(
      (todo) => !todo.isComplete && isToday(new Date(todo.deadline))
    );
    setTodayTodos(today);

    // Filter upcoming todos (next 7 days, excluding today)
    const upcoming = todos.filter((todo) => {
      if (todo.isComplete || isToday(new Date(todo.deadline))) return false;
      const daysUntil = differenceInDays(new Date(todo.deadline), new Date());
      return daysUntil > 0 && daysUntil <= 7;
    });
    setUpcomingTodos(upcoming);

    // Filter overdue todos
    const overdue = todos.filter(
      (todo) =>
        !todo.isComplete &&
        isPast(new Date(todo.deadline)) &&
        !isToday(new Date(todo.deadline))
    );
    setOverdueTodos(overdue);
  }, [todos]);

  const getTodoStatusText = () => {
    if (overdueTodos.length > 0) {
      return {
        text: `${overdueTodos.length} overdue ${overdueTodos.length === 1 ? "todo" : "todos"}`,
        variant: "destructive" as const,
      };
    }

    if (todayTodos.length > 0) {
      return {
        text: `${todayTodos.length} ${todayTodos.length === 1 ? "todo" : "todos"} due today`,
        variant: "warning" as const,
      };
    }

    if (upcomingTodos.length === 0 && todos.length > 0) {
      return {
        text: "All caught up!",
        variant: "success" as const,
      };
    }

    return {
      text: `${upcomingTodos.length} upcoming ${upcomingTodos.length === 1 ? "todo" : "todos"}`,
      variant: "default" as const,
    };
  };

  // Combine and sort todos for display
  const displayTodos = [...todayTodos, ...overdueTodos, ...upcomingTodos]
    .sort(
      (a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
    )
    .slice(0, 3); // Only show top 3

  const status = getTodoStatusText();

  return (
    <ReusableSummary
      title="Todos & Deadlines"
      titleIcon={<FEATURE_ICONS.TODOS className="h-5 w-5" />}
      linkText="View All"
      linkTo="/todos"
      loading={false}
      emptyState={
        todos.length === 0
          ? {
              message: "No todos found. Start by creating your first todo.",
              actionText: "Create Todo",
              actionTo: "/todos",
            }
          : undefined
      }
      mainSection={
        todos.length > 0
          ? {
              title: "Todo Status",
              value: `${todos.filter((t) => !t.isComplete).length} active todos`,
              badge: {
                variant: status.variant,
                children: status.text,
              },
            }
          : undefined
      }
      customContent={
        displayTodos.length > 0 ? (
          <div className="space-y-3">
            <h3 className="font-medium">Upcoming Deadlines</h3>
            {displayTodos.map((todo) => {
              const isOverdue =
                isPast(new Date(todo.deadline)) &&
                !isToday(new Date(todo.deadline));
              const isDueToday = isToday(new Date(todo.deadline));

              return (
                <div
                  key={todo.id}
                  className={`p-2 rounded-md ${
                    isOverdue
                      ? "bg-red-50 border border-red-100"
                      : isDueToday
                        ? "bg-amber-50 border border-amber-100"
                        : "bg-blue-50 border border-blue-100"
                  }`}
                >
                  <div className="flex justify-between">
                    <h4 className="font-medium text-sm">{todo.title}</h4>
                    <span
                      className={`text-xs ${
                        isOverdue
                          ? "text-red-600"
                          : isDueToday
                            ? "text-amber-600"
                            : "text-blue-600"
                      }`}
                    >
                      {isOverdue
                        ? "Overdue"
                        : isDueToday
                          ? "Today"
                          : `${differenceInDays(new Date(todo.deadline), new Date())} days`}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Deadline: {new Date(todo.deadline).toLocaleDateString()}
                  </div>
                </div>
              );
            })}

            {todayTodos.length + overdueTodos.length + upcomingTodos.length >
              3 && (
              <div className="text-center mt-2">
                <Link
                  to="/todos"
                  className="text-xs text-primary hover:underline"
                >
                  View all (
                  {todayTodos.length +
                    overdueTodos.length +
                    upcomingTodos.length}{" "}
                  todos)
                </Link>
              </div>
            )}
          </div>
        ) : undefined
      }
    />
  );
}
