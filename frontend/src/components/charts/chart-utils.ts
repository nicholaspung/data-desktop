import { format } from "date-fns";

export const CHART_COLORS = [
  "#8884d8",
  "#82ca9d",
  "#ffc658",
  "#ff8042",
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#a4de6c",
  "#d0ed57",
  "#83a6ed",
  "#8dd1e1",
  "#FF6B6B",
  "#6A6CFF",
  "#A06AFF",
];

export const formatChartDate = (date: Date | string): string => {
  if (!date) return "";

  const dateObj = typeof date === "string" ? new Date(date) : date;
  return format(dateObj, "MMM d, yyyy");
};

export const preprocessChartData = <T extends Record<string, any>>(
  data: T[],
  dateKey: string = "date",
  formatFn: (date: Date | string) => string = formatChartDate
): Array<T & { [key: string]: any }> => {
  if (!data || data.length === 0) return [];

  return data.map((item) => {
    const processed = { ...item } as T & { [key: string]: any };

    if (processed[dateKey]) {
      (processed as Record<string, any>)[`${dateKey}Formatted`] = formatFn(
        processed[dateKey]
      );
    }

    return processed;
  });
};

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

export const getColorByValue = (
  value: number,
  thresholds: [number, string][] = [
    [10, "#82ca9d"],
    [20, "#8884d8"],
    [30, "#ffc658"],
    [40, "#ff8042"],
    [Infinity, "#d32f2f"],
  ]
): string => {
  for (const [threshold, color] of thresholds) {
    if (value < threshold) {
      return color;
    }
  }
  return thresholds[thresholds.length - 1][1];
};

export const calculateProgress = (
  current: number,
  target: number,
  isLowerBetter: boolean = true,
  startValue?: number
): number => {
  if (isLowerBetter) {
    if (current <= target) return 100;

    const start = startValue ?? current * 1.2;
    return Math.min(
      100,
      Math.max(0, ((start - current) / (start - target)) * 100)
    );
  } else {
    if (current >= target) return 100;

    const start = startValue ?? current * 0.8;
    return Math.min(
      100,
      Math.max(0, ((current - start) / (target - start)) * 100)
    );
  }
};

export const fillMissingDates = <T extends Record<string, any>>(
  data: T[],
  dateKey: string = "date"
): T[] => {
  if (!data || data.length === 0) return [];

  return sortByDate(data, dateKey);
};

export const getFieldDisplayName = (fieldKey: string): string => {
  return fieldKey
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

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

  data.forEach((item) => {
    dataKeys.forEach((key) => {
      const value = Number(item[key]);
      if (!isNaN(value)) {
        min = Math.min(min, value);
        max = Math.max(max, value);
      }
    });
  });

  if (min === Infinity || max === -Infinity) {
    return [0, "auto" as const];
  }

  const range = max - min;
  min = Math.max(0, min - range * padding);
  max = max + range * padding;

  return [min, max];
};

export const defaultFormatter = (value: any, name: string, props: any) => {
  let displayValue = value?.toFixed(2) || 0;
  const unit = props.unit || "";

  if (
    name.toLowerCase().includes("percentage") ||
    name.toLowerCase().includes("%")
  ) {
    displayValue = `${displayValue}%`;
  } else if (unit) {
    displayValue = `${displayValue} ${unit}`;
  }

  return displayValue;
};

export const defaultGetColorByValue = (value: number) => {
  if (value < 10) return "#82ca9d";
  if (value < 20) return "#8884d8";
  if (value < 30) return "#ffc658";
  if (value < 40) return "#ff8042";
  return "#d32f2f";
};
