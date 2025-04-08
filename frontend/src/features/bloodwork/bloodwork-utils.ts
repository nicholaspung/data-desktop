// Helper function to check if a value is within range
export const isWithinRange = (
  value: number,
  lowerRange?: number,
  upperRange?: number,
  generalRange?: string
): boolean => {
  // Handle text-based ranges
  if (generalRange && (!lowerRange || !upperRange)) {
    return true; // We can't determine for text-based ranges
  }

  // Handle numeric ranges
  if (lowerRange !== undefined && upperRange !== undefined) {
    return value >= lowerRange && value <= upperRange;
  }

  return true; // Default to true if we can't determine
};

// Helper function to check if a value is within optimal range
export const isWithinOptimalRange = (
  value: number,
  optimalLow?: number,
  optimalHigh?: number,
  optimalGeneral?: string
): boolean => {
  // Handle text-based ranges
  if (optimalGeneral && (!optimalLow || !optimalHigh)) {
    return true; // We can't determine for text-based ranges
  }

  // Handle numeric ranges
  if (optimalLow !== undefined && optimalHigh !== undefined) {
    return value >= optimalLow && value <= optimalHigh;
  }

  return true; // Default to true if we can't determine
};
