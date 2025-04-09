// Helper to parse metric values
export const parseMetricValue = (value: string, type: string): any => {
  if (!value) {
    switch (type) {
      case "boolean":
        return false;
      case "number":
      case "percentage":
      case "time":
        return 0;
      default:
        return "";
    }
  }

  try {
    const parsed = JSON.parse(value);
    return parsed;
  } catch (e: any) {
    console.error(e);
    // If parsing fails, return appropriate defaults
    switch (type) {
      case "boolean":
        return value === "true";
      case "number":
      case "percentage":
      case "time":
        return Number(value) || 0;
      default:
        return value;
    }
  }
};
