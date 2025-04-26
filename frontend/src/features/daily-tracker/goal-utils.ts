// frontend/src/features/daily-tracker/goal-utils.ts
import { MetricWithLog } from "@/store/experiment-definitions";

/**
 * Calculate the progress of a metric value against its goal
 */
export function calculateGoalProgress(metric: MetricWithLog): {
  progress: number;
  text: string;
  isComplete: boolean;
} | null {
  if (!metric.goal_value || !metric.goal_type) return null;

  // Handle different types of goals
  switch (metric.goal_type) {
    case "minimum":
      if (
        metric.type === "number" ||
        metric.type === "percentage" ||
        metric.type === "time"
      ) {
        const current = parseFloat(metric.value) || 0;
        const goal = parseFloat(metric.goal_value) || 0;
        const progress = Math.min(100, (current / goal) * 100);
        return {
          progress,
          text: `${current}/${goal} (min)`,
          isComplete: current >= goal,
        };
      }
      break;
    case "maximum":
      if (
        metric.type === "number" ||
        metric.type === "percentage" ||
        metric.type === "time"
      ) {
        const current = parseFloat(metric.value) || 0;
        const goal = parseFloat(metric.goal_value) || 0;
        // For maximum, lower is better
        const progress =
          goal === 0 ? 0 : Math.max(0, 100 - (current / goal) * 100);
        return {
          progress,
          text: `${current}/${goal} (max)`,
          isComplete: current <= goal,
        };
      }
      break;
    case "exact":
      if (
        metric.type === "number" ||
        metric.type === "percentage" ||
        metric.type === "time"
      ) {
        const current = parseFloat(metric.value) || 0;
        const goal = parseFloat(metric.goal_value) || 0;
        // For exact goals, calculate how close we are
        const diff = Math.abs(current - goal);
        const tolerance = goal * 0.05; // 5% tolerance
        const progress = Math.max(0, 100 - (diff / tolerance) * 100);
        return {
          progress: Math.min(progress, 100),
          text: `${current}/${goal} (exact)`,
          isComplete: diff <= tolerance,
        };
      }
      break;
    case "boolean":
      if (metric.type === "boolean") {
        const isComplete = !!metric.value;
        return {
          progress: isComplete ? 100 : 0,
          text: isComplete ? "Completed" : "Not completed",
          isComplete,
        };
      }
      break;
  }

  return null;
}

/**
 * Get a list of metrics with goals from the given array
 */
export function getMetricsWithGoals(metrics: MetricWithLog[]): MetricWithLog[] {
  return metrics.filter(
    (metric) =>
      metric.goal_value !== undefined && metric.goal_type !== undefined
  );
}

/**
 * Get a count of completed goals
 */
export function getCompletedGoalsCount(metrics: MetricWithLog[]): number {
  return metrics
    .filter(
      (metric) =>
        metric.goal_value !== undefined && metric.goal_type !== undefined
    )
    .map((metric) => calculateGoalProgress(metric))
    .filter((progress) => progress?.isComplete).length;
}
