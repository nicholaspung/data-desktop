import { Todo, TodoPriority } from "@/store/todo-definitions.d";
import { isPast } from "date-fns";

// Sort todos by the new priority rules
export const getSortedTodos = (todos: Todo[]) => {
  return [...todos].sort((a, b) => {
    // Priority order mapping
    const priorityOrder = {
      [TodoPriority.URGENT]: 0,
      [TodoPriority.HIGH]: 1,
      [TodoPriority.MEDIUM]: 2,
      [TodoPriority.LOW]: 3,
    };

    // Check if todos are overdue
    const aIsOverdue = !a.isComplete && isPast(new Date(a.deadline));
    const bIsOverdue = !b.isComplete && isPast(new Date(b.deadline));

    // If both are overdue or both are not overdue, sort by completion status
    if (aIsOverdue === bIsOverdue) {
      // If one is complete and the other isn't
      if (a.isComplete !== b.isComplete) {
        // Completed todos go last
        return a.isComplete ? 1 : -1;
      }

      // If both are completed, sort by completion date (most recent first)
      if (a.isComplete && b.isComplete) {
        const aCompleted = a.completedAt
          ? new Date(a.completedAt).getTime()
          : 0;
        const bCompleted = b.completedAt
          ? new Date(b.completedAt).getTime()
          : 0;
        return bCompleted - aCompleted;
      }

      // For active todos (not overdue, not completed), sort by priority only
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }

    // One is overdue and the other isn't - overdue comes first
    if (aIsOverdue && !bIsOverdue) return -1;
    if (!aIsOverdue && bIsOverdue) return 1;

    // Both are overdue - sort by priority
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
};
