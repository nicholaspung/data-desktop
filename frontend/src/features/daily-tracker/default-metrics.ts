import { ApiService } from "@/services/api";
import { addEntry } from "@/store/data-store";
import { Metric } from "@/store/experiment-definitions";
import { toast } from "sonner";

export const defaultJournalingMetrics: Partial<Metric>[] = [
  {
    name: "Completed Daily Question",
    description: "Logged a daily question in your question journal",
    type: "boolean",
    unit: "",
    default_value: "false",
    active: true,
    private: false,
    schedule_frequency: "daily",
    schedule_days: [0, 1, 2, 3, 4, 5, 6],
    goal_type: "boolean",
    goal_value: "true",
  },
  {
    name: "Gratitude Journal Entries",
    description: "Number of gratitude entries recorded today",
    type: "number",
    unit: "entries",
    default_value: "0",
    active: true,
    private: false,
    schedule_frequency: "daily",
    schedule_days: [0, 1, 2, 3, 4, 5, 6],
    goal_type: "minimum",
    goal_value: "3",
  },
  {
    name: "Completed Creativity Journal",
    description: "Logged a daily entry in your creativity journal",
    type: "boolean",
    unit: "",
    default_value: "false",
    active: true,
    private: false,
    schedule_frequency: "daily",
    schedule_days: [0, 1, 2, 3, 4, 5, 6],
    goal_type: "boolean",
    goal_value: "true",
  },
  {
    name: "Completed Daily Affirmation",
    description: "Logged your daily affirmation",
    type: "boolean",
    unit: "",
    default_value: "false",
    active: true,
    private: false,
    schedule_frequency: "daily",
    schedule_days: [0, 1, 2, 3, 4, 5, 6],
    goal_type: "boolean",
    goal_value: "true",
  },
];

export async function getOrCreateJournalingCategory(): Promise<string | null> {
  try {
    const categories = await ApiService.getRecords("metric_categories");

    const journalingCategory = categories.find(
      (c) => c.name?.toLowerCase() === "journaling"
    );

    if (journalingCategory) {
      return journalingCategory.id;
    }

    const newCategory = await ApiService.addRecord("metric_categories", {
      name: "Journaling",
    });
    if (newCategory) {
      addEntry(newCategory, "metric_categories");
    }

    return newCategory?.id || null;
  } catch (error) {
    console.error("Error getting or creating journaling category:", error);
    return null;
  }
}

export async function createDefaultMetrics(
  metrics: Metric[]
): Promise<boolean> {
  try {
    const journalingCategoryId = await getOrCreateJournalingCategory();
    if (!journalingCategoryId) {
      throw new Error("Failed to create journaling category");
    }

    let createdCount = 0;

    for (const defaultMetric of defaultJournalingMetrics) {
      const metricExists = metrics.some(
        (m: Metric) =>
          m.name?.toLowerCase() === defaultMetric.name?.toLowerCase()
      );

      if (metricExists) {
        continue;
      }

      const newMetric = {
        ...defaultMetric,
        category_id: journalingCategoryId,
        schedule_start_date: new Date(),
      };

      const result = await ApiService.addRecord("metrics", newMetric);

      if (result) {
        addEntry(result, "metrics");
        createdCount++;
      }
    }

    if (createdCount > 0) {
      toast.success(`Created ${createdCount} journaling metrics`);
    } else {
      toast.info("All journaling metrics already exist");
    }
    return true;
  } catch (error) {
    console.error("Error creating default journaling metrics:", error);
    toast.error("Failed to create default journaling metrics");
    return false;
  }
}

export async function checkDefaultMetricsExist(): Promise<boolean> {
  try {
    const metrics = await ApiService.getRecordsWithRelations<Metric>("metrics");

    const defaultMetricNames = defaultJournalingMetrics.map((m) =>
      m.name?.toLowerCase()
    );

    const existingCount = metrics.filter(
      (m) => m.name && defaultMetricNames.includes(m.name.toLowerCase())
    ).length;

    return existingCount === defaultJournalingMetrics.length;
  } catch (error) {
    console.error("Error checking default metrics:", error);
    return false;
  }
}
