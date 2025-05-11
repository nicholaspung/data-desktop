// frontend/src/features/todos/todo-dashboard-summary.tsx
import { useEffect, useState } from "react";
import { useStore } from "@tanstack/react-store";
import dataStore from "@/store/data-store";
import { Todo } from "@/store/todo-definitions";
import { FEATURE_ICONS } from "@/lib/icons";
import ReusableSummary from "@/components/reusable/reusable-summary";
import { isPast, isToday, differenceInDays } from "date-fns";
import { getSortedTodos } from "./todo-utils";
import TodoListItem from "./todo-list-item";

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
    const upcoming = sortedTodos.filter((todo) => {
      if (todo.isComplete || isToday(new Date(todo.deadline))) return false;
      const daysUntil = differenceInDays(new Date(todo.deadline), new Date());
      return daysUntil > 0 && daysUntil <= 7;
    });
    setUpcomingTodos(upcoming);

    // Filter overdue todos
    const overdue = sortedTodos.filter(
      (todo) =>
        !todo.isComplete &&
        isPast(new Date(todo.deadline)) &&
        !isToday(new Date(todo.deadline))
    );
    setOverdueTodos(overdue);
  }, [todos]);

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
      customContent={
        <div className="space-y-3">
          <h3 className="font-medium">Upcoming Deadlines</h3>
          <div className="space-y-2">
            {overdueTodos.length > 0 &&
              overdueTodos.map((todo) => (
                <TodoListItem key={todo.id} todo={todo} isCompact />
              ))}
            {todayTodos.length > 0 &&
              todayTodos.map((todo) => (
                <TodoListItem key={todo.id} todo={todo} isCompact />
              ))}
            {!overdueTodos.length &&
              !todayTodos.length &&
              upcomingTodos.length && (
                <span>
                  {upcomingTodos.length} upcoming{" "}
                  {upcomingTodos.length === 1 ? "todo" : "todos"}
                </span>
              )}
            {!overdueTodos.length &&
              !todayTodos.length &&
              !upcomingTodos.length && <span>All caught up!</span>}
          </div>
        </div>
      }
    />
  );
}
