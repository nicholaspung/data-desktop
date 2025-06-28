import { Todo, TodoPriority } from "@/store/todo-definitions.d";
import { isPast } from "date-fns";

export const getSortedTodos = (todos: Todo[]) => {
  return [...todos].sort((a, b) => {
    const priorityOrder = {
      [TodoPriority.URGENT]: 0,
      [TodoPriority.HIGH]: 1,
      [TodoPriority.MEDIUM]: 2,
      [TodoPriority.LOW]: 3,
    };

    const aIsOverdue =
      !a.is_complete && !!a.deadline && isPast(new Date(a.deadline));
    const bIsOverdue =
      !b.is_complete && !!b.deadline && isPast(new Date(b.deadline));

    if (aIsOverdue === bIsOverdue) {
      if (a.is_complete !== b.is_complete) {
        return a.is_complete ? 1 : -1;
      }

      if (a.is_complete && b.is_complete) {
        const aCompleted = a.completed_at
          ? new Date(a.completed_at).getTime()
          : 0;
        const bCompleted = b.completed_at
          ? new Date(b.completed_at).getTime()
          : 0;
        return bCompleted - aCompleted;
      }

      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }

    if (aIsOverdue && !bIsOverdue) return -1;
    if (!aIsOverdue && bIsOverdue) return 1;

    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
};
