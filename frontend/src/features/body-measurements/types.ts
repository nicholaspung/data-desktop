export interface BodyMeasurementRecord {
  id: string;
  date: string;
  time?: string;
  measurement: string;
  value: number;
  unit: string;
  private?: boolean;
  createdAt: Date;
  lastModified: Date;
}