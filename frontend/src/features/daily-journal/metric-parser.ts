export interface ParsedMetric {
  type: 'weight' | 'mood' | 'sleep' | 'exercise' | 'energy' | 'custom';
  name: string;
  value: string | number;
  unit?: string;
  originalText: string;
  confidence: number; // 0-1 score for how confident we are in the parsing
}

// Define metric patterns with their parsing rules
const METRIC_PATTERNS = [
  // Weight patterns
  {
    type: 'weight' as const,
    patterns: [
      /(?:weight|weigh|weighed)\s*(?:is|was|:)?\s*(\d+(?:\.\d+)?)\s*(lbs?|pounds?|kg|kilograms?)/gi,
      /(\d+(?:\.\d+)?)\s*(lbs?|pounds?|kg|kilograms?)\s*(?:weight|today|this morning)/gi,
      /i\s*(?:weigh|weight)\s*(\d+(?:\.\d+)?)\s*(lbs?|pounds?|kg|kilograms?)/gi,
    ],
    name: 'Body Weight',
    confidence: 0.9,
  },
  
  // Mood patterns
  {
    type: 'mood' as const,
    patterns: [
      /mood\s*(?:is|was|:)?\s*(\d+)(?:\/10|\/5|\s*out\s*of\s*(?:10|5))/gi,
      /feeling\s*(\d+)(?:\/10|\/5|\s*out\s*of\s*(?:10|5))/gi,
      /mood\s*(?:is|was|:)?\s*(great|good|okay|bad|terrible|amazing|excellent|poor|awful)/gi,
      /feeling\s*(great|good|okay|bad|terrible|amazing|excellent|poor|awful)/gi,
    ],
    name: 'Mood',
    confidence: 0.8,
  },

  // Sleep patterns  
  {
    type: 'sleep' as const,
    patterns: [
      /(?:slept|sleep|got)\s*(?:for)?\s*(\d+(?:\.\d+)?)\s*(?:hours?|hrs?)/gi,
      /(\d+(?:\.\d+)?)\s*(?:hours?|hrs?)\s*(?:of\s*)?sleep/gi,
      /sleep\s*(?:was|is|:)?\s*(\d+(?:\.\d+)?)\s*(?:hours?|hrs?)/gi,
    ],
    name: 'Sleep Duration',
    confidence: 0.9,
  },

  // Exercise patterns
  {
    type: 'exercise' as const,
    patterns: [
      /(?:did|ran|running|walked|walking|exercised?)\s*(?:for)?\s*(\d+)\s*(?:minutes?|mins?|hours?|hrs?)/gi,
      /(\d+)\s*(?:minutes?|mins?|hours?|hrs?)\s*(?:of\s*)?(running|walking|biking|cycling|swimming|workout|exercise)/gi,
    ],
    name: 'Exercise Duration',
    confidence: 0.8,
  },

  // Energy patterns
  {
    type: 'energy' as const,
    patterns: [
      /energy\s*(?:is|was|level|:)?\s*(\d+)(?:\/10|\/5|\s*out\s*of\s*(?:10|5))/gi,
      /energy\s*(?:is|was|level|:)?\s*(high|low|medium|good|bad|great|terrible|amazing|excellent|poor)/gi,
      /feeling\s*(energetic|tired|exhausted|energized|drained)/gi,
    ],
    name: 'Energy Level',
    confidence: 0.7,
  },
];

// Convert mood words to numbers
const MOOD_WORDS_TO_NUMBERS: Record<string, number> = {
  'terrible': 1,
  'awful': 1,
  'poor': 2,
  'bad': 3,
  'okay': 5,
  'good': 7,
  'great': 8,
  'amazing': 9,
  'excellent': 10,
};

// Convert energy words to numbers
const ENERGY_WORDS_TO_NUMBERS: Record<string, number> = {
  'exhausted': 1,
  'drained': 2,
  'tired': 3,
  'low': 3,
  'medium': 5,
  'good': 7,
  'high': 8,
  'energetic': 9,
  'energized': 9,
};

