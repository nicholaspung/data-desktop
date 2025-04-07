// src/components/data-table/table-width-utils.ts
import { ColumnDef } from "@tanstack/react-table";

/**
 * Calculate appropriate column width based on content
 * Used by both the regular DataTable and EditableDataTable components
 */
export const calculateColumnWidth = (
  column: ColumnDef<any, any>,
  data: any[]
): string => {
  // Get header text length
  const headerText = String(column.header || column.id);
  const headerLength = headerText.length;

  // Find the maximum content length for this column
  let contentMaxLength = headerLength;

  // Sample at most 100 rows to avoid performance issues with large datasets
  const sampleSize = Math.min(data.length, 100);
  const sampleData = data.slice(0, sampleSize);

  for (const row of sampleData) {
    const value = row[column.id as string];
    if (value !== undefined && value !== null) {
      // Convert the value to a string and measure its length
      const valueStr = String(value);
      contentMaxLength = Math.max(contentMaxLength, valueStr.length);
    }
  }

  // Apply a multiplier based on the field type
  // These can be adjusted based on your UI needs
  let widthMultiplier = 10; // Default character width multiplier

  // Use the column ID to determine if it's a boolean column
  const isBoolean = column.id
    ? column.id.toLowerCase().includes("is_") ||
      column.id.toLowerCase().includes("has_") ||
      column.id.toLowerCase() === "fasted" ||
      column.id.toLowerCase() === "completed"
    : false;

  if (isBoolean) {
    // Boolean columns can be narrower
    widthMultiplier = 6;
  } else if (
    column.id &&
    (column.id.toLowerCase().includes("date") ||
      column.id.toLowerCase().includes("time"))
  ) {
    // Date columns need more space
    widthMultiplier = 12;
  }

  // Calculate the width with a minimum to ensure usability
  const calculatedWidth = Math.max(contentMaxLength * widthMultiplier, 80);

  // Cap the maximum width for very long content
  const maxWidth = 300;
  const finalWidth = Math.min(calculatedWidth, maxWidth);

  return `${finalWidth}px`;
};
