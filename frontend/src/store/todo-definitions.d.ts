// frontend/src/store/todo-definitions.d.ts
export interface Todo {
  id: string;
  title: string;
  description?: string;
  deadline: Date;
  createdAt: Date;
  lastModified: Date;
  status: TodoStatus;
  priority: TodoPriority;
  tags?: string;
  relatedMetricId?: string;
  metricType?: "completion" | "time";
  failedDeadlines?: FailedDeadline[];
  reminderDate?: Date;
  isComplete: boolean;
  completedAt?: Date;
  private?: boolean;
}

export interface FailedDeadline {
  originalDeadline: Date;
  failedAt: Date;
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
  "id" | "createdAt" | "lastModified" | "status" | "isComplete" | "completedAt"
>;