export function parseMetricsFromText(text: string): ParsedMetric[] {
  const metrics: ParsedMetric[] = [];
  const processedRanges: Array<{start: number, end: number}> = [];

  for (const metricType of METRIC_PATTERNS) {
    for (const pattern of metricType.patterns) {
      let match;
      const regex = new RegExp(pattern.source, pattern.flags);
      
      while ((match = regex.exec(text)) !== null) {
        const matchStart = match.index;
        const matchEnd = match.index + match[0].length;
        
        // Check if this text range has already been processed
        const isOverlapping = processedRanges.some(range => 
          (matchStart >= range.start && matchStart <= range.end) ||
          (matchEnd >= range.start && matchEnd <= range.end)
        );
        
        if (isOverlapping) continue;

        const [fullMatch, value, unit] = match;
        let parsedValue: string | number = value;
        let parsedUnit = unit;

        // Special processing for different metric types
        if (metricType.type === 'mood') {
          if (isNaN(Number(value))) {
            // Convert word to number
            const lowerValue = value.toLowerCase();
            if (MOOD_WORDS_TO_NUMBERS[lowerValue]) {
              parsedValue = MOOD_WORDS_TO_NUMBERS[lowerValue];
              parsedUnit = '/10';
            }
          } else {
            parsedValue = Number(value);
            parsedUnit = unit || '/10';
          }
        } else if (metricType.type === 'energy') {
          if (isNaN(Number(value))) {
            const lowerValue = value.toLowerCase();
            if (ENERGY_WORDS_TO_NUMBERS[lowerValue]) {
              parsedValue = ENERGY_WORDS_TO_NUMBERS[lowerValue];
              parsedUnit = '/10';
            }
          } else {
            parsedValue = Number(value);
            parsedUnit = unit || '/10';
          }
        } else if (metricType.type === 'weight') {
          parsedValue = Number(value);
          parsedUnit = unit?.toLowerCase().replace(/s$/, '') || 'lbs'; // Remove plural 's'
        } else if (metricType.type === 'sleep') {
          parsedValue = Number(value);
          parsedUnit = 'hours';
        } else if (metricType.type === 'exercise') {
          parsedValue = Number(value);
          // Determine unit from the match or default to minutes
          if (unit && (unit.includes('hour') || unit.includes('hr'))) {
            parsedUnit = 'hours';
          } else {
            parsedUnit = 'minutes';
          }
        }

        metrics.push({
          type: metricType.type,
          name: metricType.name,
          value: parsedValue,
          unit: parsedUnit,
          originalText: fullMatch.trim(),
          confidence: metricType.confidence,
        });

        // Mark this range as processed
        processedRanges.push({ start: matchStart, end: matchEnd });
      }
    }
  }

  // Sort by confidence (highest first) and remove duplicates
  return metrics
    .sort((a, b) => b.confidence - a.confidence)
    .filter((metric, index, array) => 
      // Remove duplicates based on type and similar values
      array.findIndex(m => 
        m.type === metric.type && 
        Math.abs(Number(m.value) - Number(metric.value)) < 0.1
      ) === index
    );
}

// Helper function to get suggested metric patterns for the UI
export function getMetricSuggestions(): Array<{pattern: string, example: string, type: string}> {
  return [
    { pattern: "weight: {number} lbs", example: "I weigh 150 lbs", type: "weight" },
    { pattern: "mood: {number}/10", example: "My mood is 8/10", type: "mood" },
    { pattern: "mood: {word}", example: "Feeling great today", type: "mood" },
    { pattern: "slept {number} hours", example: "I slept 7 hours", type: "sleep" },
    { pattern: "did {number} minutes {activity}", example: "Did 30 minutes running", type: "exercise" },
    { pattern: "energy: {word}", example: "My energy level is high", type: "energy" },
  ];
}