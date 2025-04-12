export interface DexaScan {
  id: string;
  date: Date;
  createdAt: string;
  lastModified: string;
  [key: string]: any;
}

export interface DexaGoal {
  id: string;
  bodyFatPercent: number;
  totalWeightLbs: number;
  vatMassLbs: number;
  createdAt: string; // ISO string
  lastModified: string; // ISO string
}

// Define the body parts and their data points
export interface BodyPart {
  id: string;
  name: string;
  x: number;
  y: number;
  dataPoints: {
    label: string;
    value: number | undefined;
    unit: string;
    color?: string;
  }[];
}

export type ViewMode = "single" | "comparison";
