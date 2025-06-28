import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait = 300,
  immediate = false
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return function (...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };

    const callNow = immediate && !timeout;

    if (timeout) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(later, wait);

    if (callNow) {
      func(...args);
    }
  };
}

export const getNestedValue = (obj: any, path: string): any => {
  return path.split(".").reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : undefined;
  }, obj);
};

/**
 * Gets the display unit for a metric, with special handling for time metrics
 * @param metric - The metric object with type and unit properties
 * @returns The unit to display, defaulting to "minutes" for time metrics without a unit
 */
export const getMetricDisplayUnit = (metric: { type?: string; unit?: string }): string => {
  if (metric.unit) {
    return metric.unit;
  }
  
  if (metric.type === "time") {
    return "minutes";
  }
  
  return "";
};
