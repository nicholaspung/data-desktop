import { BloodMarker, BloodResult } from "./bloodwork";

type LatestValue = {
  type: "string" | "number";
  value: string | number;
};

type BadgeInfo = {
  variant: "outline" | "success" | "warning" | "destructive";
  text: string;
};

export const getLatestValue = (latestResult: BloodResult | null) => {
  if (!latestResult) return null;

  const result: LatestValue = {
    type: "number",
    value: parseFloat(latestResult.value_number.toString()) || 0,
  };

  if (latestResult.value_text) {
    result.type = "string";
    result.value = latestResult.value_text;
  }
  return result;
};

export const getBadgeInfo: (
  latestValue: LatestValue | null,
  marker: BloodMarker
) => BadgeInfo = (latestValue, marker) => {
  if (!latestValue) return { variant: "outline", text: "No data" } as BadgeInfo;

  if (latestValue.type === "string") {
    if (
      latestValue.value === marker.general_reference ||
      latestValue.value === marker.optimal_general
    ) {
      return { variant: "success", text: "Optimal" } as BadgeInfo;
    } else {
      return { variant: "outline", text: "Unsure" } as BadgeInfo;
    }
  }

  if (
    isWithinOptimalRange(
      Number(latestValue.value),
      marker.optimal_low,
      marker.optimal_high,
      marker.optimal_general
    )
  ) {
    return { variant: "success", text: "Optimal" } as BadgeInfo;
  } else if (
    isWithinRange(
      Number(latestValue.value),
      marker.optimal_low,
      marker.optimal_high,
      marker.optimal_general
    )
  ) {
    return { variant: "warning", text: "In Range" } as BadgeInfo;
  } else {
    return { variant: "destructive", text: "Out of Range" } as BadgeInfo;
  }
};

export const isWithinRange = (
  value: number,
  lowerRange?: number,
  upperRange?: number,
  generalRange?: string
): boolean => {
  if (generalRange && (!lowerRange || !upperRange)) {
    return true;
  }

  if (lowerRange !== undefined && upperRange !== undefined) {
    return value >= lowerRange && value <= upperRange;
  }

  return true;
};

export const isWithinOptimalRange = (
  value: number,
  optimalLow?: number,
  optimalHigh?: number,
  optimalGeneral?: string
): boolean => {
  if (optimalGeneral && (!optimalLow || !optimalHigh)) {
    return true;
  }

  if (optimalLow !== undefined && optimalHigh !== undefined) {
    return value >= optimalLow && value <= optimalHigh;
  }

  return true;
};

export const hasAnyRangeDefined = (marker: BloodMarker): boolean => {
  return Boolean(
    marker.general_reference ||
      marker.optimal_general ||
      marker.lower_reference ||
      marker.upper_reference ||
      marker.optimal_low ||
      marker.optimal_high
  );
};
