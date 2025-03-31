// src/components/charts/chart-utils.ts
import { format } from "date-fns";

// Default chart colors
export const CHART_COLORS = [
  "#8884d8", // Purple
  "#82ca9d", // Green
  "#ffc658", // Yellow
  "#ff8042", // Orange
  "#0088FE", // Blue
  "#00C49F", // Teal
  "#FFBB28", // Gold
  "#FF8042", // Coral
  "#a4de6c", // Light Green
  "#d0ed57", // Lime
  "#83a6ed", // Light Blue
  "#8dd1e1", // Sky Blue
  "#FF6B6B", // Red
  "#6A6CFF", // Indigo
  "#A06AFF", // Purple
];

// Format date objects consistently for charts
export const formatChartDate = (date: Date | string): string => {
  if (!date) return "";

  const dateObj = typeof date === "string" ? new Date(date) : date;
  return format(dateObj, "MMM d, yyyy");
};

// Pre-process data to ensure dates are formatted consistently
export const preprocessChartData = <T extends Record<string, any>>(
  data: T[],
  dateKey: string = "date",
  formatFn: (date: Date | string) => string = formatChartDate
): Array<T & { [key: string]: any }> => {
  if (!data || data.length === 0) return [];

  return data.map((item) => {
    // Create a new object with a type that allows additional properties
    const processed = { ...item } as T & { [key: string]: any };

    // Format the date if it exists
    if (processed[dateKey]) {
      (processed as Record<string, any>)[`${dateKey}Formatted`] = formatFn(
        processed[dateKey]
      );
    }

    return processed;
  });
};

// Sort data by date
export const sortByDate = <T extends Record<string, any>>(
  data: T[],
  dateKey: string = "date",
  ascending: boolean = true
): T[] => {
  if (!data || data.length === 0) return [];

  return [...data].sort((a, b) => {
    const dateA = new Date(a[dateKey]);
    const dateB = new Date(b[dateKey]);
    return ascending
      ? dateA.getTime() - dateB.getTime()
      : dateB.getTime() - dateA.getTime();
  });
};

// Get color based on value for heatmaps and gradient visualizations
export const getColorByValue = (
  value: number,
  thresholds: [number, string][] = [
    [10, "#82ca9d"], // Low - Green
    [20, "#8884d8"], // Medium-Low - Purple
    [30, "#ffc658"], // Medium - Yellow
    [40, "#ff8042"], // Medium-High - Orange
    [Infinity, "#d32f2f"], // High - Red
  ]
): string => {
  for (const [threshold, color] of thresholds) {
    if (value < threshold) {
      return color;
    }
  }
  return thresholds[thresholds.length - 1][1]; // Default to last color
};

// Calculate progress percentage between start and target
export const calculateProgress = (
  current: number,
  target: number,
  isLowerBetter: boolean = true,
  startValue?: number
): number => {
  if (isLowerBetter) {
    // For metrics where lower is better (like body fat %, VAT mass)
    if (current <= target) return 100; // Already at or below target

    const start = startValue ?? current * 1.2; // Default: assume starting point is 20% higher
    return Math.min(
      100,
      Math.max(0, ((start - current) / (start - target)) * 100)
    );
  } else {
    // For metrics where higher is better (when gaining weight/muscle is the goal)
    if (current >= target) return 100; // Already at or above target

    const start = startValue ?? current * 0.8; // Default: assume starting point is 20% lower
    return Math.min(
      100,
      Math.max(0, ((current - start) / (target - start)) * 100)
    );
  }
};

// Add missing points for line chart interpolation
// This is a stub function that will be implemented later if needed
export const fillMissingDates = <T extends Record<string, any>>(
  data: T[],
  dateKey: string = "date"
): T[] => {
  if (!data || data.length === 0) return [];

  // Sort the data by date
  return sortByDate(data, dateKey);

  // More advanced date filling logic can be implemented in the future if needed
};

// Helper function to get the display name for a field
export const getFieldDisplayName = (fieldKey: string): string => {
  // Convert snake_case to Title Case with proper spacing
  return fieldKey
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

// Helper to get domain for y-axis with appropriate padding
export const getYAxisDomain = (
  data: any[],
  dataKeys: string[],
  padding: number = 0.1
): [number, number | string] => {
  if (!data || data.length === 0 || !dataKeys || dataKeys.length === 0) {
    return [0, "auto" as const];
  }

  let min = Infinity;
  let max = -Infinity;

  // Find min and max values across all specified data keys
  data.forEach((item) => {
    dataKeys.forEach((key) => {
      const value = Number(item[key]);
      if (!isNaN(value)) {
        min = Math.min(min, value);
        max = Math.max(max, value);
      }
    });
  });

  // If we didn't find any valid values
  if (min === Infinity || max === -Infinity) {
    return [0, "auto" as const];
  }

  // Add padding
  const range = max - min;
  min = Math.max(0, min - range * padding); // Don't go below zero for most metrics
  max = max + range * padding;

  return [min, max];
};
