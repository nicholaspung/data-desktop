import { ColumnDef } from "@tanstack/react-table";

export const calculateColumnWidth = (
  column: ColumnDef<any, any>,
  data: any[] = []
): string => {
  const headerText = String(column.header || column.id);
  const headerLength = headerText.length;

  let contentMaxLength = headerLength;

  const sampleSize = Math.min(data.length, 100);
  const sampleData = data.slice(0, sampleSize);

  for (const row of sampleData) {
    const value = row[column.id as string];
    if (value !== undefined && value !== null) {
      const valueStr = String(value);
      contentMaxLength = Math.max(contentMaxLength, valueStr.length);
    }
  }

  let widthMultiplier = 10;

  const isBoolean = column.id
    ? column.id.toLowerCase().includes("is_") ||
      column.id.toLowerCase().includes("has_") ||
      column.id.toLowerCase() === "fasted" ||
      column.id.toLowerCase() === "completed"
    : false;

  if (isBoolean) {
    widthMultiplier = 6;
  } else if (
    column.id &&
    (column.id.toLowerCase().includes("date") ||
      column.id.toLowerCase().includes("time"))
  ) {
    widthMultiplier = 12;
  }

  const calculatedWidth = Math.max(contentMaxLength * widthMultiplier, 80);

  const maxWidth = 300;
  const finalWidth = Math.min(calculatedWidth, maxWidth);

  return `${finalWidth}px`;
};
