// frontend/src/features/todos/todo-reminders.tsx
import { useEffect } from "react";
import { useStore } from "@tanstack/react-store";
import dataStore from "@/store/data-store";
import { Todo } from "@/store/todo-definitions";
import { toast } from "sonner";
import { isPast, isToday } from "date-fns";
import { AlertTriangle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "@tanstack/react-router";

export default function TodoReminders() {
  const todos = useStore(dataStore, (state) => state.todos as Todo[]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!todos || todos.length === 0) return;

    // Check for overdue todos
    const overdue = todos.filter(
      (todo) =>
        !todo.isComplete &&
        isPast(new Date(todo.deadline)) &&
        new Date(todo.deadline).getTime() !== new Date().setHours(0, 0, 0, 0)
    );

    // Check for todos with today's reminder date
    const reminders = todos.filter(
      (todo) =>
        !todo.isComplete &&
        todo.reminderDate &&
        isToday(new Date(todo.reminderDate))
    );

    // Show toast notifications if there are overdue or reminder todos
    if (overdue.length > 0) {
      toast.warning(
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          <span>
            {overdue.length} overdue {overdue.length === 1 ? "todo" : "todos"}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="ml-2"
            onClick={() => {
              navigate({ to: "/todos", search: { tab: "overdue" } });
              toast.dismiss();
            }}
          >
            View
          </Button>
        </div>,
        { duration: 10000, id: "overdue-todos" }
      );
    }

    if (reminders.length > 0) {
      toast.info(
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          <span>
            Reminder: {reminders.length}{" "}
            {reminders.length === 1 ? "todo" : "todos"} scheduled for today
          </span>
          <Button
            variant="outline"
            size="sm"
            className="ml-2"
            onClick={() => {
              navigate({ to: "/todos" });
              toast.dismiss();
            }}
          >
            View
          </Button>
        </div>,
        { duration: 10000, id: "todo-reminders" }
      );
    }
  }, [todos, navigate]);

  return null; // This is just a background component, no UI needed
}
