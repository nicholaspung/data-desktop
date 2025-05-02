// frontend/src/features/todos/todo-stats.tsx
import { useStore } from "@tanstack/react-store";
import dataStore from "@/store/data-store";
import { Todo } from "@/store/todo-definitions";
import { isPast, isToday } from "date-fns";
import { AlertTriangle, Calendar, CheckCircle2, Clock } from "lucide-react";
import ReusableCard from "@/components/reusable/reusable-card";

export default function TodoStats() {
  const todos = useStore(dataStore, (state) => state.todos as Todo[]);

  // Calculate statistics
  const totalTodos = todos.length;
  const completedTodos = todos.filter((todo) => todo.isComplete).length;
  const overdueTodos = todos.filter(
    (todo) =>
      !todo.isComplete &&
      isPast(new Date(todo.deadline)) &&
      !isToday(new Date(todo.deadline))
  ).length;
  const dueTodayTodos = todos.filter(
    (todo) => !todo.isComplete && isToday(new Date(todo.deadline))
  ).length;

  const completionRate =
    totalTodos > 0 ? Math.round((completedTodos / totalTodos) * 100) : 0;

  const totalContent = (
    <div className="flex justify-between items-center">
      <div>
        <p className="text-sm text-muted-foreground">Total Todos</p>
        <p className="text-2xl font-bold">{totalTodos}</p>
      </div>
      <Calendar className="h-5 w-5 text-primary" />
    </div>
  );

  const completedContent = (
    <div className="flex justify-between items-center">
      <div>
        <p className="text-sm text-muted-foreground">Completed</p>
        <div className="flex items-center gap-2">
          <p className="text-2xl font-bold">{completedTodos}</p>
          <span className="text-sm text-muted-foreground">
            ({completionRate}%)
          </span>
        </div>
      </div>
      <CheckCircle2 className="h-5 w-5 text-green-500" />
    </div>
  );

  const dueTodayContent = (
    <div className="flex justify-between items-center">
      <div>
        <p className="text-sm text-muted-foreground">Due Today</p>
        <p className="text-2xl font-bold">{dueTodayTodos}</p>
      </div>
      <Clock className="h-5 w-5 text-amber-500" />
    </div>
  );

  const overdueContent = (
    <div className="flex justify-between items-center">
      <div>
        <p className="text-sm text-muted-foreground">Overdue</p>
        <p className="text-2xl font-bold">{overdueTodos}</p>
      </div>
      <AlertTriangle className="h-5 w-5 text-red-500" />
    </div>
  );

  return (
    <div className="w-full grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <ReusableCard
        showHeader={false}
        content={totalContent}
        contentClassName="pt-6"
      />

      <ReusableCard
        showHeader={false}
        content={completedContent}
        contentClassName="pt-6"
      />

      <ReusableCard
        showHeader={false}
        content={dueTodayContent}
        contentClassName="pt-6"
      />

      <ReusableCard
        showHeader={false}
        content={overdueContent}
        contentClassName="pt-6"
      />
    </div>
  );
}
