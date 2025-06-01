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

    const aIsOverdue = !a.isComplete && isPast(new Date(a.deadline));
    const bIsOverdue = !b.isComplete && isPast(new Date(b.deadline));

    if (aIsOverdue === bIsOverdue) {
      if (a.isComplete !== b.isComplete) {
        return a.isComplete ? 1 : -1;
      }

      if (a.isComplete && b.isComplete) {
        const aCompleted = a.completedAt
          ? new Date(a.completedAt).getTime()
          : 0;
        const bCompleted = b.completedAt
          ? new Date(b.completedAt).getTime()
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
