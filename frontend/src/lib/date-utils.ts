import { format } from "date-fns";

// Format date for charts
export const formatDate = (date: Date) => {
  return format(new Date(date), "MMM d, yyyy");
};

// Define color palette
export const COLORS = [
  "#8884d8", // Purple
  "#82ca9d", // Green
  "#ffc658", // Yellow
  "#ff8042", // Orange
  "#0088fe", // Blue
  "#00C49F", // Teal
  "#FFBB28", // Amber
  "#FF8042", // Coral
];
