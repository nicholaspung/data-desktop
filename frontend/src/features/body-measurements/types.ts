export interface BodyMeasurementRecord {
  id: string;
  date: string;
  time?: string;
  measurement: string;
  value: number;
  unit: string;
  createdAt: Date;
  lastModified: Date;
}