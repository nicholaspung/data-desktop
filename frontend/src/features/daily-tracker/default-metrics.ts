// src/features/journaling/default-metrics.ts
import { ApiService } from "@/services/api";
import { addEntry } from "@/store/data-store";
import { Metric } from "@/store/experiment-definitions";
import { toast } from "sonner";

// Define the default journaling metrics
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
  },
  {
    name: "Gratitude Journal Entries",
    description: "Number of gratitude entries recorded today",
    type: "number", // Numeric metric
    unit: "entries",
    default_value: "0",
    category_id: "journaling", // You'll need to ensure this category exists
    active: true,
    private: false,
    schedule_frequency: "daily",
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
  },
];

// Helper function to get or create the journaling category
export async function getOrCreateJournalingCategory(): Promise<string | null> {
  try {
    const categories = await ApiService.getRecords("metric_categories");

    // Check if journaling category exists
    const journalingCategory = categories.find(
      (c) => c.name?.toLowerCase() === "journaling"
    );

    if (journalingCategory) {
      return journalingCategory.id;
    }

    // Create the category if it doesn't exist
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

// Function to create default metrics
export async function createDefaultMetrics(): Promise<boolean> {
  try {
    // Get or create the journaling category
    const journalingCategoryId = await getOrCreateJournalingCategory();
    if (!journalingCategoryId) {
      throw new Error("Failed to create journaling category");
    }

    // Create each default metric
    for (const defaultMetric of defaultJournalingMetrics) {
      const response = await ApiService.addRecord("metrics", {
        ...defaultMetric,
        category_id: journalingCategoryId,
      });
      if (response) {
        addEntry(response, "metrics");
      }
    }

    toast.success("Created default journaling metrics");
    return true;
  } catch (error) {
    console.error("Error creating default journaling metrics:", error);
    toast.error("Failed to create default journaling metrics");
    return false;
  }
}

// Function to check if default metrics already exist
export async function checkDefaultMetricsExist(): Promise<boolean> {
  try {
    // Get all existing metrics
    const metrics = await ApiService.getRecordsWithRelations<Metric>("metrics");

    // Check if all default metrics exist
    const defaultMetricNames = defaultJournalingMetrics.map((m) =>
      m.name?.toLowerCase()
    );

    // Count how many default metrics already exist
    const existingCount = metrics.filter(
      (m) => m.name && defaultMetricNames.includes(m.name.toLowerCase())
    ).length;

    // Return true if all default metrics exist
    return existingCount === defaultJournalingMetrics.length;
  } catch (error) {
    console.error("Error checking default metrics:", error);
    return false;
  }
}
