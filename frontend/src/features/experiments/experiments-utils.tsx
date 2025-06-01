import { Badge } from "@/components/ui/badge";

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

export const getStatusBadge = (status: string, text: string) => {
  const statusColor = {
    active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    completed: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    paused:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  };

  return (
    <Badge
      variant="outline"
      className={statusColor[status as keyof typeof statusColor] || ""}
    >
      {text}
    </Badge>
  );
};
