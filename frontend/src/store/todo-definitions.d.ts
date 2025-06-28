// frontend/src/store/todo-definitions.d.ts
export interface Todo {
  id: string;
  title: string;
  description?: string;
  deadline?: string;
  created_at: string;
  last_modified: string;
  status: TodoStatus;
  priority: TodoPriority;
  tags?: string;
  related_metric_id?: string;
  metric_type?: "completion" | "time";
  failed_deadlines?: FailedDeadline[];
  reminder_date?: string;
  is_complete: boolean;
  completed_at?: string;
  private?: boolean;
}

export interface FailedDeadline {
  originalDeadline: string;
  failedAt: string;
  reason?: string;
}

export enum TodoStatus {
  NOT_STARTED = "not_started",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  OVERDUE = "overdue",
}

export enum TodoPriority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  URGENT = "urgent",
}

export type PartialTodo = Partial<Todo>;
export type TodoInput = Omit<
  Todo,
  "id" | "created_at" | "last_modified" | "status" | "is_complete" | "completed_at"
>;
