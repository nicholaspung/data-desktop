// frontend/src/features/todos/todo-deadline-check.tsx
import { useEffect } from "react";
import { useStore } from "@tanstack/react-store";
import dataStore, { updateEntry } from "@/store/data-store";
import { ApiService } from "@/services/api";
import { Todo, TodoStatus } from "@/store/todo-definitions.d";
import { isPast } from "date-fns";

export default function TodoDeadlineCheck() {
  const todos = useStore(dataStore, (state) => state.todos as Todo[]);

  useEffect(() => {
    if (!todos || todos.length === 0) return;

    // Check for todos that have passed their deadline but aren't marked as overdue
    const todosToUpdate = todos.filter(
      (todo) =>
        !todo.isComplete &&
        todo.status !== TodoStatus.OVERDUE &&
        isPast(new Date(todo.deadline)) &&
        new Date(todo.deadline).getTime() !== new Date().setHours(0, 0, 0, 0) // Not today
    );

    // Update each todo to overdue status
    todosToUpdate.forEach(async (todo) => {
      const updatedTodo = {
        ...todo,
        status: TodoStatus.OVERDUE,
      };

      try {
        const response = await ApiService.updateRecord(todo.id, updatedTodo);
        if (response) {
          updateEntry(todo.id, response, "todos");
        }
      } catch (error) {
        console.error(`Failed to update status for todo ${todo.id}:`, error);
      }
    });
  }, [todos]);

  return null; // Background component, no UI
}
